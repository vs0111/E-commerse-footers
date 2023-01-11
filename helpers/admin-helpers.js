var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const moment = require("moment");

module.exports = {
  /* admin signup */
  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      adminData.password = await bcrypt.hash(adminData.password, 10);
      db.get()
        .collection(collection.ADMIN_COLLECTION)
        .insertOne(adminData)
        .then((responce) => {
          resolve(responce);
        });
    });
  },

  /* admin login */
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (admin) {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            console.log("login Success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login Faile");
        resolve({ status: false });
      }
    });
  },
  /* admin userManagement*/
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .limit(10)
        .toArray();
      resolve(users);
    });
  },

  getUserPage2: () => {
    return new Promise(async (resolve, reject) => {
      let users2 = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .skip(10)
        .limit(10)
        .toArray();
      resolve(users2);
    });
  },

  getUserPage3: () => {
    return new Promise(async (resolve, reject) => {
      let users3 = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .skip(20)
        .limit(10)
        .toArray();
      resolve(users3);
    });
  },

  blockUser: (UserId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(UserId) },
          {
            $set: {
              isblocked: true,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  unblockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              isblocked: false,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  /* admin categoryManagement */
  addCategory: (catId) => {
    return new Promise(async (resolve, reject) => {
      const category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ name: catId.name });
      if (category) {
        reject("Category Exists!!");
      } else {
        db.get()
          .collection(collection.CATEGORY_COLLECTION)
          .insertOne(catId)
          .then((responce) => {
            resolve(responce);
          });
      }
    });
  },
  getCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(category);
    });
  },

  deleteCategory: (catId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: objectId(catId) })
        .then((responce) => {
          resolve();
        });
    });
  },

  getOneCategory: (CatId) => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(CatId) });
      resolve(category);
    });
  },

  updateCategory: (cat, catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(catId) },
          {
            $set: {
              name: cat,
            },
          }
        )
        .then((response) => {
          resolve(true);
        });
    });
  },

  /* admin orderManagement */
  getOrder: () => {
    return new Promise(async (resolve, reject) => {
      let Orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({})
        .sort({ date: -1 })
        .toArray();
      if (Orders) {
        for (i = 0; i < Orders.length; i++) {
          Orders[i].date = moment(Orders[i].date).format("lll");
        }

        resolve(Orders);
      } else {
        resolve(0);
      }
    });
  },

  changeOrderStatus: (data) => {
    return new Promise((resolve, reject) => {
      try {
        if (data.status == "Shipped") {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(data.OrderId) },
              {
                $set: {
                  status: data.status,
                  is_shipped: true,
                },
              }
            )
            .then((response) => {
              resolve();
            });
        } else if (data.status == "Delivered") {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(data.OrderId) },
              {
                $set: {
                  status: data.status,
                  is_delivered: true,
                  deliverdDate: new Date(),
                },
              }
            )
            .then((response) => {
              resolve();
            });
        } else if (data.status == "Cancelled") {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(data.OrderId) },
              {
                $set: {
                  status: data.status,
                  is_Cancelled: true,
                },
              }
            )
            .then((response) => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(data.OrderId) },
              {
                $set: {
                  status: data.status,
                },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } catch {
        resolve(0);
      }
    });
  },

  /* admin Dashboard */
  monthlyReport: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let start = new Date(new Date() - 1000 * 60 * 60 * 24 * 30);
        let end = new Date();

        let orderSuccess = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({
            date: { $gte: start, $lte: end },
            status: { $nin: ["cancelled"] },
          })
          .sort({ Date: -1, Time: -1 })
          .toArray();
        // console.log('============',orderSuccess);
        var i;
        for (i = 0; i < orderSuccess.length; i++) {
          // console.log(orderSuccess[i].date);
          orderSuccess[i].date = moment(orderSuccess[i].date).format("lll");
        }
        // console.log(orderSuccess,"hfgbkhdfbj");
        let orderTotal = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ date: { $gte: start, $lte: end } })
          .toArray();
        // console.log('gdsgssg',orderTotal);
        let orderSuccessLength = orderSuccess.length;
        let orderTotalLength = orderTotal.length;
        let orderFailLength = orderTotalLength - orderSuccessLength;
        let total = 0;
        let discount = 0;
        let razorpay = 0;
        let cod = 0;
        let paypal = 0;
        let wallet = 0;

        for (let i = 0; i < orderSuccessLength; i++) {
          total = total + orderSuccess[i].totalAmount;
          if (orderSuccess[i].paymentMethod === "COD") {
            cod++;
          } else if (orderSuccess[i].paymentMethod === "paypal") {
            paypal++;
          } else if (orderSuccess[i].paymentMethod === "wallet") {
            wallet++;
          } else {
            razorpay++;
          }
          if (orderSuccess[i].discount) {
            // console.log("discount check");
            discount = discount + parseInt(orderSuccess[i].discount);
            discount++;
          }
        }
        let productCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                $and: [
                  {
                    status: { $nin: ["cancelled"] },
                  },
                  { date: { $gte: start, $lte: end } },
                ],
              },
            },
            {
              $project: {
                _id: 0,
                quantity: "$products.quantity",
              },
            },
            {
              $unwind: "$quantity",
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$quantity" },
              },
            },
          ])
          .toArray();
        var data = {
          start: moment(start).format("YYYY/MM/DD"),
          end: moment(end).format("YYYY/MM/DD"),
          totalOrders: orderTotalLength,
          successOrders: orderSuccessLength,
          failOrders: orderFailLength,
          totalSales: total,
          cod: cod,
          paypal: paypal,
          wallet: wallet,
          razorpay: razorpay,
          discount: discount,
          productCount: productCount[0].total,
          currentOrders: orderSuccess,
        };
        console.log(data);
        resolve(data);
      } catch {
        resolve(0);
      }
    });
  },
  getDashboardCount: () => {
    try {
      return new Promise(async (resolve, reject) => {
        let orderCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find()
          .count();
        let userCount = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find()
          .count();
        let productCount = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find()
          .count();
        let obj = {
          userCount: userCount,
          orderCount: orderCount,
          productCount: productCount,
        };
        resolve(obj);
      });
    } catch {
      resolve(0);
    }
  },
  totalRevenue: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let totalRevenue = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                status: "Delivered",
              },
            },
            {
              $project: {
                totalAmount: "$totalAmount",
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
              },
            },
          ])
          .toArray();
        resolve(totalRevenue[0].totalAmount);
      } catch {
        console.log("catch worked  -------------");
        resolve(0);
      }
    });
  },

  dailyRevenue: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let dailyRevenue = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                date: {
                  $lt: new Date(),
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24),
                },
              },
            },
            {
              $match: {
                status: "Delivered",
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
              },
            },
          ])
          .toArray();
        resolve(dailyRevenue[0].totalAmount);
      } catch {
        resolve(0);
      }
    });
  },
  weeklyRevenue: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let weeklyRevenue = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7),
                },
              },
            },
            {
              $match: {
                status: "Delivered",
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
              },
            },
          ])
          .toArray();
        resolve(weeklyRevenue[0].totalAmount);
      } catch {
        resolve(0);
      }
    });
  },
  monthlyRevenue: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let monthlyRevenue = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7 * 4),
                },
              },
            },
            {
              $match: {
                status: "Delivered",
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
              },
            },
          ])
          .toArray();
        resolve(monthlyRevenue[0].totalAmount);
      } catch {
        resolve(0);
      }
    });
  },

  yearlyRevenue: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let yearlyRevenue = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7 * 4 * 12),
                },
              },
            },
            {
              $match: {
                status: "Delivered",
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$totalAmount" },
              },
            },
          ])
          .toArray();

        resolve(yearlyRevenue[0].totalAmount);
      } catch {
        resolve(0);
      }
    });
  },

  getchartData: (req, res) => {
    try {
      return new Promise((resolve, reject) => {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            { $match: { status: "Delivered" } },
            {
              $project: {
                date: { $convert: { input: "$_id", to: "date" } },
                total: "$totalAmount",
              },
            },
            {
              $match: {
                date: {
                  $lt: new Date(),
                  $gt: new Date(
                    new Date().getTime() - 24 * 60 * 60 * 1000 * 365
                  ),
                },
              },
            },
            {
              $group: {
                _id: { $month: "$date" },
                total: { $sum: "$total" },
              },
            },
            {
              $project: {
                month: "$_id",
                total: "$total",
                _id: 0,
              },
            },
          ])
          .toArray()
          .then((result) => {
            db.get()
              .collection(collection.ORDER_COLLECTION)
              .aggregate([
                { $match: { status: "Delivered" } },
                {
                  $project: {
                    date: { $convert: { input: "$_id", to: "date" } },
                    total: "$totalAmount",
                  },
                },
                {
                  $match: {
                    date: {
                      $lt: new Date(),
                      $gt: new Date(
                        new Date().getTime() - 24 * 60 * 60 * 1000 * 7
                      ),
                    },
                  },
                },
                {
                  $group: {
                    _id: { $dayOfWeek: "$date" },
                    total: { $sum: "$total" },
                  },
                },
                {
                  $project: {
                    date: "$_id",
                    total: "$total",
                    _id: 0,
                  },
                },
                {
                  $sort: { date: 1 },
                },
              ])
              .toArray()
              .then((weeklyReport) => {
                let obj = {
                  result,
                  weeklyReport,
                };
                resolve(obj);
              });
          });
      });
    } catch {
      resolve(0);
    }
  },
  /* admin couponManagement */
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupon = db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(coupon);
    });
  },

  addCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let coupon = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ coupon: data.coupon });
        if (coupon) {
          reject();
        } else {
          let startDateIso = new Date(data.starting);
          let endDateIso = new Date(data.expiry);
          let expiry = moment(data.expiry).format("YYYY-MM-DD");
          let starting = moment(data.starting).format("YYYY-MM-DD");
          let couponObj = {
            coupon: data.coupon,
            offer: parseInt(data.offer),
            starting: starting,
            expiry: expiry,
            startDateIso: startDateIso,
            endDateIso: endDateIso,
            users: [],
          };
          db.get()
            .collection(collection.COUPON_COLLECTION)
            .insertOne(couponObj)
            .then(() => {
              resolve();
            });
        }
      } catch {
        resolve(0);
      }
    });
  },

  editCoupon: (data) => {
    console.log(data);
    return new Promise((resolve, reject) => {
      try {
        let startDateIso = new Date(data.starting);
        let endDateIso = new Date(data.expiry);
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .updateOne(
            { _id: objectId(data.id) },
            {
              $set: {
                coupon: data.coupon,
                starting: data.starting,
                expiry: data.expiry,
                offer: data.offer,
                startDateIso: startDateIso,
                endDateIso: endDateIso,
              },
            }
          )
          .then(() => {
            resolve();
          });
      } catch {
        resolve(0);
      }
    });
  },

  deleteCoupon: (coupId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .deleteOne({ _id: objectId(coupId) })
        .then(() => {
          resolve();
        });
    });
  },

  getCoupon: (coupId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ _id: objectId(coupId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  //category offer section
  addCatOffer: (data) => {
    data.catOfferPercentage = parseInt(data.catOfferPercentage);
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .findOne({ category: data.category });
      if (exist) {
        reject();
      } else {
        data.startDateIso = new Date(data.starting);
        data.endDateIso = new Date(data.expiry);
        let exist = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ name: data.product, offer: { $exists: true } });
        if (exist) {
          reject();
        } else {
          db.get()
            .collection(collection.CATEGORY_OFFERS)
            .insertOne(data)
            .then(async (response) => {
              resolve(response);
            })
            .catch((err) => {
              reject(err);
            });
        }
      }
    });
  },

  getAllCatOffers: () => {
    return new Promise(async (resolve, reject) => {
      let allCatOffers = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .find()
        .toArray();
      resolve(allCatOffers);
    });
  },

  getCatOfferDetails: (catOfferId) => {
    return new Promise(async (resolve, reject) => {
      let catOfferDetails = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .findOne({ _id: objectId(catOfferId) });
      resolve(catOfferDetails);
    });
  },

  editCatOffer: (catOfferId, data) => {
    console.log(data);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_OFFERS)
        .updateOne(
          { _id: objectId(catOfferId) },
          {
            $set: {
              category: data.category,
              starting: data.starting,
              expiry: data.expiry,
              catOfferPercentage: parseInt(data.catOfferPercentage),
              startDateIso: new Date(data.starting),
              endDateIso: new Date(data.expiry),
            },
          }
        )
        .then(async () => {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ category: data.category, offer: { $exists: true } })
            .toArray();
          if (products) {
            await products.map(async (product) => {
              await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(product._id) },
                  {
                    $set: {
                      Amount: product.actualPrice,
                    },
                    $unset: {
                      offer: "",
                      catOfferPercentage: "",
                      actualPrice: "",
                    },
                  }
                )
                .then(() => {
                  resolve();
                });
            });
          } else {
            resolve();
          }
          resolve();
        });
    });
  },
  deleteCatOffer: (catOfferId) => {
    return new Promise(async (resolve, reject) => {
      let catOffer = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .findOne({ _id: objectId(catOfferId) });
      let category = catOffer.category;
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ category: category, offer: { $exists: true } })
        .toArray();
      if (products) {
        console.log("6666666666666666666666");
        await db
          .get()
          .collection(collection.CATEGORY_OFFERS)
          .deleteOne({ _id: objectId(catOfferId) })
          .then(async () => {
            await products.map(async (product) => {
              await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(product._id) },
                  {
                    $set: {
                      Amount: product.actualPrice,
                    },
                    $unset: {
                      offer: "",
                      catOfferPercentage: "",
                      actualPrice: "",
                    },
                  }
                )
                .then(() => {
                  console.log("77777777777777777777777777777777777777777777");
                  resolve();
                });
            });
          });
      } else {
        console.log("8888888888888888888888888888888888");
        resolve();
      }
    });
  },

  //product offer section
  addProductOffer: (data) => {
    return new Promise(async (resolve, reject) => {
      let exist = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .findOne({ product: data.product });
      if (exist) {
        reject();
      } else {
        data.startDateIso = new Date(data.starting);
        data.endDateIso = new Date(data.expiry);
        data.proOfferPercentage = parseInt(data.proOfferPercentage);
        let exist = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ name: data.name, offer: { $exists: true } });
        if (exist) {
          reject();
        } else {
          db.get()
            .collection(collection.PRODUCT_OFFERS)
            .insertOne(data)
            .then(() => {
              resolve();
            });
        }
      }
    });
  },
  getAllProductOffers: () => {
    return new Promise(async (resolve, reject) => {
      let allProdOffers = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .find()
        .toArray();
      resolve(allProdOffers);
    });
  },

  editProdOffer: (proOfferId, data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_OFFERS)
        .updateOne(
          { _id: objectId(proOfferId) },
          {
            $set: {
              product: data.product,
              starting: data.starting,
              expiry: data.expiry,
              proOfferPercentage: parseInt(data.proOfferPercentage),
              startDateIso: new Date(data.starting),
              endDateIso: new Date(data.expiry),
            },
          }
        )
        .then(async () => {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ name: data.product, offer: { $exists: true } })
            .toArray();
          if (products) {
            await products.map(async (product) => {
              await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(product._id) },
                  {
                    $set: {
                      Amount: product.actualPrice,
                    },
                    $unset: {
                      offer: "",
                      proOfferPercentage: "",
                      actualPrice: "",
                    },
                  }
                )
                .then(() => {
                  resolve();
                });
            });
          } else {
            resolve();
          }
          resolve();
        });
    });
  },

  getProdOfferDetails: (proOfferId) => {
    return new Promise(async (resolve, reject) => {
      let proOfferDetails = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .findOne({ _id: objectId(proOfferId) });
      resolve(proOfferDetails);
    });
  },

  deleteProdOffer: (proOfferId) => {
    return new Promise(async (resolve, reject) => {
      let productOffer = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .findOne({ _id: objectId(proOfferId) });
      let pname = productOffer.product;
      let product = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ name: pname });
      db.get()
        .collection(collection.PRODUCT_OFFERS)
        .deleteOne({ _id: objectId(proOfferId) })
        .then(() => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { name: pname },
              {
                $set: {
                  Amount: product.actualPrice,
                },
                $unset: {
                  offer: "",
                  proOfferPercentage: "",
                  actualPrice: "",
                },
              }
            )
            .then(() => {
              resolve();
            });
        });
    });
  },
};
