const adminHelpers = require("../helpers/admin-helpers");
const productHelpers = require("../helpers/product-helpers");
const usersHelpers = require("../helpers/users-helpers");

const adminController = {
  viewSignGet: (req, res) => {
    res.render("admin/admin-signup");
  },

  viewSignPost: (req, res) => {
    adminHelpers.doSignup(req.body).then((response) => {
      res.redirect("/admin");
    });
  },

  viewLoginGet: (req, res) => {
    res.render("admin/admin-login", { logErr: req.session.Err });
    req.session.Err = false;
  },

  viewLoginPost: (req, res) => {
    adminHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.adminloggedIn = true;
        req.session.admin = response.admin;
//         console.log(req.session.loggedIn, req.session.admin);
        res.redirect("admin/dashBoard");
      } else {
        req.session.Err = true;
        res.redirect("/admin");
      }
    });
  },

  viewDashBoard: async (req, res) => {
    let adminSession = req.session.admin;
    if (adminSession) {
      let allCount = await adminHelpers.getDashboardCount();
      let totalRevenue = await adminHelpers.totalRevenue();
      let dailyRevenue = await adminHelpers.dailyRevenue();
      let weeklyRevenue = await adminHelpers.weeklyRevenue();
      let monthlyRevenue = await adminHelpers.monthlyRevenue();
      let yearlyRevenue = await adminHelpers.yearlyRevenue();
      let data = await adminHelpers.monthlyReport();
      res.render("admin/dashboard", {
        admin: true,
        adminSession,
        allCount,
        dailyRevenue,
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        yearlyRevenue,
        data,
      });
    } else {
      res.redirect("/admin/login");
    }
  },

  viewProduct: async (req, res) => {
    let adminData = req.session.admin;
    productHelpers.getAllProducts().then((products) => {
      res.render("admin/product", { products, admin:true, adminData });
    });
  },

  addProductGet: async (req, res) => {
    let catresponce = await adminHelpers.getCategory();
    console.log(catresponce);
    res.render("admin/addProduct", {
      Err: req.session.prErr,
      catresponce,
      admin: true,
    });
    req.session.prErr = false;
  },

  addProductPost: (req, res) => {

    productHelpers.addProduct(req.body, (responce) => {
      let image1 = req.files.Image1;
      let image2 = req.files.Image2;
      let image3 = req.files.Image3;
      let image4 = req.files.Image4;

      if (responce.status) {
        req.session.prErr = "This Product Is Already Exist";
        res.redirect("/admin/add-Product");
      } else {
        id = responce;

        image1.mv("./public/product-images/" + id + "1.jpg"),
          image2.mv("./public/product-images/" + id + "2.jpg"),
          image3.mv("./public/product-images/" + id + "3.jpg"),
          image4.mv("./public/product-images/" + id + "4.jpg"),
          res.redirect("/admin/viewProduct");
      }
    });
  },

  editProductGet: async (req, res) => {
    let product = await productHelpers.getProductDetails(req.params.id);
    let catResponce = await adminHelpers.getCategory();
    console.log(product);
    console.log("///////////////////////");
    console.log(catResponce);
    res.render("admin/edit-pro", { product, catResponce, admin: true });
  },

  editProductPost: (req, res) => {
    let id = req.params.id;

    productHelpers.updateProduct(id, req.body).then(() => {
      try {
        if (req.files.image1) {
          let Image1 = req.files.image1;
          Image1.mv("./public/product-images/" + id + "1.jpg");
        }
        if (req.files.image2) {
          let Image2 = req.files.image2;
          Image2.mv("./public/product-images/" + id + "2.jpg");
        }
        if (req.files.image3) {
          let Image3 = req.files.image3;
          Image3.mv("./public/product-images/" + id + "3.jpg");
        }
        if (req.files.image4) {
          let Image4 = req.files.image4;
          Image4.mv("./public/product-images/" + id + "4.jpg");
        }
        res.redirect("/admin/viewProduct");
      } catch {
        res.redirect("/admin/viewProduct");
      }
    });
  },

  deleteProduct: (req, res) => {
    let proId = req.params.id;
    productHelpers.deleteProduct(proId).then((responce) => {
      res.redirect("/admin/viewProduct");
    });
  },

  viewUsersPage1: async (req, res) => {
    let adminData = req.session.admin;
    let users = await adminHelpers.getAllUsers();
    console.log(users);
    res.render("admin/users-management", { users, admin:true, adminData });
  },

  blockUser: (req, res) => {
    let userId = req.params.id;
    console.log(userId);
    adminHelpers.blockUser(userId).then();
    res.redirect("/admin/view-users");
  },

  unblockUser: (req, res) => {
    let userId = req.params.id;
    adminHelpers.unblockUser(userId).then();
    res.redirect("/admin/view-users");
  },

  viewCategory: (req, res) => {
    let adminData = req.session.admin;
    adminHelpers.getCategory().then((responce) => {
      res.render("admin/category", { responce, admin: true, adminData });
    });
  },

  addCategoryGet: (req, res) => {
    const error = req.session.error;
    req.session.error = null;
    res.render("admin/addcategory", { error, admin: true });
  },

  addCategoryPost: (req, res) => {
    let category = req.body;
    console.log(req.body);
    adminHelpers
      .addCategory(req.body)
      .then(() => {
        res.redirect("/admin/view-category");
      })
      .catch((err) => {
        req.session.error = err;
        res.redirect("/admin/add-category");
      });
  },

  editCategoryGet: async (req, res) => {
    let category = await adminHelpers.getOneCategory(req.params.id);
    res.render("admin/edit-category", { category });
  },

  editCategoryPost: (req, res) => {
    console.log(req.body);
    adminHelpers.updateCategory(req.body.category, req.body.id).then(() => {
      res.redirect("/admin/view-category");
    });
  },

  deleteCategory: (req, res) => {
    let catId = req.params.id;
    adminHelpers.deleteCategory(catId).then((responce) => {
      res.redirect("/admin/view-category");
    });
  },

  viewOrders: async (req, res) => {
    let adminData = req.session.admin;
    let allOrders = await adminHelpers.getOrder();
    res.render("admin/order-management", { admin: true, allOrders, adminData });
  },

  changeOrderStatus: (req, res) => {
    adminHelpers.changeOrderStatus(req.body).then(() => {
      res.redirect("/admin/order-view");
    });
  },

  viewOrderProduct: async (req, res) => {
    console.log(req.params.id);
    let OrdersProduct = await usersHelpers.getOrderProducts(req.params.id);
    res.render("admin/view-orderProduct", { admin: true, OrdersProduct });
  },

  salersReport: async (req, res) => {
    let adminData = req.session.admin;
    let allOrders = await adminHelpers.getOrder();
    res.render("admin/sales-report", { allOrders, admin: true, adminData });
  },

  dashBoard: (req, res) => {
    adminHelpers.getchartData().then((obj) => {
      let result = obj.result;
      let weeklyReport = obj.weeklyReport;
      res.json({ data: result, weeklyReport });
    });
  },

  couponGet: async (req, res) => {
    let adminData = req.session.admin;

    let admin = req.session.admin;
    let coupons = await adminHelpers.getAllCoupons();
    res.render("admin/coupon-management", {
      coupons,
      coupExistErr: req.session.couponExist,
      admin,
      adminData,
    });
    req.session.couponExist = false;
  },

  addCouponGet: async (req, res) => {
    let admin = req.session.admin;
    res.render("admin/add-coupon", { admin });
  },

  addCouponPost: (req, res) => {
    adminHelpers
      .addCoupon(req.body)
      .then(() => {
        res.redirect("/admin/coupon-management");
      })
      .catch(() => {
        req.session.couponExist = "Coupon Already Exist!!!";
        res.redirect("/admin/coupon-management");
      });
  },

  editCouponGet: async (req, res) => {
    let admin = req.session.admin;
    let coupon = await adminHelpers.getCoupon(req.params.id);
    res.render("admin/edit-coupon", { coupon, admin });
  },

  editCouponPost: (req, res) => {
    adminHelpers.editCoupon(req.body).then(() => {
      res.redirect("/admin/coupon-management");
    });
  },

  deleteCoupon: (req, res) => {
    adminHelpers.deleteCoupon(req.params.id).then(() => {
      res.redirect("/admin/coupon-management");
    });
  },

  categoryOfferGet: async (req, res) => {
    let allCategories = await adminHelpers.getCategory();
    let CatOffers = await adminHelpers.getAllCatOffers();
    res.render("admin/category-offers", {
      admin: true,
      allCategories,
      CatOffers,
      catOfferErr: req.session.catOfferErr,
    });
    req.session.catOfferErr = false;
  },

  cateOfferPost: (req, res) => {
    adminHelpers
      .addCatOffer(req.body)
      .then(() => {
        res.redirect("/admin/category-offers");
      })
      .catch(() => {
        req.session.catOfferErr = "This Offer Already Exists!";
        res.redirect("/admin/category-offers");
      });
  },

  editCatOfferGet: async (req, res) => {
    let catOfferId = req.params._id;
    let catOfferDetails = await adminHelpers.getCatOfferDetails(catOfferId);
    res.render("admin/edit-catOffer", { admin: true, catOfferDetails });
  },

  editCatOfferPost: (req, res) => {
    let catOfferId = req.params._id;
    adminHelpers.editCatOffer(catOfferId, req.body).then(() => {
      res.redirect("/admin/category-offers");
    });
  },

  deleteCatOffer: async (req, res) => {
    let catOfferId = req.params._id;
    await adminHelpers.deleteCatOffer(catOfferId).then((response) => {
      res.redirect("/admin/category-offers");
    });
  },
  productOfferGet: async (req, res) => {
    let allProducts = await productHelpers.getAllProducts();
    let prodOffers = await adminHelpers.getAllProductOffers();
    res.render("admin/product-offers", {
      admin: true,
      allProducts,
      prodOffers,
      prodOfferErr: req.session.prodOfferErr,
    });
    req.session.prodOfferErr = false;
  },

  productOfferPost: async (req, res) => {
    adminHelpers
      .addProductOffer(req.body)
      .then(() => {
        res.redirect("/admin/product-offers");
      })
      .catch(() => {
        req.session.prodOfferErr = "This Offer Already Exists!";
        res.redirect("/admin/product-offers");
      });
  },

  editProductOfferGet: async (req, res) => {
    let proOfferId = req.params._id;
    let proOffer = await adminHelpers.getProdOfferDetails(proOfferId);
    res.render("admin/edit-prodOffer", { admin: true, proOffer });
  },

  editProductOfferPost: (req, res) => {
    let proOfferId = req.params._id;
    adminHelpers.editProdOffer(proOfferId, req.body).then(() => {
      res.redirect("/admin/product-offers");
    });
  },

  deleteProdOffer: (req, res) => {
    let proOfferId = req.params._id;
    adminHelpers.deleteProdOffer(proOfferId).then(() => {
      res.redirect("/admin/product-offers");
    });
  },
  getUsersPage2: async (req, res) => {
    let adminData = req.session.admin;
    users2 = await adminHelpers.getUserPage2();
    res.render("admin/users-management", { users2, admin: true,adminData });
  },

  getUsersPage3: async (req, res) => {
    let adminData = req.session.admin;
    users3 = await adminHelpers.getUserPage3();
    res.render("admin/users-management", { users3, admin: true,adminData });
  },

  activeProduct: (req, res) => {
    proId = req.params.id;
    productHelpers.activeProduct(proId).then(() => {
      res.redirect("/admin/viewProduct");
    });
  },

  logoutAdmin: (req, res) => {
    req.session.admin = null;
    req.session.adminloggedIn=false;

    res.redirect("/admin");
  },
};

module.exports = adminController;
