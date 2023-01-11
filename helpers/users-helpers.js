var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
// const { response, use } = require("../app");
const moment = require("moment");
var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");

const paypal = require("paypal-rest-sdk");
// const { resolve } = require("path");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

//Razorpay
var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      if (userData.password == userData.cpassword) {
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ email: userData.email });
        if (user) {
          // console.log('user exist');
          // console.log(user);

          resolve({ status: true });
        } else {
          userData.password = await bcrypt.hash(userData.password, 10);
          userData.cpassword = await bcrypt.hash(userData.cpassword, 10);
          db.get()
            .collection(collection.USER_COLLECTION)
            .insertOne(userData)
            .then((response) => {
              resolve({ status: false });
            });
        }
      } else {
        resolve({ pwNotSame: true });
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.Email });
      if (user) {
        if (user.isblocked) {
          resolve({ blocked: true });
        } else {
          bcrypt.compare(userData.Password, user.password).then((status) => {
            if (status) {
              // console.log("login Success")
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              // console.log("login Failed")
              resolve({ status: false });
            }
          });
        }
      } else {
        // console.log("login Failed.......")
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.product.findIndex(
          (products) => products.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "product.item": objectId(proId) },
              {
                $inc: { "product.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { product: proObj },
              }
            )
            .then((responce) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          product: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              item: "$product.item",
              quantity: "$product.quantity",
              subtotal: "$product.subtotal",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              subtotal: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      console.log(cartItems);
      // console.log("/////444")
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.product.length;
      }
      resolve(count);
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { product: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "product.item": objectId(details.product),
            },
            {
              $inc: { "product.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  deleteCartItem: (proId, cartId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(cartId), "product.item": objectId(proId) },
          {
            $pull: { product: { item: objectId(proId) } },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              item: "$product.item",
              quantity: "$product.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Amount"] } },
            },
          },
        ])
        .toArray();
      if (total.length > 0) {
        resolve(total[0].total);
      } else {
        resolve(0);
      }
    });
  },
  //tottal price for sub product
  getCartSubTotal: (proId,userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartSubTotal = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: objectId(userId) },
            },
            {
              $unwind: "$product",
            },
            {
              $project: {
                item: "$product.item",
                quantity: "$product.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $match: {
                item: objectId(proId),
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
            {
              $project: {
                unitprice: { $toInt: "$product.Amount" },
                quantity: { $toInt: "$quantity" },
              },
            },
            {
              $project: {
                _id: null,
                subtotal: { $sum: { $multiply: ["$quantity", "$unitprice"] } },
              },
            },
          ])
          .toArray();
        if (cartSubTotal.length > 0) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "product.item": objectId(proId) },
              {
                $set: {
                  "product.$.subtotal": cartSubTotal[0].subtotal,
                },
              }
            )
            .then((response) => {
              resolve(cartSubTotal[0].subtotal);
            });
        } else {
          cartSubTotal = 0;
          resolve(cartSubTotal);
        }
      } catch {
        resolve(0);
      }
    });
  },
  checkOutOrder: (order, product, total) => {
    return new Promise((resolve, reject) => {
      if (order.Coupon) {
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .updateOne(
            { coupon: order.Coupon },
            {
              $push: {
                users: order.userId,
              },
            }
          );
      }
      // console.log(order, product, total)
      let status =
        order["payment-method"] === "COD" ||
        order["payment-method"] === "paypal" ||
        order["payment-method"] === "wallet"
          ? "placed"
          : "pending";
      let orderObj = {
        deliveryDetails: {
          fisrtName: order.fname,
          lastName: order.lname,
          place: order.city,
          address: order.address,
          district: order.district,
          pincode: order.pincode,
          number: order.number,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: product,
        totalAmount: total,
        date: new Date(),
        status: status,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },

  getCartList: (userId) => {
    return new Promise(async (resolve, reject) => {
      // console.log(userId);
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.product);
    });
  },
  getOrderHistory: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ date: -1 })
        .toArray();
      if (orders) {
        for (i = 0; i < orders.length; i++) {
          orders[i].date = moment(orders[i].date).format("lll");
        }

        resolve(orders);
      } else {
        resolve(0);
      }
    });
  },
  // ordered product details
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },

  getOrderPrice: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  // cancel order
  cancelOrder: (id) => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(id) });
      if (
        order.paymentMethod === "wallet" ||
        order.paymentMethod === "razorepay" ||
        order.paymentMethod === "paypal"
      ) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(order.userId) },
            {
              $inc: {
                wallet: order.totalAmount,
              },
            }
          );
      }
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              is_Cancelled: true,
              status: "cancelled",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  addAdress: (dDetails, userId) => {
    return new Promise((resolve, reject) => {
      let addObj = {
        fisrtName: dDetails.fname,
        lastName: dDetails.lname,
        address: dDetails.address,
        place: dDetails.Place,
        district: dDetails.District,
        pincode: dDetails.Pincode,
        mobile: dDetails.Number,
      };

      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $push: { Address: addObj },
          }
        )
        .then((responce) => {
          resolve();
        });
    });
  },

  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((response) => {
          // console.log(response.Address)
          resolve(response);
        });
    });
  },

  GetUserAddress: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getDeliveryDetails: (userId) => {
    console.log(userId + "22222222222222222222222222222222222@@@@@@");
    return new Promise(async (resolve, reject) => {
      let res = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: { $eq: objectId(userId) } })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();

      resolve(res);
    });
  },

  generatePayal: (totalPrice) => {
    console.log("helperil-----------------------");
    return new Promise((resolve, reject) => {
      var create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "https://footers.online/order-placed",
          cancel_url: "https://footers.online/checkOut",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "item",
                  sku: "item",
                  price: totalPrice,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: totalPrice,
            },
            description: "This is the payment description.",
          },
        ],
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        console.log("create cheyyunnu-------------------");
        if (error) {
          console.log(error);
          throw error;
        } else {
          console.log("Create Payment Response");
          console.log(payment.links[1].href);
          resolve(payment.links[1].href);
        }
      });
    });
  },

  // mobile login
  checkMobile: (mobile) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Number: mobile.phone })
        .then((response) => {
          if (response) {
            if (response.isblocked) {
              resolve({ blocked: true });
            } else {
              resolve(response);
            }
          } else {
            resolve({ noUser: true });
          }
        });
    });
  },

  // getting user data using phone number
  userOtp: (phone) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Number: phone })
        .then((response) => {
          resolve(response);
        });
    });
  },

  //razorpay
  generateRazorpay: (orderId, totalAmount) => {
    totalAmount = parseInt(totalAmount);
    console.log(orderId);
    console.log(totalAmount);
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "" + orderId,
      };

      instance.orders.create(options, function (err, order) {
        console.log("===============================");
        if (err) {
          console.log(err);
          console.log("error occured in generate razorpay");
        } else {
          resolve(order);
          console.log(order);
        }
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "dSQLTvMvXIRFIGEuqMEeaT9F");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      console.log(details["payment[razorpay_signature]"]);
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  //getting wishlist products
  getWishlistProduct: (userId) => {
    return new Promise(async (resolve, reject) => {
      let items = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      // console.log(items);
      resolve(items);
    });
  },
  addToWishlist: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
    };
    return new Promise(async (resolve, reject) => {
      let userWish = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userWish) {
        let productExist = userWish.products.findIndex(
          (product) => product.item == proId
        );
        // console.log(productExist);
        if (productExist != -1) {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $pull: { products: { item: objectId(proId) } },
              }
            )
            .then(() => {
              db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
              {
                $pull:{ whishlist: {user: objectId(userId)}}
              })
              .then((res)=>{
                console.log(res);
                reject();
              })
            });
        } else {
          db.get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then(async() => {
             const product =await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
             let userObj = {
              user:objectId(userId)
             }
              db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                {_id:objectId(proId)},{$push: {whishlist: userObj}}
              ).then(()=>{
                resolve();
              })
              
            });
        }
      } else {
        let wishObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishObj)
          .then(() => {
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                {_id:objectId(proId)},{$push: {whishlist: userObj}}
              ).then(()=>{
                resolve();
              })
          });
      }
    });
  },

  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        let wishlist = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (wishlist) {
          count = wishlist.products.length;
          resolve(count);
        } else {
          resolve(count);
        }
      } catch {
        resolve(0);
      }
    });
  },
  // delete wishlist item
  deleteWishlist: (proId, wishId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: objectId(wishId), "products.item": objectId(proId) },
          {
            $pull: { products: { item: objectId(proId) } },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  editProfile: (userId, userData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              name: userData.name,
              email: userData.email,
              Number: userData.Number,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getOneUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      resolve(user);
    });
  },

  validateCoupon: (data, userId, totalAmount) => {
    return new Promise(async (resolve, reject) => {
      try {
        obj = {};
        let date = new Date();
        let coupon = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ coupon: data.coupon, Available: true });
        if (coupon) {
          // console.log('coupon available');
          let users = coupon.users;
          let userCheck = users.includes(userId);
          if (userCheck) {
            console.log("coupon used");
            obj.couponUsed = true;
            resolve(obj);
          } else {
            // console.log("coupon valid");
            // console.log(date);
            // console.log(coupon.endDateIso);
            if (date <= coupon.endDateIso) {
              let total = parseInt(totalAmount);
              let percentage = parseInt(coupon.offer);

              let discountValue = ((total * percentage) / 100).toFixed();
              obj.total = total - discountValue;
              obj.success = true;
              obj.discountValue = discountValue;
              resolve(obj);
            } else {
              // console.log("coupon expired");
              obj.couponExpired = true;
              resolve(obj);
            }
          }
        } else {
          // console.log("coupon invalid");
          obj.invalidCoupon = true;
          resolve(obj);
        }
      } catch {
        resolve(0);
      }
    });
  },

  startCouponOffer: (date) => {
    let couponStartDate = new Date(date);
    // console.log(couponStartDate);
    return new Promise(async (resolve, reject) => {
      try {
        let data = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .find({ startDateIso: { $lte: couponStartDate } })
          .toArray();
        // console.log(data);
        if (data) {
          await data.map(async (oneData) => {
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .updateOne(
                { _id: objectId(oneData._id) },
                {
                  $set: {
                    Available: true,
                  },
                }
              )
              .then(() => {
                // resolve();
              });
          });
          resolve()
        } else {
          resolve(0);
        }
      } catch {
        resolve(0);
      }
    });
  },

  //checking user is blocked or unblocked
  isblocked: (id) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(user);
    });
  },

  forgotPassword: (userEmail) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userEmail.email });

      if (user) {
        if (user.isblocked) {
          resolve({ blocked: true });
        } else {
          resolve(user);
        }
      } else {
        resolve({ noUser: true });
      }
    });
  },

  changePassword: (userData) => {
    return new Promise(async (resolve, reject) => {
      if (userData.password === userData.cpassword) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .findOne({ email: userData.email });

        userData.password = await bcrypt.hash(userData.cpassword, 10);
        userData.cpassword = await bcrypt.hash(userData.cpassword, 10);
        // console.log("o7898765");
        // console.log(userData);
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { email: userData.email },
            {
              $set: {
                password: userData.password,
                cpassword: userData.cpassword,
              },
            }
          )
          .then((responce) => {
            resolve({ status: true });
          });
      } else {
        resolve({ status: false });
      }
    });
  },

  reduceWallet: (userId, totalAmount) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      let newWallet = parseInt(user.wallet - totalAmount);
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              wallet: newWallet,
            },
          }
        );
      resolve();
    });
  },

  getWalletAmount: (id) => {
    return new Promise(async (resolve, reject) => {
      let wallet = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(wallet.wallet);
    });
  },
  reduceWallet: (id, total) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(id) });
      let amount = user.wallet - total;
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              wallet: parseInt(amount),
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  getWalletHistory: (id) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(id) });
      // console.log(user.wallet);
      resolve(user.wallet);
    });
  },
 
  //return the ordered Product
  returnOrder: (id) => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(id) });
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(order.userId) },
          {
            $inc: {
              wallet: order.totalAmount,
            },
          }
        )
        .then(() => {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(id) },
              {
                $set: {
                  is_returned: true,
                  status: "returned",
                  returnedDate: new Date(),
                },
              }
            );
        });
      resolve();
    });
  },

  // invoice
  getUserInvoice: (orderId) => {
    return new Promise(async (resolve, reject) => {
      // console.log(orderId);
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: objectId(orderId) }, { sort: { date: -1 } })
        .toArray();
      var i;
      for (i = 0; i < orders.length; i++) {
        orders[i].date = moment(orders[i].date).format("lll");
      }
      var k;
      for (k = 0; k < orders.length; k++) {
        orders[k].deliverdDate = moment(orders[k].deliverdDate).format("lll");
      }
      resolve(orders);
    });
  },



 
};
