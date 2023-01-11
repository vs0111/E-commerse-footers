var express = require('express');
// const { Admin } = require('mongodb');
var router = express.Router();
const adminController = require('../controller/adminController');
const productHelpers= require('../helpers/product-helpers')
// const { route } = require('./users');
// const { response } = require('express');


const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin')
  }
}

const forLogin = ((req, res, next) =>{
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (req.session.admin)
    res.redirect('/admin/dashBoard')
  else
    next();
})





// setting layout for admin side seperate...
const setAdminLayout = (req, res, next) => {
  res.locals.layout = 'admin-layout'
  next()
};



// using admin layout...
router.use(setAdminLayout)
/* GET Signup page. */
router.post('/signup',verifyAdminLogin,adminController.viewSignPost)
router.get('/signup',adminController.viewSignGet)

/* GET Login page. */
router.get('/',forLogin,adminController.viewLoginGet);
router.post('/',adminController.viewLoginPost );

/* GET DashBoard  Page */
router.get('/dashBoard',verifyAdminLogin,adminController.viewDashBoard);

router.get("/chart-data", verifyAdminLogin,adminController.dashBoard);

/* GET Product page. */
router.get('/viewProduct',verifyAdminLogin,adminController.viewProduct);
router.get('/add-Product',verifyAdminLogin,adminController.addProductGet);
router.post('/add-Product',verifyAdminLogin,adminController.addProductPost);  
router.get('/edit-product/:id',verifyAdminLogin,adminController.editProductGet)
router.post('/edit-product/:id',verifyAdminLogin,adminController.editProductPost)
router.get('/delete-product/:id',verifyAdminLogin,adminController.deleteProduct)

/* GET viewUser page. */
router.get('/view-users',verifyAdminLogin,adminController. viewUsersPage1)
router.get('/userPage2',verifyAdminLogin,adminController.getUsersPage2)
router.get('/userPage3',verifyAdminLogin,adminController.getUsersPage3)
router.get('/block-user/:id',verifyAdminLogin,adminController. blockUser )
router.get('/unblock-user/:id',verifyAdminLogin,adminController. unblockUser)

/* GET Category page. */
router.get('/view-category',verifyAdminLogin,adminController.viewCategory)
router.get('/add-category',verifyAdminLogin,adminController. addCategoryGet)
router.post('/add-category',verifyAdminLogin,adminController.addCategoryPost)
router.get('/edit-category/:id',verifyAdminLogin,adminController.editCategoryGet)
router.post('/edit-category',verifyAdminLogin,adminController.editCategoryPost)
router.get('/delete-category/:id',verifyAdminLogin,adminController.deleteCategory)

router.get('/order-view',verifyAdminLogin,adminController.viewOrders)
router.post('/changeOrderStatus',verifyAdminLogin,adminController.changeOrderStatus)
router.get('/view-order-products/:id',verifyAdminLogin,adminController.viewOrderProduct)
router.get('/salesReport',verifyAdminLogin,adminController.salersReport)
// coupon management
router.get('/coupon-management', verifyAdminLogin,adminController.couponGet) 
// add coupon get
router.get('/add-coupon', verifyAdminLogin,adminController.addCouponGet)
//add coupon post
router.post('/add-coupon', verifyAdminLogin,adminController.addCouponPost)
// edit coupon get
router.get('/edit-coupon/:id', verifyAdminLogin,adminController.editCouponGet)
// edit coupon post
router.post('/edit-coupon', verifyAdminLogin,adminController.editCouponPost)
// delete coupon 
router.get('/delete-coupon/:id', verifyAdminLogin,adminController.deleteCoupon)
// category offer management
router.get("/category-offers", verifyAdminLogin,adminController.categoryOfferGet);
router.post("/category-offers", verifyAdminLogin,adminController.cateOfferPost);
// edit category offer
router.get("/edit-catOffer/:_id", verifyAdminLogin,adminController.editCatOfferGet );
router.post("/edit-catOffer/:_id", verifyAdminLogin,adminController.editCatOfferPost);
// delete category offer
router.get("/delete-catOffer/:_id", verifyAdminLogin,adminController.deleteCatOffer );
// product offer management
router.get("/product-offers", verifyAdminLogin,adminController.productOfferGet );
router.post("/product-offers", verifyAdminLogin,adminController.productOfferPost);
// edit prod offer
router.get("/edit-prodOffer/:_id", verifyAdminLogin,adminController.editProductOfferGet);
router.post("/edit-prodOffer/:_id", verifyAdminLogin,adminController.editProductOfferPost );
// delete prod offer
router.get("/delete-prodOffer/:_id", verifyAdminLogin,adminController.deleteProdOffer);
router.get('/active-product/:id',verifyAdminLogin,adminController.activeProduct)
router.get('/adminLogout',verifyAdminLogin,adminController.logoutAdmin)


router.get('/viewProduct2',(req,res)=>{
  let adminData = req.session.admin;
  products=productHelpers.getAllProducts2().then((products) => {
    res.render("admin/product", { products, admin:true, adminData });
    })
  })

  router.get('/viewProduct3',(req,res)=>{
    let adminData = req.session.admin;
    products=productHelpers.getAllProducts3().then((products) => {
      res.render("admin/product", { products, admin:true, adminData });
      })
    })




module.exports = router;











  
   
  
  
  

  

  

    




    
   
   
 




   
   



















 
















































