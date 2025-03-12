const User = require("../../models/userSchema")
const env = require("dotenv").config();
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")


const pageError = async(req,res)=>{
    res.render("adminError")
}

const loadLogin = async(req,res)=>{
    if(!req.session.admin){
        return res.render('adminLogin')
    }else{
        res.redirect('/admin')
    }
}

const login = async(req,res)=>{
    try {
        const {email,password} = req.body
        
        const findAdmin = await User.findOne({isAdmin:1,email:email});

        if(!findAdmin){
            return res.render('adminLogin',{msg:"*Admin not found"})
        }

        const passwordMatch = await bcrypt.compare(password,findAdmin.password)
        if(!passwordMatch){
            return res.render('adminLogin',{err:"*Incorrect password"})
        }

        req.session.admin = findAdmin._id

        res.redirect('/admin')


    } catch (error) {
        console.log("Login Error",error)
        return res.redirect('/pagerror')
    }

}


const loadDashboard = async(req,res)=>{
    try {
        if(req.session.admin){
            res.render('dashboard');
        }else{
            res.redirect('/admin/login')
        }
    } catch (error) {
        res.redirect('/pagerror')
    }
}

const logout = async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying admin",err)
                return res.redirect('/pagerror')
            }
            res.redirect("/admin")
        })
    } catch (error) {
        console.log("Unexpected error during Logout",error);
        res.redirect("/pagerror")
    }
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout
}