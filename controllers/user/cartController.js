const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Address = require('../../models/addressSchema');
const User = require('../../models/userSchema');

const getCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
         // Calculate subtotal
         let subtotal = 0;
         if (cart && cart.items.length > 0) {
             subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
         }
        // Fetch addresses for the user
        let addresses = [];
        const addressDoc = await Address.findOne({ userId });
        if (addressDoc && addressDoc.address && addressDoc.address.length > 0) {
            addresses = addressDoc.address;
        }
        let selectedAddress = null;
        if (addresses.length > 0) {
            if (req.session.address) {
                selectedAddress = addresses.find(addr => addr._id.toString() === req.session.address);
            }
            if (!selectedAddress) selectedAddress = addresses[0];
        }
        res.render('cart', { cart, subtotal, addresses, selectedAddress, user });
    } catch (err) {
        res.redirect('/pageNotFound');
    }
};

const updateCart = async(req,res)=>{
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid cart items data' 
            });
        }

        const cart = await Cart.findOne({ userId: req.session.user._id });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        // Update each item in the cart
        items.forEach(updateItem => {
            const cartItem = cart.items.find(item => item._id.toString() === updateItem.itemId);
            if (cartItem) {
                cartItem.quantity = updateItem.quantity;
                cartItem.totalPrice = cartItem.price * updateItem.quantity;
            }
        });

        await cart.save();

        res.json({ 
            success: true, 
            message: 'Cart updated successfully'
        });
    } catch (error) {
        console.error('Error in updateCart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating cart' 
        });
    }
};

const removeFromCart = async(req, res) => {
    try {
        const { itemId } = req.body;
        
        if (!itemId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Item ID is required' 
            });
        }

        const cart = await Cart.findOne({ userId: req.session.user._id });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        // Remove the item from cart
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();

        res.json({ 
            success: true, 
            message: 'Item removed from cart successfully' 
        });
    } catch (error) {
        console.error('Error in removeFromCart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing item from cart' 
        });   
    }
};

const selectShippingAddress = (req, res) => {
    const { addressId } = req.body;
    req.session.address = addressId;
    res.json({ success: true });
};

module.exports = {
    getCart,
    updateCart,
    removeFromCart,
    selectShippingAddress
};
