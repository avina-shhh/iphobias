const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Banner = require('../../models/BannerSchema');
const nodemailer = require("nodemailer")
const env = require("dotenv").config();
const bcrypt = require("bcrypt");


function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}


const securePass = async(password) => {
    try {
        const passHash = await bcrypt.hash(password,10)

        return passHash;

    } catch (error) {
        
    }
}

async function sendForgotOtp(mail,otp){
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
            to: mail, 
            subject: "Reset Your Password - iPhobias", // Email subject
            text: `Dear User,
        
        We received a request to reset your password for your iPhobias account. Please use the following One-Time Password (OTP) to set a new password:
        
        OTP: ${otp}
        
        This OTP is valid for 5 minutes. If you did not request a password reset, please ignore this email.
        
        For security reasons, do not share this OTP with anyone.
        
        Best Regards,
        iPhobias Ltd.
        98754XXXXX`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Dear User,</h2>
                    <p>We received a request to reset your password for your <strong>iPhobias</strong> account.</p>
                    <p>Please use the following One-Time Password (OTP) to set a new password:</p>
                    <h3 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">OTP: <strong>${otp}</strong></h3>
                    <p>This OTP is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
                    <p>For security reasons, do not share this OTP with anyone.</p>
                    <p>Best Regards,<br><strong>iPhobias Ltd.</strong><br>98754XXXXX</p>
                </div>
            `
        });

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email",error);
        return false
    }
}


const getForgotPass = async(req,res)=>{
    try {
        if(req.session.user){
            return res.redirect('/')
        }
        res.render('forgotpass')
    } catch (error) {
        console.error("getForgotPass Error",error)
        res.redirect('/pageNotFound')
    }
}

const postForgotPass = async(req,res)=>{
    try {
        const ephone = req.body.ephone.trim();
        const findUser = await User.findOne({$or:[
            {phone:ephone},
            {email:ephone}
        ]})
        if(!findUser){
           return res.render('forgotpass',{msg:"*User not found"})
        }
        
        const otp = generateOtp();

        const emailSend = await sendForgotOtp(findUser.email,otp);
        if(!emailSend){
            console.log('OTP not send from forgot-password')
            return res.redirect('/pageNotFound')
        }

        req.session.userOTP = otp;
        req.session.forgotPass = true;
        req.session.userData = findUser.email;

        res.render("otp");
        console.log("OTP sent :",otp)

    } catch (error) {
        console.error("postForgotPass Error",error)
        res.redirect('/pageNotFound')
    }
}

const getNewPass = async(req,res)=>{
    try {
        if(req.session.validForNewPass){
            res.render('newPass');
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.error("getNewPass Error",error)
        res.redirect('/pageNotFound')
    }
}

const postNewPass = async(req,res)=>{
    try {
        const passHash = await securePass(req.body.password);
        const findUser = await User.findOneAndUpdate({$or:[
            {phone:req.session.userData},
            {email:req.session.userData}
        ]},{$set:{password:passHash}})

        req.session.user = findUser._id;
        res.json({success:true,redirectUrl:'/'});
    } catch (error) {
        console.error("postNewPass Error",error)
        res.redirect('/pageNotFound')
    }
}

const getProfile = async(req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render('profile',{
            user:userData
        })
    } catch (error) {
        console.error("Error in getProfile",error);
        res.redirect('/pageNotFound')
    }
}

async function sendNewEmailOtp(mail,otp){
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
            subject: "Verify your email for iPhobias", // Email subject
            text: `Dear User,
        
            Thank you for using iPhobias! To complete your new email verification, please use the following One-Time Password (OTP):
            
            OTP : ${otp}
            
            This OTP is valid for 5 minutes. Please do not share it with anyone.
        
        If you did not attempt to change your email for iPhobias, please ignore this email.
        
        Best Regards,
        iPhobias Ltd.
        98754XXXXX`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Dear User,</h2>
                    <p>Thank you for signing up for <strong>iPhobias</strong>! To complete your account verification, please use the following One-Time Password (OTP):</p>
                    <h3 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">OTP: ${otp}</h3>
                    <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
                    <p>If you did not attempt to change your email for iPhobias, please ignore this email.</p>
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

const postEditProfile = async (req, res) => {
    try {
        const userId = req.session.user;

        // Check if the user is valid
        if (!userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }

        const findUser = await User.findById(userId);
        if (!findUser) {
            return res.json({ success: false, message: "User not found" });
        }

        // Extract input fields
        const newName = req.body.name?.trim();
        const newPhone = req.body.phone?.trim();
        const newEmail = req.body.email?.trim();
        
        // If no email change, validate and update phone and name
        if (newPhone && newPhone !== findUser.phone) {
            const phoneExist = await User.findOne({ phone: newPhone });
            if (phoneExist) {
                return res.json({ success: false, message: "Phone number already in use" });
            }
        }

        // Check if email is provided and already in use
        if (newEmail && newEmail !== findUser.email) {
            const emailExist = await User.findOne({ email: newEmail });
            if (emailExist) {
                return res.json({ success: false, message: "Email already in use" });
            }

            // Generate OTP and send to the new email
            const otp = generateOtp();
            const emailSent = await sendNewEmailOtp(newEmail, otp);
            if (!emailSent) {
                return res.json({ success: false, message: "Failed to send OTP to the new email" });
            }

            // Save OTP and new email in session for validation
            req.session.userOTP = otp;
            req.session.userData = { newEmail, newName, newPhone };

            // Render OTP validation page
            console.log("OTP sent :",otp)
            return res.json({ success: true, message: "OTP sent to new email", redirectUrl: "/newEmail" });
        }


        if (newName) findUser.name = newName;
        if (newPhone) findUser.phone = newPhone;

        await findUser.save();

        return res.json({ success: true, message: "Profile updated successfully"});
    } catch (error) {
        console.error("Error in postEditProfile:", error);
        res.redirect('/pageNotFound');
    }
};

const getNewEmail = async (req, res) => {
    try {
        res.render("new-email-otp");
    } catch (error) {
        console.error("Error in getNewEmail:", error);
        res.redirect('/pageNotFound');
    }
};

module.exports = {
    getForgotPass,
    postForgotPass,
    getNewPass,
    postNewPass,
    getProfile,
    postEditProfile,
    getNewEmail
} 