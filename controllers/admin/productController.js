const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require('../../models/brandSchema');
const User = require('../../models/userSchema')
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const loadAddProduct = async(req,res)=>{
    try {
        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false})
        res.render('addProducts',{
            category,
            brand
        })
    } catch (error) {
        res.redirect('/admin/pagerror')
    }
}

const postAddProduct = async(req,res)=>{
    try {
        const { productName, description, brand, category, regularPrice, salePrice, quantity, color } = req.body;
        const productImages = req.files.map(file => file.filename);

        const newProduct = new Product({
            productName,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            quantity,
            color,
            productImage: productImages
        });

        await newProduct.save();

        const tempDir = path.join(__dirname, '../../public/uploads/temp');
        const finalDir = path.join(__dirname, '../../public/uploads/productImg');
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }

        productImages.forEach(image => {
            const tempPath = path.join(tempDir, image);
            const finalPath = path.join(finalDir, image);
            fs.renameSync(tempPath, finalPath);
        });

        // Redirect to the products page after successful addition respond with JSON
        res.status(200).json({status:true,message:"Product Added Successfully"})
    } catch (error) {
         // Delete images from temp directory if form submission fails
         req.files.forEach(file => {
            fs.unlinkSync(path.join(__dirname, '../../public/uploads/temp', file.filename));
        });
        res.redirect('/admin/pageerror');
    }

}

const getProducts = async(req,res)=>{
    try {
        let search = req.query.search || "";
        let page = req.query.page || 1;
        const limit = 7 

        const productData = await Product.find({
            $or:[
                { productName : { $regex: ".*" + search + ".*", $options: "i" } },
                { brand: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        })
        .sort({ createdAt: -1 }) 
        .limit(limit*1)
        .skip((page-1)*limit)
        .populate('category')
        .exec();

        const count = await Product.find({
            $or:[
                { productName : { $regex: ".*" + search + ".*", $options: "i" } },
                { brand: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        }).countDocuments();

        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false})
        
        if(category && brand){
            res.render('products',{
                data:productData,
                currentPage:page,
                totalPages:Math.ceil(count/limit),
                category:category,
                brand:brand,
                search:search
            })
        }else{
            res.redirect('/admin/pagerror')
        }
    } catch (error) {
        console.error('Error in getProducts',error)
    }
}


const addOffer = async(req,res)=>{
    try {
        const percentage = parseInt(req.body.percentage);
        const productId = req.body.productId;
        const productFind = await Product.findById(productId);
        const categoryFind = await Category.findById(productFind.category);
        const offerPrice = Math.floor(productFind.regularPrice*(percentage/100));
        
        if(categoryFind.categoryOffer>percentage){
            return res.json({status:false,message:"This Product's Category already have an Offer"})
        }

        productFind.salePrice -= offerPrice
        productFind.offerPrice = offerPrice;
        await productFind.save();
        categoryFind.categoryOffer = 0;
        await categoryFind.save();

        res.json({status:true});
    } catch (error) {
        console.error("Error in addOffer in Product:",error)
        res.status(500).json({status:false,message:"Internal Server Error"});
    }
}

const removeOffer = async(req,res)=>{
    try {
        const productId = req.body.productId;
        const productFind = await Product.findById(productId);
        productFind.salePrice += productFind.offerPrice;
        productFind.offerPrice = 0;
        await productFind.save();

        res.json({status:true});
    } catch (error) {
        console.error("Error in removeOffer in Product:",error)
        res.status(500).json({status:false,message:"Internal Server Error"});
    }
}

const blockProduct = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        if(found){
            res.status(200).json({status:true,message:"Product successfully Blocked"});
        }else{
            res.status(400).json({status:false,message:"Product not found"});
        }
    } catch (error) {
        console.error("Error in blockProduct",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const unblockProduct = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await Product.updateOne({_id:id},{$set:{isBlocked:false}});
        if(found){
            res.redirect('/admin/products')
        }else{
            res.redirect('/admin/pagerror')
        }
    } catch (error) {
        console.error("Error in unblockProduct",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

module.exports = {
    loadAddProduct,
    postAddProduct,
    getProducts,
    addOffer,
    removeOffer,
    blockProduct,
    unblockProduct
}