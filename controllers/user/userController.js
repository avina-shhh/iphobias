const User = require("../../models/userSchema");
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Banner = require('../../models/BannerSchema');
const Brand = require('../../models/brandSchema');
const nodemailer = require("nodemailer")
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const Cart = require('../../models/cartSchema');

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
        const cart = await Cart.findOne({userId:user});
        const categories = await Category.find({isListed:true});
        let productData = await Product.find({
            isBlocked:false,
            category:{$in:categories.map(category=>category._id)},
            quantity:{$gt:0}
        })

        const banners = await Banner.find({startDate:{$lt:Date.now()},endDate:{$gt:Date.now()}});

        
        productData.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
        productData = productData.slice(0,4);

        if(user){
            const userData = await User.findOne({_id:user})
            return res.render('home',{user : userData,products:productData,banners:banners,categories,cart})
        }else{
            return res.render("home",{products:productData,banners:banners,categories,cart})
        }
    } catch (error) {
        console.error("Home Page Not Found",error)
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



async function sendOtp(mail,otp){
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
            text: `Dear User,
        
            Thank you for signing up for iPhobias! To complete your account verification, please use the following One-Time Password (OTP):
            
            OTP : ${otp}
            
            This OTP is valid for 5 minutes. Please do not share it with anyone.
        
        If you did not attempt to sign up for iPhobias, please ignore this email.
        
        Welcome to iPhobias! We're excited to have you on board.
        
        Best Regards,
        iPhobias Ltd.
        98754XXXXX`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Dear User,</h2>
                    <p>Thank you for signing up for <strong>iPhobias</strong>! To complete your account verification, please use the following One-Time Password (OTP):</p>
                    <h3 style="background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 5px;">OTP: ${otp}</h3>
                    <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
                    <p>If you did not attempt to sign up for iPhobias, please ignore this email.</p>
                    <p>Welcome to <strong>iPhobias</strong>! We're excited to have you on board.</p>
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
                    <p>Thank you for signing up for <strong>iPhobias</strong>! To complete your new email verification, please use the following One-Time Password (OTP):</p>
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

const postSignup = async(req,res)=>{
    try {
        const {email} = req.body;

        const findUser = await User.findOne({email:email});
        if(findUser){
            return res.render('signup',{ msg : "*User with this email already exists" })
        }

        const otp = generateOtp();

        const emailSend = await sendOtp(email,otp);
        if(!emailSend){
            return res.json("email-error")
        }

        req.session.userOTP = otp;
        req.session.userData = email;

        res.render("otp");
        console.log("OTP sent :",otp)


    } catch (error) {
        console.error("postSignup error",error);
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
            if(req.session.forgotPass){
                req.session.forgotPass = false;
                req.session.validForNewPass = true;
                req.session.save();
                res.json({success:true,redirectUrl:'/new-password'})
            }else  if(req.session.newEmail){
                req.session.newEmail = false;
                req.session.save();
                await User.findByIdAndUpdate(req.session.user,
                    {$set:{email:req.session.userData.newEmail,
                        phone:req.session.userData.newPhone,
                        name:req.session.userData.newName}}
                )
                res.json({success:true})     
            }else if(req.session.forgotPassword){
                res.json({success:true})
            }else{
                res.json({success:true,redirectUrl:'/sign-up'});
            }
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
        
        const email  = req.session.userData.newEmail || req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found"})
        }

        const otp = generateOtp()
        req.session.userOTP = otp;
        req.session.save();

        let emailSend;
        if(req.session.forgotPass || req.session.forgotPassword){
            emailSend = await sendForgotOtp(email,otp);
        }else if(req.session.newEmail){
            emailSend = await sendNewEmailOtp(email,otp);
        }else{
            emailSend = await sendOtp(email,otp);
        }
        if(emailSend){
            console.log("Resend OTP:", otp);
            return res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        }else{
            return res.status(500).json({success:false,message:"Failed to resend OTP. Please try again later"});
        }


    } catch (error) {
        console.error("Error Resending OTP",error)
        res.status(500).json({success:false,message:"Internal Server Error. Please try again"})
    }
}


const finishSignup = async(req,res)=>{
    try {
        const userData = req.session.userData;
        const user = req.session.user
        if(!userData){
            return res.redirect('/signup')
        }else if(user){
            return res.redirect('/')
        }
        res.render('finishSignup')
    } catch (error) {
        console.error("Error finishSignup",error)
        res.redirect('/pageNotFound')
    }
}


const postFinishSignup = async(req,res)=>{
    try {

        const existingUser = await User.findOne({phone:req.body.phone})
        if(existingUser){
            return res.json({success:false,message:'User with this Phone already exist'});
        }

        const email = req.session.userData
        const passHash = await securePass(req.body.password);

        const saveUserData = new User({
            name : req.body.name,
            email : email,
            phone : req.body.phone,
            password : passHash
        })

        await saveUserData.save();
        console.log(saveUserData)

        req.session.user = saveUserData._id;

        res.json({success:true,redirectUrl:'/'});
    } catch (error) {
        console.error("Error postFinishSignup",error)
        res.redirect('/pageNotFound')
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

const loadShop = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ _id: user });
        const cart = await Cart.findOne({userId:user});
        
        // First get all listed categories and non-blocked brands
        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });
        
        // Get IDs for categories and brand names for products
        const categoryIds = categories.map(category => category._id);
        const brandNames = brands.map(brand => brand.brandName);

        const categoryFilter = req.query.category || 'all';
        const limit = parseInt(req.query.limit) || 8;
        const sort = req.query.sort || 'newest';
        const priceRange = req.query.price || 'all';
        const brandFilter = req.query.brand || 'all';
        const searchQuery = req.query.search || '';

        // Base filter to ensure we only get products with listed categories and non-blocked brands
        const filter = {
            isBlocked: false,
            quantity: { $gt: 0 },
            category: { $in: categoryIds },
            brand: { $in: brandNames }  // Using brand names instead of IDs
        }

        // Add search filter
        if (searchQuery) {
            filter.$or = [
                { productName: { $regex: searchQuery, $options: 'i' } },
                { brand: { $regex: searchQuery, $options: 'i' } }  // Search in brand names directly
            ];
        }
        
        if(categoryFilter !== 'all'){
            const category = await Category.findOne({ 
                name: categoryFilter,
                isListed: true 
            });
            if (category) {
                filter.category = category._id;
            } else {
                // If category doesn't exist or is unlisted, return no products
                filter.category = null; // This will ensure no products are returned
            }
        }

        // Add brand filter
        if(brandFilter !== 'all') {
            const brand = await Brand.findOne({ 
                brandName: brandFilter,
                isBlocked: false 
            });
            if (brand) {
                filter.brand = brand.brandName;  // Use brandName instead of ID
            }
        }

        // Add price range filter
        switch(priceRange) {
            case '0-50':
                filter.salePrice = { $gte: 0, $lte: 50 };
                break;
            case '50-100':
                filter.salePrice = { $gt: 50, $lte: 100 };
                break;
            case '100-150':
                filter.salePrice = { $gt: 100, $lte: 150 };
                break;
            case '150-200':
                filter.salePrice = { $gt: 150, $lte: 200 };
                break;
            case '200+':
                filter.salePrice = { $gt: 200 };
                break;
            default:
                // No price filter for 'all' or invalid values
                break;
        }

        // Define sort options
        let sortOption = {};
        switch(sort) {
            case 'price-low-high':
                sortOption = { salePrice: 1 };
                break;
            case 'price-high-low':
                sortOption = { salePrice: -1 };
                break;
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
                break;
        }

        const products = await Product.find(filter)
            .sort(sortOption)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filter);
        const categoriesWithIds = categories.map(category => ({ 
            _id: category._id, 
            name: category.name 
        }));

        res.render('shop', {
            user: userData,
            products: products,
            categories: categoriesWithIds,
            brand: brands,
            totalProducts: totalProducts,
            currentLimit: limit,
            selectedCategory: categoryFilter,
            selectedSort: sort,
            selectedPrice: priceRange,
            selectedBrand: brandFilter,
            searchQuery: searchQuery,
            cart:cart
        });
    } catch (error) {
        console.error("Error in loadShop:", error);
        res.redirect('/pageNotFound');
    }
};

module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup,
    postSignup,
    verifyOTP,
    resendOTP,
    finishSignup,
    postFinishSignup,
    loadLogin,
    postLogin,
    logout,
    loadShop,
} 