const Wishlist = require('../../models/wishlistSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const User = require('../../models/userSchema');

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.json({ redirect: '/login' });
        }

        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }

        // Check if product already in wishlist
        const productExists = wishlist.products.some(item => item.productId.toString() === productId);
        if (productExists) {
            return res.json({ success: true, message: 'Product already in wishlist' });
        }

        // Add product to wishlist
        wishlist.products.push({ productId });
        await wishlist.save();

        return res.json({ success: true, message: 'Product added to wishlist' });
    } catch (err) {
        console.error('Error in addToWishlist:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        // Remove product from wishlist
        wishlist.products = wishlist.products.filter(item => item.productId.toString() !== productId);
        await wishlist.save();

        return res.json({ success: true, message: 'Product removed from wishlist' });
    } catch (err) {
        console.error('Error in removeFromWishlist:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const user = await User.findById(userId);
        
        res.render('wishlist', { wishlist, cart, user });
    } catch (err) {
        console.error('Error in getWishlist:', err);
        res.redirect('/pageNotFound');
    }
};

module.exports = {
    addToWishlist,
    removeFromWishlist,
    getWishlist
};