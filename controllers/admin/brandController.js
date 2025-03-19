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
        const findBrand = await Brand.findOne({brand});

        if(!findBrand){
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName:brand,
                brandImage:image
            })

            await newBrand.save();
            res.redirect("/admin/brands");
        }

    } catch (error) {
        res.redirect('/admin/pagerror')
    }
}

module.exports = {
    loadBrand,
    addBrand
}