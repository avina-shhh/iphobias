const express = require("express")
const router = express.Router();
const passport = require("passport") 
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController")
const {userAuth,adminAuth} = require('../middlewares/auth');
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage})


router.get('/pagerror',adminController.pageError)

// Login Management
router.get("/login",adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/logout',adminController.logout)

// Default DashBoard
router.get('/',adminAuth,adminController.loadDashboard)

// Customer Management
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',adminAuth,customerController.blockCustomer)
router.get('/unblockCustomer',adminAuth,customerController.unblockCustomer)

// Category Management
router.get("/category",adminAuth,categoryController.categoryInfo);
router.get("/listCategory",adminAuth,categoryController.getList);
router.get("/unlistCategory",adminAuth,categoryController.getUnlist)
router.get("/editCategory",adminAuth,categoryController.editCategory);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.post("/addOffer",adminAuth,categoryController.addOffer);
router.post("/removeOffer",adminAuth,categoryController.removeOffer);
router.post('/editCategory/:id',adminAuth,categoryController.postEditCategory)


// Brand Management
router.get("/brands",adminAuth,brandController.loadBrand);
router.post("/addBrand",adminAuth,uploads.single("image"),brandController.addBrand);

module.exports = router;