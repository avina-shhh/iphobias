const User = require('../models/userSchema');
const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect("/home")
            }
        })
        .catch(error=>{
            console.log("Error in User Auth",error);
            res.status(500).send('Internal Server Error')
        })
    }else{
        res.redirect("/login")
    }
}

const adminAuth = (req,res,next)=>{
    User.findOne({_id:req.session.admin,isAdmin : true})
    .then(data=>{
        // if(data){
        //     next();
        // }else{
        //     res.redirect('/admin/login')
        // }
        next();
    })
    .catch(error=>{
        console.log("Error in Admin Auth",error);
        res.status(500).send('Inter Server Error')
    })
}

module.exports = {
    userAuth,
    adminAuth
}