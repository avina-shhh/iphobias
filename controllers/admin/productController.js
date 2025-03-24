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
        res.status(200).json({status:true,message:"Product Added Successfully"})
         // Redirect to the products page after successful addition
    } catch (error) {
        res.redirect('/admin/pageerror');
    }

}


module.exports = {
    loadAddProduct,
    postAddProduct
}