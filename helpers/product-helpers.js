var db = require('../config/connection')
var collection = require('../config/collections')
const { PRODUCT_COLLECTION } = require('../config/collections')
var objectId = require('mongodb').ObjectId

module.exports = {


  addProduct: async (product, callback) => {
    product.Disable = parseInt(product.Disable)
    product.Amount = parseInt(product.Amount)
    let pro = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ name: product.name })
    if (pro) {
      callback({ status: true })
    } else {
      db.get().collection(collection.PRODUCT_COLLECTION).insertOne({

        name: product.name,
        category: product.category,
        Amount: product.Amount,
        Stock: product.Stock,
        Description: product.Description,
        Disable: false


      }).then((responce) => {
        console.log(responce)
        callback(responce.insertedId)


      })

    }


  },

  activeDisable: () => {

  },



  getAllProductsUser: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Disable: false }).toArray()
      resolve(products)
    })

  },

  getAllProductsHome: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Disable: false }).sort({ _id: -1 }).limit(8).toArray()
      resolve(products)
    })

  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(10).toArray()
      resolve(products)
    })
  },

  getAllProducts2: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().skip(10).limit(10).toArray()
      resolve(products)
    })
  },

  getAllProducts3: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().skip(20).limit(10).toArray()
      resolve(products)
    })
  },


    

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
        $set: {
          Disable: true
        }

      }
      ).then((responce) => {
        resolve(responce)

      })

    })
  },

  activeProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
        $set: {
          Disable: false
        }

      }
      ).then((responce) => {
        resolve(responce)

      })

    })
  },

  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
        resolve(product)
      })

    })
  },

  updateProduct: (proId, proDetails) => {
    proDetails.price = parseInt(proDetails.price)
    console.log(proDetails)
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
        $set: {
          name: proDetails.name,
          Description: proDetails.description,
          Amount: proDetails.price,
          category: proDetails.category,
          Stock: proDetails.stock
        }
      }).then((responce) => {
        resolve(true)
      })
    })

  },
  getOneProduct: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((products) => {
          resolve(products)
      })
    })

  },

  searchProduct: (pname) => {
    return new Promise(async (resolve, reject) => {
      let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ name: { $regex: pname } }).toArray();
      resolve(product)
    })
  },
  startProductOffer: (date) => {
    let proStartDateIso = new Date(date);
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.PRODUCT_OFFERS)
        .find({ startDateIso: { $lte: proStartDateIso } })
        .toArray();
      if (data.length > 0) {
        await data.map(async (onedata) => {
          let product = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .findOne({ offer: { $exists: false }, name: onedata.product });
          if (product) {
            let actualPrice = parseInt(product.Amount);
            let newPrice = (actualPrice * onedata.proOfferPercentage) / 100;
            newPrice = newPrice.toFixed();
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                { _id: objectId(product._id) },
                {
                  $set: {
                    actualPrice: actualPrice,
                    Amount: actualPrice - newPrice,
                    offer: true,
                    proOfferPercentage: onedata.proOfferPercentage,
                  },
                }
              );
            resolve();
            console.log("get");
          } else {
            resolve();
            console.log("rejected");
          }
        });
      }
      resolve();
    });
  },

  startCategoryOffer: (date) => {
    let startDateIso = new Date(date);
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection(collection.CATEGORY_OFFERS)
        .find({ startDateIso: { $lte: startDateIso } })
        .toArray();
      if (data.length > 0) {
        await data.map(async (onedata) => {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTION)
            .find({ category: onedata.category, offer: { $exists: false } })
            .toArray();
          if (products) {
            await products.map((product) => {
              let actualPrice = product.Amount;
              let newPrice = (actualPrice * onedata.catOfferPercentage) / 100;
              newPrice = newPrice.toFixed();
              db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .updateOne(
                  { _id: objectId(product._id) },
                  {
                    $set: {
                      actualPrice: actualPrice,
                      Amount: actualPrice - newPrice,
                      offer: true,
                      catOfferPercentage: onedata.catOfferPercentage,
                    },
                  }
                );
            });
          }
        });
        resolve();
      } else {
        resolve();
      }
    });
  },




}




