const User = require("../../models/userSchema")
const nodemailer = require("nodemailer")
const env = require("dotenv").config();
const bcrypt = require("bcrypt")

const pageNotFound = async(req,res)=>{
    try {
        
        res.render("404")

    } catch (error) {
        console.log("Page Not Found")
        res.redirect("/pageNotFound")

    }
}

const loadHomePage = async(req,res)=>{

    try {
        
        const user = req.session.user;
        if(user){
            const userData = await User.findOne({_id:user})
            return res.render('home',{user : userData})
        }else{
            return res.render("home")
        }
    } catch (error) {
        console.log("Home Page Not Found")
        res.status(500).send("Server Error")
        
    }
    
}

const loadSignup = async(req,res)=>{
    try {

        if(!req.session.user){
            return res.render('signup')
        }else{
            res.redirect('/')
        }
    
    } catch (error) {
        console.log("Sign-Up Not Found",error.message)
        res.status(500).send('Server Error')
    }
}



function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}



async function sendOtp(mail,otp,name){
    try {
        
        const transporter = nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASS
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL, // Sender email address
            to : mail, 
            subject: "Verify your account for iPhobias", // Email subject
            text: `Dear ${name},
        
            Thank you for signing up for iPhobias! To complete your account verification, please use the following One-Time Password (OTP):
            
            OTP : ${otp}
            
            This OTP is valid for 5 minutes. Please do not share it with anyone.
        
        If you did not attempt to sign up for iPhobias, please ignore this email.
        
        Welcome to iPhobias! We’re excited to have you on board.
        
        Best Regards,
        iPhobias Ltd.
        98754XXXXX`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Dear ${name},</h2>
                    <p>Thank you for signing up for <strong>iPhobias</strong>! To complete your account verification, please use the following One-Time Password (OTP):</p>
                    <h3 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">OTP: ${otp}</h3>
                    <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
                    <p>If you did not attempt to sign up for iPhobias, please ignore this email.</p>
                    <p>Welcome to <strong>iPhobias</strong>! We’re excited to have you on board.</p>
                    <p>Best Regards,<br><strong>iPhobias Ltd.</strong><br>98754XXXXX</p>
                </div>
            `
        })

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email",error);
        return false
    }
}


const postSignup = async(req,res)=>{
    try {
        const {name,email,phone,password} = req.body;

        const findUser = await User.findOne({$or : [{email : email},{phone :phone}]});
        if(findUser){
            return res.render('signup',{ msg : "*User with this email or phone already exists" })
        }

        const otp = generateOtp();

        const emailSend = await sendOtp(email,otp,name);
        if(!emailSend){
            return res.json("email-error")
        }

        req.session.userOTP = otp;
        req.session.userData = {email,password,name,phone};

        res.render("otp");
        console.log("OTP sent :",otp)


    } catch (error) {
        console.error("Signup error",error);
        res.redirect("/pageNotFound")
    }
}

const securePass = async(password) => {
    try {
        const passHash = await bcrypt.hash(password,10)

        return passHash;

    } catch (error) {
        
    }
}

const verifyOTP = async(req,res)=>{
    try {
        const {otp} = req.body;
        console.log("OTP Entered :",otp);

        if(otp === req.session.userOTP){
            const user = req.session.userData
            const passHash = await securePass(user.password);

            const saveUserData = new User({
                name : user.name,
                email : user.email,
                phone : user.phone,
                password : passHash
            })

            await saveUserData.save();
            console.log(saveUserData)

            req.session.user = saveUserData._id;

            res.json({success:true,redirectUrl:'/'});
        }else{
            res.status(400).json({success:false,message:"Invalid OTP, Please try again"})

        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({success:false,message:"An Error Occured"})
    }
}

const resendOTP = async(req,res)=>{
    try {
        
        const {email,name}  = req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp = generateOtp()
        req.session.userOTP = otp;
        req.session.save();

        const emailSend = await sendOtp(email,otp,name);
        if(emailSend){
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
            return console.log("Resend OTP : ",otp)
        }else{
            res.status(500).json({success:false,message:"Failed to resend OTP. Please try again"})
        }


    } catch (error) {
        console.error("Error Resending OTP",error)
        res.status(500).json({success:false,message:"Internal Server Error. Please try again"})
    }
}

const loadLogin = async(req,res)=>{
    try {
        
        if(!req.session.user){
            return res.render('login')
        }else{
            res.redirect('/')
        }

    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const postLogin = async(req,res)=>{
    try {
        const {email,password} = req.body
        
        const findUser = await User.findOne({isAdmin:0,email:email});

        if(!findUser){
            return res.render('login',{message:"*User not found"})
        }

        if(findUser.isBlocked){
            return res.render('login',{message:"*User has been blocked by admin"})
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password)
        if(!passwordMatch){
            return res.render('login',{message:"*Incorrect password"})
        }

        req.session.user = findUser._id

        res.redirect('/')


    } catch (error) {
        console.error("Login error",error)
        res.render('login',{message:"Login failed, please try again later"})
    }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("Session destruction error",err.message);
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/login')
        })
    } catch (error) {
        console.log("Logout Failed",error);
        return res.redirect('/pageNotFound')
    }
}

module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup,
    postSignup,
    verifyOTP,
    resendOTP,
    loadLogin,
    postLogin,
    logout
} 