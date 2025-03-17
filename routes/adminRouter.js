const express = require("express")
const router = express.Router();
const passport = require("passport") 
const adminController = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const {userAuth,adminAuth} = require('../middlewares/auth')

router.get('/pagerror',adminController.pageError)

// Login Management
router.get("/login",adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/',adminAuth,adminController.loadDashboard)
router.get('/logout',adminController.logout)


// Customer Management
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',adminAuth,customerController.blockCustomer)
router.get('/unblockCustomer',adminAuth,customerController.unblockCustomer)

// Category Management
router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.post("/addOffer",adminAuth,categoryController.addOffer);
router.post("/removeOffer",adminAuth,categoryController.removeOffer);
router.get("/listCategory",adminAuth,categoryController.getList);
router.get("/unlistCategory",adminAuth,categoryController.getUnlist)



module.exports = router;