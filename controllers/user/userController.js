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

module.exports = {
    loadHomePage,
    pageNotFound,
    loadSignup
} 