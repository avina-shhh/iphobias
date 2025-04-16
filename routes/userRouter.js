const express = require("express")
const router = express.Router();
const passport = require("passport") 
const userController = require("../controllers/user/userController")
const profileController = require("../controllers/user/profileController")

router.get("/pageNotFound",userController.pageNotFound)
router.get("/",userController.loadHomePage)
router.get("/home",userController.loadHomePage)
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


// Profile Management
router.get('/forgot-password',profileController.getForgotPass)
router.post('/forgot-password',profileController.postForgotPass)
router.get('/new-password',profileController.getNewPass)
router.post('/new-password',profileController.postNewPass)
router.get('/userProfile',profileController.getProfile)
router.post('/editProfile',profileController.postEditProfile);
router.get('/newEmail',profileController.getNewEmail);
router.get('/change-password',profileController.getChangePassword);
router.post('/change-password',profileController.postChangePassword);
router.get('/forgotPassword',profileController.getForgotPassword);
router.delete('/delete-account',profileController.deleteAccount);

module.exports = router;