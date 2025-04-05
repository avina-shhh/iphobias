const Banner = require('../../models/BannerSchema');
const path = require('path');
const fs = require('fs')

const getBanner = async(req,res)=>{
    try {
        const findBanner = await Banner.find({});
        res.render('banner',{data:findBanner})
    } catch (error) {
        res.redirect('/admin/pagerror')
    }
}

const getAddBanner = async(req,res)=>{
    try {
        res.render('addBanner')
    } catch (error) {
        consle.error("Error in getAddBanner",error);
        res.redirect('/admin/pagerror')
    }
}

const postAddBanner = async (req, res) => {
    try {
        const data = req.body;
        const image = req.file;

        const newBanner = new Banner({
            image: image.filename, // Ensure this matches your schema
            title: data.title,
            description: data.description,
            startDate: new Date(data.startDate + "T00:00:00"),
            endDate: new Date(data.endDate + "T00:00:00"),
            link: data.link
        });

        await newBanner.save();
        res.json({status:true,message:"Banner added successfully"})
    } catch (error) {
        console.error("Error in postAddBanner", error);
        res.redirect('/admin/pagerror');
    }
}

const removeBanner = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await Banner.deleteOne({_id:id});
        if(found){
            res.status(200).json({status:true,message:"Banner successfully Removed"});
        }else{
            res.status(400).json({status:false,message:"Banner not found"});
        }
    } catch (error) {
        console.error("Error in removeBanner",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const getEditBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.query.id);
        res.render('editBanner', { banner });
    } catch (error) {
        console.error("Error in getEditBanner", error);
        res.redirect('/admin/pageerror');
    }
};

const postEditBanner = async (req, res) => {
    try {
        const data = req.body;
        const image = req.file;

        const updateData = {
            title: data.title,
            description: data.description,
            startDate: new Date(data.startDate + "T00:00:00"),
            endDate: new Date(data.endDate + "T00:00:00"),
            link: data.link
        };

        if (image) {
            updateData.image = image.filename;
        }

        const success = await Banner.findByIdAndUpdate(data.id, updateData);
        if(!success){
            return res.status(500).json({status:false,message:"Banner not Found"})
        }
        res.status(200).json({status:true,message:"Banner Updated Successfully"});
    } catch (error) {
        console.error("Error in postEditBanner", error);
        res.redirect('/admin/pageerror');
    }
};

module.exports = {
    getBanner,
    getAddBanner,
    postAddBanner,
    removeBanner,
    getEditBanner,
    postEditBanner
}