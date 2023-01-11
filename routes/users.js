var express = require('express');
// const { response } = require('../app');
var router = express.Router();
const usersHelpers = require('../helpers/users-helpers')
// const productHelper = require('../helpers/product-helpers')
// const adminHelpers = require('../helpers/admin-helpers')
const userController = require('../controller/userController');
const { id } = require('object-id');


const forLogin = ((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if (req.session.loggedIn)
    res.redirect('/')
  else
    next();
})

const verifyLogin = (req, res, next) => {
  try {
    if (req.session.loggedIn) {
      usersHelpers.isblocked(req.session.user._id).then((response) => {
        if (response.isblocked) {
          req.session.loggedIn = null
          req.session.blockErr = 'You Are Blocked'
          res.redirect('/login')
        } else {
          next()
        }
      })
    } else {
      res.redirect('/login')
    }
  } catch (err) {
    res.redirect('/login')
  }
}










/* GET user Hompage. */
router.get('/', userController.userHomePage)

/* GET&POST user Login */
router.get('/login', forLogin, userController.userLoginGet);
router.post('/login', forLogin, userController.userLoginPost);

/* GET&POST user Signup */
router.get('/signup', forLogin, userController.userSignGet)
router.post('/signup', forLogin, userController.userSignPost);
router.get('/shope', userController.userShop);
router.get('/product/:id', userController.userProductPage);
router.get('/cart', verifyLogin, userController.viewCart)
router.get('/addToCart/:id', verifyLogin, userController.addToCart)
router.post('/changeProductQty', verifyLogin, userController.changeProductQty)
router.get('/removeCartProduct/:proId/:cartId',verifyLogin, userController.removeCartProduct)
router.get('/checkOut', verifyLogin, userController.checkOutOrder)
router.post('/checkOut', verifyLogin, userController.checkOutOrderPost)
router.get('/addAddress', verifyLogin, userController.addAddressGet)
router.post('/addAddress', verifyLogin, userController.addAddressPost)
router.post('/verify-payment', verifyLogin, userController.varifyPayment)
router.get('/order-placed', verifyLogin, userController.thankPage)
router.get('/orderHistory', verifyLogin, userController.orderHistory)
router.get('/view-order-products/:id', verifyLogin, userController.orderProduct)
router.get('/cancel-order/:id', verifyLogin, userController.cancelOrder)
// otp login get
router.get('/otp-login', userController.otpMobileGet)
router.post('/otp-login',userController.otpMobilePost)
// otp code getting
router.get('/enter-otp', userController.otpCodeGet)
router.post('/enter-otp', userController.otpCodePost)
router.get('/wishlist',verifyLogin, userController.viewWishlist)
router.get('/addToWishlist/:id', verifyLogin, userController.addToWishlist)
router.get('/delete-wish-item/:proId/:wishId',verifyLogin,userController.deleteWishlist)
router.get('/profile',verifyLogin,userController.viewProfile)
router.get('/editProfile',verifyLogin,userController.editProfileGet)
router.post('/editProfile',verifyLogin,userController.editProfilePost)
router.post('/coupon-apply',verifyLogin,userController.CouponApplay)
router.get('/searchProduct', userController.searchProductGet);
router.post('/searchProduct', userController.searchProductPost)
router.get('/forgot-password',userController.forgottPasswordGet)
router.post('/forgot-password',userController.forgottPasswordPost)
router.get('/enter-password',userController.newPasswordGet)
router.post('/enter-password',userController.newPasswordPost)
router.get('/return-order/:id',verifyLogin,userController.returnProduct)
router.get('/invoice/:id',verifyLogin,userController.invoice)
router.get('/contact',userController.userContact)
router.get('/logout',userController.userLogout)

module.exports = router;







































    

    



