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
                brand:brand
            })
        }else{
            res.redirect('/admin/pagerror')
        }
    } catch (error) {
        console.error('Error in getProducts',error)
    }
}


module.exports = {
    loadAddProduct,
    postAddProduct,
    getProducts
}