const User = require("../../models/userSchema")
const env = require("dotenv").config();
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")

const loadLogin = async(req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin")
    }
    res.render('adminLogin')
}

const login = async(req,res)=>{
    try {
        const {email,password} = req.body
        const admin = await User.findOne({email,isAdmin:true})

        if(admin){
            const passMatch = bcrypt.compare(password,admin.password);
            if(passMatch){
                req.session.admin = true;
                return res.redirect('/admin')
            }else{
                res.redirect('/admin/login')
            }
        }else{
            res.redirect('/admin/login')
        }

    } catch (error) {
        console.log("Login Error",error)
        return res.redirect('/pageError')
    }
}



module.exports = {
    loadLogin,
    login
}