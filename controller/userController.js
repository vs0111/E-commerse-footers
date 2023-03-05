var express = require("express");
// const { response } = require("../app");
var router = express.Router();
var objectId = require("mongodb").ObjectId;

// const adminHelpers = require("../helpers/admin-helpers");
let productHelper = require("../helpers/product-helpers");
let usersHelpers = require("../helpers/users-helpers");

const servicesID = process.env.SERVICE_ID;
const accountSid = process.env.ACTSID_ID;
const authToken = process.env.AUTH_TOKRN;
const client = require("twilio")(accountSid, authToken);

const userController = {
  userHomePage: async (req, res) => {
    let users = req.session.user;
    let cartCount = 0;
    let wishCount = 0;
    let todayDate = new Date().toISOString().slice(0, 10);
    let startCouponOffer = await usersHelpers.startCouponOffer(todayDate);
    productHelper.startProductOffer(todayDate);
    productHelper.startCategoryOffer(todayDate);

    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }

    productHelper.getAllProductsHome().then((products) => {
      res.render("users/users-home", { users, products, cartCount, wishCount });
    });
  },

  userLoginGet: (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      res.render("users/users-login", {
        Err: req.session.Err,
        blockErr: req.session.blockErr,
        cartCount,
        wishCount,
      });
    }
    req.session.blockErr = false;
    req.session.Err = false;
  },

  userLoginPost: (req, res) => {
    usersHelpers.doLogin(req.body).then((response) => {
      console.log(response, "this is response");
      console.log(response.user, "this is response user");
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else if (response.blocked) {
        req.session.blockErr = "You are Blocked";
        res.redirect("/login");
      } else {
        req.session.Err = "Invalid Email Or Password";
        res.redirect("/login");
      }
    });
  },

  userSignGet: (req, res) => {
    let cartCount = 0;
    let wishCount = 0;

    let error = req.session.error;
    let passEr = req.session.passError;
    res.render("users/users-sign", { error, passEr, cartCount, wishCount });
    req.session.error = false;
    req.session.passError = false;
  },

  userSignPost: (req, res) => {
    usersHelpers.doSignup(req.body).then((response) => {
      if (response.status) {
        req.session.error = "Email Alredy Submited";
        res.redirect("/signup");
      } else if (response.pwNotSame) {
        req.session.passError = "Password Not Match";
        res.redirect("/signup");
      } else {
        res.redirect("/login");
      }
    });
  },

  userShop: async (req, res) => {
    let users = req.session.user;
    let cartCount = 0;
    let wishCount = 0;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }

    let todayDate = new Date().toISOString().slice(0, 10);
    productHelper.startProductOffer(todayDate);
    productHelper.startCategoryOffer(todayDate);
    productHelper.getAllProductsUser().then((products) => {
    console.log(products);
    const userId = req.session?.user?._id

      let user = products.whishlist?.findIndex((id)=> id.user ==  userId)
      console.log(user);
      if(user != -1 && user != undefined ){
        res.render("users/users-shop", { products, users, cartCount, wishCount,wishlist:true});
      }else{
        res.render("users/users-shop", { products, users, cartCount, wishCount,wishlist:false});

      }
  });
},
   

  


     
  userProductPage: async (req, res) => {
    let users = req.session.user;
    let cartCount = 0;
    let wishCount = 0;

    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    const userId = req.session?.user?._id

    productHelper.getOneProduct(req.params.id, userId).then((prod) => {
      let user = prod.whishlist?.findIndex((id)=> id.user == userId)
      if(user != -1 && user != undefined ){
      res.render("users/users-product", { prod, users, cartCount, wishCount, wishlist : true }); 
      }else{
      res.render("users/users-product", { prod, users, cartCount, wishCount, wishlist : false }); 
      }
    });
  },

  viewCart: async (req, res) => {
    let users = req.session.user;
    let wishCount = 0;
    userId = req.session.user._id;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }

    let product = await usersHelpers.getCartProducts(req.session.user._id);

    console.log(product);
    let totalValue = await usersHelpers.getTotalAmount(req.session.user._id);

    res.render("users/user-cart", {
      product,
      user: req.session.user,
      totalValue,
      users,
      cartCount,
      wishCount,
     
    });
  },

  addToCart: (req, res) => {
    usersHelpers
      .addToCart(req.params.id, req.session.user._id).then(()=>{
        usersHelpers.getCartSubTotal(req.params.id,req.session.user._id).then(()=>{
          res.json({ status: true });

        })

      })
      
      

        
      
  },

  changeProductQty: (req, res, next) => {
    userId = req.body.user;
    proId = req.body.product;
    usersHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await usersHelpers.getTotalAmount(req.session.user._id);
      response.cartSubTotal = await usersHelpers.getCartSubTotal(proId,userId);
      console.log(response);
      res.json(response);
    });
  },

  removeCartProduct: (req, res) => {
    proId = req.params.proId;
    cartId = req.params.cartId;
    usersHelpers.deleteCartItem(proId, cartId).then(() => {
      res.json({ status: true });
    });
  },

  checkOutOrder: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let total = await usersHelpers.getTotalAmount(req.session.user._id);
    let product = await usersHelpers.getCartProducts(req.session.user._id);
    let wallet = await usersHelpers.getWalletAmount(req.session.user._id);
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    let showWallet = false;
    if (wallet >= total) {
      showWallet = true;
    }

    await usersHelpers
      .getUserDetails(req.session.user._id)
      .then((userAddress) => {
        res.render("users/user-checkout", {
          total,
          users: req.session.user,
          product,
          userAddress,
          showWallet,
          cartCount,
          wishCount,
        });
      });
  },

  checkOutOrderPost: async (req, res) => {
    if (req.session.couponTotal) {
      var totalPrice = req.session.couponTotal;
    } else {
      totalPrice = await usersHelpers.getTotalAmount(req.body.userId);
    }

    let product = await usersHelpers.getCartList(req.body.userId);
    usersHelpers
      .checkOutOrder(req.body, product, totalPrice)
      .then((orderId) => {
        console.log("before send");
        if (req.body["payment-method"] == "COD") {
          res.json({ cod: true });
        } else if (req.body["payment-method"] == "paypal") {
          usersHelpers.generatePayal(totalPrice).then((link) => {
            // req.session.couponTotal = null
            res.json({ link, paypal: true });
          });
        } else if (req.body["payment-method"] == "razorepay") {
          usersHelpers
            .generateRazorpay(orderId, totalPrice)
            .then((response) => {
              res.json(response);
            });
        } else {
          usersHelpers.reduceWallet(req.body.userId, totalPrice).then(() => {
            res.json({ wallet: true });
          });
        }
      });
  },

  userLogout: (req, res) => {
    req.session.destroy();
    res.redirect("/");
  },

  addAddressGet: (req, res) => {
    let user = req.session.user;
    res.render("users/add-Adress", { user });
  },

  addAddressPost: (req, res) => {
    console.log(req.body);
    console.log(req.session.user._id);
    let userId = req.session.user._id;
    usersHelpers.addAdress(req.body, userId).then((response) => {
      res.redirect("/checkOut");
    });
  },

  varifyPayment: (req, res) => {
    usersHelpers
      .verifyPayment(req.body)
      .then(() => {
        usersHelpers
          .changePaymentStatus(req.body["order[receipt]"])
          .then(() => {
            res.json({ status: true });
          });
      })
      .catch((err) => {
        console.log("err");
        res.json({ status: "Payment Failed" });
      });
  },

  thankPage: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    res.render("users/user-conform", { cartCount, wishCount, users });
  },

  orderHistory: async (req, res) => {
    let users = req.session.user;
    let cartCount = 0;
    let wishCount = 0;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    let orderHistorys = await usersHelpers.getOrderHistory(
      req.session.user._id
    );
    let userAddress = await usersHelpers.GetUserAddress(req.session.user._id);
    
    console.log("/////////////////////");
    let deliveryDetails = await usersHelpers.getDeliveryDetails(
      req.session.user._id
    );

    res.render("users/demmyOrder", {
      orderHistorys,
      notShowB: true,
      cartCount,
      wishCount,
      users,
    });
  },

  orderProduct: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    let OrdersProduct = await usersHelpers.getOrderProducts(req.params.id);
    let OrderPrice = await usersHelpers.getOrderPrice(req.params.id);
    res.render("users/user-orderProduct", { OrdersProduct, OrderPrice,users,cartCount,wishCount });
  },

  cancelOrder: (req, res) => {
    usersHelpers.cancelOrder(req.params.id);
    res.redirect("/orderHistory");
  },

  otpMobileGet:async(req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    
    let noUserErr = req.session.noUserErr;
    let blockErr = req.session.blockErr;
    res.render("users/otp-login", { noUserErr, blockErr, validation: true, cartCount,wishCount });
    req.session.noUserErr = false;
    req.session.blockErr = false;
  },

  otpMobilePost:async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    usersHelpers.checkMobile(req.body).then((response) => {
      if (response.blocked) {
        req.session.blockErr = "user is temporarily blocked";
        res.redirect("/otp-login");
      } else if (response.noUser) {
        req.session.noUserErr = "no user found please signup";
        res.redirect("/otp-login");
      } else {
        let phone = response.Number;
        client.verify
          .services(servicesID)
          .verifications.create({ to: `+91${req.body.phone}`, channel: "sms" })
          .then((response) => {
            res.render("users/otp", { phone,cartCount,wishCount });
          });
      }
    });
  },

  otpCodeGet:async (req, res) => {
   
    let otpErr = req.session.invalidOtpErr;
    res.render("users/otp", { otpErr,cartCount,wishCount });
    req.session.invalidOtpErr = false;
  },

  otpCodePost: (req, res) => {
    let otp = req.body.otp;
    let phone = req.body.phone;
    client.verify
      .services(servicesID)
      .verificationChecks.create({ to: `+91${phone}`, code: otp })
      .then((response) => {
        let valid = response.valid;
        if (valid) {
          usersHelpers.userOtp(phone).then((response) => {
            req.session.loggedIn = true;
            req.session.user = response;
            res.redirect("/");
          });
        } else {
          req.session.invalidOtpErr = "invalid otp";
          res.redirect("/enter-otp");
        }
      });
  },

  viewWishlist: async (req, res) => {
    let users = req.session.user;
    let cartCount = 0;
    let wishCount = 0;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    let product = await usersHelpers.getWishlistProduct(req.session.user._id);
    res.render("users/whishlist", { product, wishCount, users, cartCount });
  },

  addToWishlist: (req, res) => {
    usersHelpers
      .addToWishlist(req.params.id, req.session.user._id)
      .then(() => {
        res.json({ add: true });
      })
      .catch(() => {
        res.json({ remove: true });
      });
      
  },

  searchProductGet: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }

    res.render("users/search", { notShowB: true, cartCount, wishCount, users });
  },

  searchProductPost: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }

    productHelper.searchProduct(req.body.search).then((products) => {
      res.render("users/SearchedProducts", {
        products,
        wishCount,
        cartCount,
        users,
      });
    });
  },

  deleteWishlist: (req, res) => {
    let proId = req.params.proId;
    let wishId = req.params.wishId;
    usersHelpers.deleteWishlist(proId, wishId).then(() => {
      res.json({ status: true });
    });
  },

  viewProfile: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    oneUser = await usersHelpers.getOneUser(req.session.user._id);
    walletHistory = await usersHelpers.getWalletHistory(req.session.user._id);
    res.render("users/profile", {
      oneUser,
      cartCount,
      wishCount,
      users,
      walletHistory,
    });
  },

  editProfileGet: async (req, res) => {
    user = await usersHelpers.getOneUser(req.session.user._id);

    res.render("users/edit-Profile", { user });
  },

  editProfilePost: (req, res) => {
    usersHelpers.editProfile(req.session.user._id, req.body).then(() => {
      res.redirect("/profile");
    });
  },

  CouponApplay: async (req, res) => {
    let id = req.session.user._id;
    let coupon = req.body.coupon;
    let totalAmount = await usersHelpers.getTotalAmount(req.session.user._id);
    usersHelpers.validateCoupon(req.body, id, totalAmount).then((response) => {
      req.session.couponTotal = response.total;
      if (response.success) {
        console.log("success");
        res.json({
          couponSuccess: true,
          total: response.total,
          discountValue: response.discountValue,
          coupon,
        });
      } else if (response.couponUsed) {
        res.json({ couponUsed: true });
      } else if (response.couponExpired) {
        console.log("expired");
        res.json({ couponExpired: true });
      } else {
        res.json({ invalidCoupon: true });
      }
    });
  },

  forgottPasswordGet: (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    res.render("users/forgot-password", {
      FPBerr: req.session.FPblockErr,
      FPUerr: req.session.FPnoUserErr,
      passErr: req.session.pasErr,
      cartCount,
      wishCount,
    });
    req.session.FPblockErr = false;
    req.session.FPnoUserErr = false;
    req.session.pasErr = false;
  },

  forgottPasswordPost: async (req, res) => {
    let cartCount = 0;
    let wishCount = 0;
    await usersHelpers.forgotPassword(req.body).then((response) => {
      let email = response.email;
      if (response.blocked) {
        req.session.FPblockErr = "You Are Blocked";
        res.redirect("/forgot-password");
      } else if (response.noUser) {
        req.session.FPnoUserErr = "Email Is Not Exist ";
        res.redirect("/forgot-password");
      } else {
        res.render("users/repassword", { email, cartCount, wishCount });
      }
    });
  },

  newPasswordGet: (req, res) => {
    res.render("users/repassword");
  },

  newPasswordPost: (req, res) => {
    console.log(req.body);

    usersHelpers.changePassword(req.body).then((response) => {
      if (response.status) {
        res.redirect("/login");
      } else {
        req.session.pasErr = "Password Not Matched";
        res.redirect("/forgot-password");
      }
    });
  },

  returnProduct: (req, res) => {
    usersHelpers.returnOrder(req.params.id).then(() => {
      res.redirect("/orderHistory");
    });
  },

  invoice: async (req, res) => {
    let user = req.session.user;
    let invoice = await usersHelpers.getUserInvoice(req.params.id);
    console.log(invoice);
    let products = await usersHelpers.getOrderProducts(req.params.id);
    console.log(products);
    res.render("users/invoice", { user, invoice, products });
  },

  userContact:async(req,res)=>{
    let cartCount = 0;
    let wishCount = 0;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await usersHelpers.getCartCount(req.session.user._id);
      wishCount = await usersHelpers.getWishlistCount(req.session.user._id);
    }
    res.render('users/contact',{cartCount,wishCount,users})
  }

};
module.exports = userController;
