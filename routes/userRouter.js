const express = require("express")
const router = express.Router();
const passport = require("passport") 
const userController = require("../controllers/user/userController")
const profileController = require("../controllers/user/profileController")
const {userAuth,adminAuth} = require("../middlewares/auth")

router.get("/pageNotFound",userController.pageNotFound)
router.get("/login",userController.loadLogin)
router.post('/login',userController.postLogin)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.postSignup)
router.post("/verify-otp",userController.verifyOTP)
router.post("/resend-otp",userController.resendOTP)
router.get('/sign-up',userController.finishSignup)
router.post('/sign-up',userController.postFinishSignup)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.user = req.user;
    res.redirect('/')
})
router.get('/logout',userController.logout)

// After Login Routes
router.get("/",userController.loadHomePage)
router.get("/home",userController.loadHomePage)
router.get("/shop",userController.loadShop)


// Profile Management
router.get('/forgot-password',profileController.getForgotPass) //Before Login
router.post('/forgot-password',profileController.postForgotPass)
router.get('/new-password',profileController.getNewPass) //Before Login
router.post('/new-password',profileController.postNewPass)
router.get('/userProfile',userAuth,profileController.getProfile)
router.post('/editProfile',profileController.postEditProfile);
router.get('/newEmail',userAuth,profileController.getNewEmail);
router.get('/change-password',userAuth,profileController.getChangePassword);
router.post('/change-password',profileController.postChangePassword);
router.get('/forgotPassword',userAuth,profileController.getForgotPassword); //After Login Forgot Password
router.delete('/delete-account',profileController.deleteAccount);
router.get('/manage-address',userAuth,profileController.getManageAddress);
router.post('/add-address',profileController.postAddAddress);
router.post('/edit-address',profileController.postEditAddress);
router.get('/saved-upi',userAuth,profileController.getSavedUpi);
router.delete('/delete-address',profileController.deleteAddress);

module.exports = router;