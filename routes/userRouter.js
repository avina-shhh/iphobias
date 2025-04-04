const express = require("express")
const router = express.Router();
const passport = require("passport") 
const userController = require("../controllers/user/userController")


router.get("/pageNotFound",userController.pageNotFound)
router.get("/",userController.loadHomePage)
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
    res.redirect('/')
})
router.get('/forgot-password',userController.getForgotPass)
router.post('/forgot-password',userController.postForgotPass)
router.get('/new-password',userController.getNewPass)
router.post('/new-password',userController.postNewPass)
router.get('/logout',userController.logout)

module.exports = router;