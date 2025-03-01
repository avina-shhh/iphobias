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
        
        return res.render("home")

    } catch (error) {
        console.log("Home Page Not Found")
        res.status(500).send("Server Error")

    }

}


async function sendOtp(email,otp,name){
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
            to: email, // Recipient email address
            subject: "Verify your account for iPhobias", // Email subject
            text: `Dear ${name},
        
            Thank you for signing up for iPhobias! To complete your account verification, please use the following One-Time Password (OTP):
            
            OTP: ${otp}
            
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
            `,
        });

        return info.accepted.length>0

    } catch (error) {
        console.error("Error sending email",email);
        return false
    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const loadSignup = async(req,res)=>{
    try {
        if(req.session.taken){
            req.session.taken = false;
            return res.render('signup',{ msg : "*User with this email already exists" })
        }
    
        res.render("signup")
    
    } catch (error) {
        console.log("Sign-Up Not Found",error.message)
        res.redirect("/pageNotFound")
    }
}

const postSignup = async(req,res)=>{
    try {
        const {email,password,name,phone} = req.body;

        const findUser = await User.findOne({email});
        if(findUser){
            req.session.taken = true;
            return res.redirect("/signup")
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
        console.log(otp);

        if(otp == req.session.userOTP){
            const user = req.session.userData
            const passHash = await securePass(user.password);

            const saveUserData = new User({
                name : user.name,
                email : user.email,
                phone : user.phone,
                password : passHash
            })

            await saveUserData.save();

            req.session.user = saveUserData._id;
            res.json({
                success:true,
                redirectUrl:"/"
            })

        }else{
            res.status(400).json({success:false,message:"Invalid OTP, Please try again"})

        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({success:false,message:"An Error Occured"})
    }
}

module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup,
    postSignup,
    verifyOTP
} 