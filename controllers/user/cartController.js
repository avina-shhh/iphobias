const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Address = require('../../models/addressSchema');
const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const Wishlist = require('../../models/wishlistSchema');

const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');
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
        res.render('cart', { cart, subtotal, addresses, selectedAddress, user, wishlist });
    } catch (err) {
        console.error('Error fetching cart:', err);
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

const placeOrder = async(req,res)=>{
    try {
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Get selected address (you may get this from session or req.body)
        const addressId = req.body.addressId || req.session.address;
        if (!addressId) {
            return res.status(400).json({ success: false, message: 'No shipping address selected' });
        }

        // Prepare order items
        const orderedItems = cart.items.map(item => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.price
        }));

        // Calculate totals
        const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = 0; // Add your discount logic if needed
        let finaPrice = totalPrice;
        if(totalPrice < 1000){
            finalPrice = totalPrice + 50;
        }
        

        // Create order
        const order = new Order({
            orderedItems,
            totalPrice,
            discount,
            finalPrice,
            address: addressId,
            status: 'Pending',
            couponApplied: false // Set to true if coupon applied
        });

        await order.save();

        // Update user's order history
        await User.findByIdAndUpdate(
            userId,
            { $push: { orderHistory: order._id } }
        );

        // Optionally, clear the cart
        cart.items = [];
        await cart.save();

        // Return the orderId
        return res.json({ success: true, orderId: order.orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const getOrder = async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        // Get user with populated orderHistory
        const user = await User.findById(userId)
            .populate({
                path: 'orderHistory',
                populate: {
                    path: 'orderedItems.product',
                    model: 'Product'
                },
                options: { sort: { 'createdOn': -1 } }
            });

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');

        res.render('order', { 
            user: req.session.user, 
            orders: user.orderHistory, 
            cart, 
            wishlist 
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.redirect('/pageNotFound');
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.session.user._id;

        // Find the order in user's orderHistory
        const user = await User.findById(userId).populate('orderHistory');
        const order = user.orderHistory.find(order => order._id.toString() === orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled (only pending orders)
        if (order.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending orders can be cancelled'
            });
        }

        // Update order status to cancelled
        await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });

        return res.json({
            success: true,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return res.status(500).json({
            success: false,
            message: 'Error cancelling order'
        });
    }
};


const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in rupees
        if (!amount) {
            return res.status(400).json({ success: false, message: 'Amount is required' });
        }
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: "order_rcptid_" + Date.now()
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Could not create Razorpay order' });
    }
};


module.exports = {
    getCart,
    updateCart,
    removeFromCart,
    selectShippingAddress,
    placeOrder,
    getOrder,
    cancelOrder,
    createRazorpayOrder
};
