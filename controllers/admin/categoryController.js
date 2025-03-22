const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema') 

const categoryInfo = async(req,res)=>{
    try {
        
        let page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;
        let search = "";
        if(req.query.search){
            search = req.query.search;
        }

        const categoryData = await Category.find({
            $or:[
                {name:{$regex:".*"+search+".*", $options:"i"}},
                {description:{$regex:".*"+search+".*", $options:"i"}}
            ]
        })
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
        

        const totalCategory = await Category.find({
            $or:[
                {name:{$regex:".*"+search+".*", $options:"i"}},
                {description:{$regex:".*"+search+".*", $options:"i"}}
            ]
        }).countDocuments();
        
        const totalPages = Math.ceil(totalCategory/limit);

        res.render("category",{
            data : categoryData,
            totalPages : totalPages,
            currentPage : page,
            totalCategories : totalCategory,
            search:search
        })

    } catch (error) {
        console.error(error)
        res.redirect('/pagerror')
    }
}

const addCategory = async(req,res)=>{
    const {name,description} = req.body;
    try {
        
        const existing = await Category.findOne({name});
        if(existing){
            return res.status(400).json({error:"Category already exists"})
        }
        const newCategory = new Category({
            name,
            description
        })

        await newCategory.save();
        return res.json({message:"Category added Successfully"})

    } catch (error) {
        return res.status(500).json({error:"Internal server error"})
    }
}




const addOffer = async(req,res)=>{
    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(404).json({status:false,message:"Category not found"})
        }

        const products = await Product.find({category:category._id});
        const hasProductOffer = products.some((product)=>product.productOffer > percentage);
        if(hasProductOffer){
            return res.json({status:false,message:"Products within this category already have offers"})
        }
        await Category.updateOne({_id:categoryId},{$set:{categoryOffer:percentage}})
        
        for(const product of products){
            product.productOffer = 0;
            product.salePrice = product.regularPrice;
            await product.save();
        }

        res.json({status:true});

    } catch (error) {
        console.error("Error in addOffer controller:", error);
        res.status(500).json({status:false,message:"Internal Server Error"})
    }
}



const removeOffer = async(req,res)=>{
    try {
        
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(404).json({status:false,message:"Category not found"})
        }

        const percentage = category.categoryOffer;
        const products = await Product.find({category:category._id});
        if(products.length > 0){
            for(const product of products){
                product.salePrice += Math.floor(product,regularPrice *(percentage/100))
                product.productOffer = 0;
                await product.save();
            }
        }
        category.categoryOffer = 0;
        await category.save();
        res.json({status:true})

    } catch (error) {
        res.status(500).json({status:false,message:"Internal Server Error"})
    }
}

const getList = async(req,res)=>{
    try {
        const id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect('/admin/category')
    } catch (error) {
        res.redirect("/admin/pagerror");
        console.error("Error in getList: ",error)
    }
}

const getUnlist = async(req,res)=>{
    try {
        const id = req.query.id
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.status(200).json({status:true,message:"Category Unlisted successfully"})
    } catch (error) {
        res.redirect("/admin/pagerror");
        console.error("Error in getUnlist: ",error)
    }
}

const editCategory = async(req,res)=>{
    try {
        const id = req.query.id;
        const category = await Category.findOne({_id:id});
        res.render('editCategory',{category:category})
    } catch (error) {
        console.error("Error in editCategory",error);
        res.redirect('/pagerror')
    }
}

const postEditCategory = async (req, res) => {
    try {
      const id = req.params.id;
      const { name, description } = req.body;
  
      // Check if the category name already exists (excluding the current category)
      const existingCategory = await Category.findOne({ name: name, _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({ status: false, message: "Category name already exists, please use another name" });
      }
  
      // Update the category
      const updateCategory = await Category.findByIdAndUpdate(
        id,
        { name, description },
        { new: true } // Return the updated document
      );
  
      if (updateCategory) {
        res.status(200).json({ status: true, message: "Category edited successfully" });
      } else {
        res.status(404).json({ status: false, message: "Category not found" });
      }
    } catch (error) {
      console.error("Error in postEditCategory:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  };

  const deleteCategory = async(req,res)=>{
    try {
        let id = req.params.id
        const found = await Category.deleteOne({_id:id});
        if(found){
            res.status(200).json({status:true,message:"Category successfully Removed"});
        }else{
            res.status(400).json({status:false,message:"Category not found"});
        }
    } catch (error) {
        console.error("Error in deleteCategory",error)
        res.status(500).json({status:false,message:"Internal server error"})
    }
}


module.exports = {
    categoryInfo,
    addCategory,
    addOffer,
    removeOffer,
    getList,
    getUnlist,
    editCategory,
    postEditCategory,
    deleteCategory
}