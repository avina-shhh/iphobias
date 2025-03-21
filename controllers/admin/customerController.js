const User = require("../../models/userSchema");



const customerInfo = async (req,res)=>{
    try {
        
        let search = "";
        if(req.query.search){
            search = req.query.search;
        }
        let page = 1;
        if(req.query.page){
            page = req.query.page;
        }

        const limit = 3
        const userData = await User.find({
            isAdmin:false,
            $or:[
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
        })
        .sort({ createdOn: -1 }) 
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();

        const count = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ],
        }).countDocuments();

        res.render("customers", {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    

    } catch (error) {
        res.redirect('/admin/pagerror')
    }
}

const blockCustomer = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await User.updateOne({_id:id},{$set:{isBlocked:true}});
        if(found){
            res.status(200).json({status:true,message:"User successfully Blocked"});
        }else{
            res.status(404).json({status:false,message:"User not found"});
        }
    } catch (error) {
        console.error("Error in blockCustomer",error)
        res.status(500).json({status:false,message:"Internal server error"});
    }
}

const unblockCustomer = async(req,res)=>{
    try {
        let id = req.query.id
        const found = await User.updateOne({_id:id},{$set:{isBlocked:false}});
        if(found){
            res.status(200).json({status:true,message:"User successfully UnBlocked"});
        }else{
            res.status(404).json({status:false,message:"User not found"});
        }
    } catch (error) {
        console.error("Error in blockCustomer",error)
        res.status(500).json({status:false,message:"Internal server error"});
    }
}

module.exports = {

    customerInfo,
    blockCustomer,
    unblockCustomer

}
