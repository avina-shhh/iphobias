const User = require("../../models/userSchema")

const pageNotFound = async(req,res)=>{
    try {
        
        res.render("404")

    } catch (error) {
        console.log("Page Not Found")
        res.redirect("/pageNotFound")

    }
}

const loadHomePage = async(req,res)=>{

    try {
        
        return res.render("home")

    } catch (error) {
        console.log("Home Page Not Found")
        res.status(500).send("Server Error")

    }

}

const loadSignup = async(req,res)=>{
    try {
        return res.render("signup")
    } catch (error) {
        console.log("Sign-Up Not Found")
        res.status(500).send("Server Error")
    }
}


const postSignup = async(req,res)=>{
    const {name,email,phone,password} = req.body;
    try {
        
        const newUser = new User({name,email,phone,password});
        console.log(newUser)
        
        await newUser.save();

        return res.redirect("/signup")

    } catch (error) {
        console.error("Error for Save User",error)
        res.status(500).send("Internal Server Error")
    }
}

module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup,
    postSignup
} 