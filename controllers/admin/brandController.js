const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema")

const loadBrand = async(req,res)=>{
    try{
        let page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;
        let search = "";
        if(req.query.search){
            search = req.query.search;
        }

        const brandData = await Brand.find({
            $or:[
                {brandName:{$regex:".*"+search+".*", $options:"i"}}
            ]
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);

        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands/limit);
        res.render("brands",{
            data:brandData,
            currentPage:page,
            totalPages:totalPages,
            totalBrands:totalBrands
        })

    }catch(error){
        res.redirect("/admin/pagerror");
        console.error("Error in loadBrand",error)
    }
}

const addBrand = async(req,res)=>{
    try {
        const brand = req.body.name;
        const findBrand = await Brand.findOne({brandName:brand});

        if(!findBrand){
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName:brand,
                brandImage:image
            })

            await newBrand.save();
            return res.status(200).json({ status: true, message: "Brand added successfully" });
        }
        
        res.status(400).json({status:false,message:"Brand Name already taken"})


    } catch (error) {
        console.error("Error in brand adding ",error);
        res.status(500).json({ status: false, message: "An error occurred while adding the brand"});
    }
}


const getEdit = async(req,res)=>{
    try {
        const id = req.query.id;
        const brand = await Brand.findOne({_id:id});
        res.render('editBrand',{brand:brand})
    } catch (error) {
        console.error("Error in editCategory",error);
        res.redirect('/pagerror')
    }
}

const postEditBrand = async(req,res)=>{
    try {
        const id = req.params.id;
        const brand = req.body.name;
        const image = req.file ? req.file.filename : null;

        const existingBrand = await Brand.findOne({ brandName: brand, _id: { $ne: id } });
        if(existingBrand){
            return res.status(400).json({status:false, message:"Brand name already exists, please use another name"})
        }
        
        const updateData = {brandName : brand}

        if(image){
            updateData.brandImage = image;
        }
        
        const updateBrand = await Brand.findByIdAndUpdate(id,updateData,{new:true})

        if(updateBrand){
            res.status(200).json({status:true,message:"Brand updated successfully"})
        }else{
            res.status(404).json({status:false,message:"Brand not found"})
        }

    } catch (error) {
        console.error("Error in PostEditBrand",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const blockBrand = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await Brand.updateOne({_id:id},{$set:{isBlocked:true}});
        if(found){
            res.status(200).json({status:true,message:"Brand successfully Blocked"});
        }else{
            res.status(400).json({status:true,message:"Brand not found"});
        }
    } catch (error) {
        console.error("Error in brandBlock",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const unblockBrand = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await Brand.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/brands')
    } catch (error) {
        console.error("Error in unblockBrand",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const deleteBrand = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await Brand.deleteOne({_id:id});
        if(found){
            res.status(200).json({status:true,message:"Brand successfully Removed"});
        }else{
            res.status(400).json({status:true,message:"Brand not found"});
        }
    } catch (error) {
        console.error("Error in deleteBrand",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

module.exports = {
    loadBrand,
    addBrand,
    getEdit,
    postEditBrand,
    blockBrand,
    unblockBrand,
    deleteBrand

}