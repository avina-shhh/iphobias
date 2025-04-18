const express = require("express")
const router = express.Router();
const passport = require("passport") 
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController")
const productController = require('../controllers/admin/productController');
const bannerController = require('../controllers/admin/bannerController')
const {userAuth,adminAuth} = require('../middlewares/auth');
const multer = require("multer");
const storage = require("../helpers/multer");
const brandUploads = multer({storage:storage.storage})
const productUploads = multer({storage:storage.product})
const productEditUploads = multer({ storage: storage.product }).fields([
    { name: 'images', maxCount: 10 },
    { name: 'existingImages', maxCount: 10 }
]);
const bannerUploads = multer({storage:storage.bannerStorage})


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
router.get('/deleteCategory/:id',adminAuth,categoryController.deleteCategory)
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.post("/addOffer",adminAuth,categoryController.addOffer);
router.post("/removeOffer",adminAuth,categoryController.removeOffer);
router.post('/editCategory/:id',adminAuth,categoryController.postEditCategory)


// Brand Management
router.get("/brands",adminAuth,brandController.loadBrand);
router.get("/editBrand",adminAuth,brandController.getEdit);
router.get('/blockBrand',adminAuth,brandController.blockBrand);
router.get('/unblockBrand',adminAuth,brandController.unblockBrand);
router.get('/deleteBrand',adminAuth,brandController.deleteBrand)
router.post("/addBrand",adminAuth,brandUploads.single("image"),brandController.addBrand);
router.post('/editBrand/:id',adminAuth,brandUploads.single("image"),brandController.postEditBrand)

// Products Management
router.get('/addProducts',adminAuth,productController.loadAddProduct);
router.post('/addProducts',adminAuth,productUploads.array('images',10),productController.postAddProduct);
router.get('/products',adminAuth,productController.getProducts);
router.post('/addProductOffer',adminAuth,productController.addOffer)
router.post('/removeProductOffer',adminAuth,productController.removeOffer);
router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unblockProduct',adminAuth,productController.unblockProduct);
router.get('/editProduct',adminAuth,productController.editProduct);
router.post('/editProduct/:id', adminAuth, productEditUploads, productController.postEditProduct);
router.post('/deleteSinglePic', adminAuth,productController.deleteSinglePic);
router.delete('/removeProduct/:id', adminAuth, productController.removeProduct);

// Banner Management
router.get('/banner',adminAuth,bannerController.getBanner);
router.get('/addBanner',adminAuth,bannerController.getAddBanner);
router.post('/addBanner',adminAuth,bannerUploads.single('image'),bannerController.postAddBanner)
router.delete('/deleteBanner', adminAuth, bannerController.removeBanner);
router.get('/editBanner',adminAuth, bannerController.getEditBanner);
router.post('/editBanner', adminAuth, bannerUploads.single('image'), bannerController.postEditBanner);

module.exports = router;