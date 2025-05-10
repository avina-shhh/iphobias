const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Brand = require('../../models/brandSchema');
const Cart = require('../../models/cartSchema');


const productDetails = async (req, res) => {
    try {
        
        // First get all listed categories and non-blocked brands
        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });
        
        // Get IDs for categories and brand names for products
        const categoryIds = categories.map(category => category._id);
        const brandNames = brands.map(brand => brand.brandName);

        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const cart = await Cart.findOne({userId:userId});

        // Base filter to ensure we only get products with listed categories and non-blocked brands
        const filter = {
            isBlocked: false,
            quantity: { $gt: 0 },
            category: { $in: categoryIds },
            brand: { $in: brandNames },  // Using brand names instead of IDs
            _id:{$ne:productId}
        }

        const products = await Product.find(filter).limit(8)
        const findCategory = product.category;
        const categoryOffer = findCategory ? findCategory.categoryOffer : 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        // Fetch the brand document using the brand name
        const brand = await Brand.findOne({ brandName: product.brand });

        res.render('product-details',{
            user: userData,
            product: product,
            totalOffer: totalOffer,
            quantity: product.quantity,
            category: findCategory,
            brand: brand,
            products: products,
            cart:cart
        });

        


    } catch (error) {
        console.error("Error in product details controller", error);
        res.redirect('/pageNotFound');
    }
}

const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, quantity } = req.body;
        const qty = parseInt(quantity) || 1;

        // Find or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if product already in cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        if (itemIndex > -1) {
            // Increment quantity
            cart.items[itemIndex].quantity += qty;
            cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * product.salePrice;
        } else {
            // Add new item
            cart.items.push({
                productId,
                quantity: qty,
                price: product.salePrice,
                totalPrice: qty * product.salePrice
            });
        }

        await cart.save();
        return res.json({ success: true });
    } catch (err) {
        if (!req.session.user) {
            return res.json({ redirect: '/login' });
        }
        console.error("Error in addToCart", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    productDetails,
    addToCart
}
