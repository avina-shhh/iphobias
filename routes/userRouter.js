const express = require("express")
const router = express.Router();
const passport = require("passport") 
const userController = require("../controllers/user/userController")
const profileController = require("../controllers/user/profileController")
const {userAuth} = require("../middlewares/auth")
const productController = require("../controllers/user/productController")
const cartController = require("../controllers/user/cartController")
const wishlistController = require('../controllers/user/wishlistController');

// Error Pages
router.get("/pageNotFound", userController.pageNotFound)


// Authentication Routes
router.get("/login", userController.loadLogin)
router.post('/login', userController.postLogin)
router.get("/signup", userController.loadSignup)
router.post("/signup", userController.postSignup)
router.get('/logout', userController.logout)


// OTP Verification Routes
router.post("/verify-otp", userController.verifyOTP)
router.post("/resend-otp", userController.resendOTP)
router.get('/sign-up', userController.finishSignup)
router.post('/sign-up', userController.postFinishSignup)


// Google Authentication Routes
router.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));
router.get('/auth/google/callback', 
    passport.authenticate('google', {failureRedirect: '/signup'}),
    (req, res) => {
        req.session.user = req.user;
        res.redirect('/')
    }
)


// Main Page Routes
router.get("/", userController.loadHomePage)
router.get("/home", userController.loadHomePage)
router.get("/shop", userController.loadShop)
router.get("/product-details", productController.productDetails)


// Password Management Routes (Before Login)
router.get('/forgot-password', profileController.getForgotPass) //Before Login
router.post('/forgot-password', profileController.postForgotPass)
router.get('/new-password', profileController.getNewPass) //Before Login
router.post('/new-password', profileController.postNewPass)


// Profile Management Routes (After Login)
router.get('/userProfile', userAuth, profileController.getProfile)
router.post('/editProfile', profileController.postEditProfile)
router.get('/newEmail', userAuth, profileController.getNewEmail)


// Password Management Routes (After Login)
router.get('/change-password', userAuth, profileController.getChangePassword)
router.post('/change-password', profileController.postChangePassword)
router.get('/forgotPassword', userAuth, profileController.getForgotPassword) //After Login Forgot Password


// Account Management Routes
router.delete('/delete-account', profileController.deleteAccount)


// Address Management Routes
router.get('/manage-address', userAuth, profileController.getManageAddress)
router.post('/add-address', profileController.postAddAddress)
router.post('/edit-address', profileController.postEditAddress)
router.delete('/delete-address', profileController.deleteAddress)


// Payment Management Routes
router.get('/saved-upi', userAuth, profileController.getSavedUpi)


// Add to Cart Routes
router.post('/add-to-cart', userAuth, productController.addToCart);


// Cart Routes
router.get('/cart', userAuth, cartController.getCart);
router.post('/cart/update', userAuth, cartController.updateCart);
router.post('/cart/remove', userAuth, cartController.removeFromCart);
router.post('/cart/select-address', userAuth, cartController.selectShippingAddress);

// Wishlist Routes
router.post('/addToWishlist', wishlistController.addToWishlist);
router.post('/wishlist/remove', userAuth, wishlistController.removeFromWishlist);
router.get('/wishlist', userAuth, wishlistController.getWishlist);

module.exports = router;