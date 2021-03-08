var db = require('../config/connection')
var collection = require('../config/dbcollections')
var bcrypt = require('bcrypt')
const { USER_COLLECTION, ADMIN_COLLECTION, PRODUCT_COLLECTION, CATEGORY_COLLECTION, MANUFACTURERS_COLLECTION } = require('../config/dbcollections')
const { response } = require('../app')


var ObjectID = require('mongodb').ObjectID
const { NumberInstance } = require('twilio/lib/rest/pricing/v1/voice/number')
const { each } = require('jquery')
// const { ObjectId } = require('mongodb')
const moment = require('moment')



module.exports = {


    addproduct: (product, callback) => {
        console.log('this is from pdt helper', product);

        let price = parseInt(product.price)
        let stock = parseInt(product.stock)

        console.log("they are", price, stock);
        db.get().collection(PRODUCT_COLLECTION).insertOne({
            name: product.name,
            product_varient: product.product_varient,
            manufacturer: product.manufacturer,
            price: price,
            category: product.category,
            description: product.description,
            product_type: product.product_type,
            stock: stock
        }).then((data) => {
            console.log("this is data from product helper");
            callback(data.ops[0]._id)
        })

    },

    getproduct: () => {
        return new Promise(async (resolve, reject) => {

            let productData = await db.get().collection(PRODUCT_COLLECTION).find().toArray()
            if (productData) {
                resolve(productData)
            }
            else {
                reject("error in loading pdt data")
            }
        })

    },


    //edit product

    getproductbyId: (productId) => {

        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(PRODUCT_COLLECTION).findOne({ _id: ObjectID(productId) }).then((data) => {

                resolve(data)
            })
        })




    },


    ///update pdt 

    updateproduct: (ProId, data) => {
        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectID(ProId) },

                {
                    $set:
                    {
                        name: data.name, maker: data.maker,
                        price: data.price,
                        category: data.category,
                        description: data.description,
                        product_type: data.product_type,
                        make_date: data.make_data,
                        stock: data.stock
                    }
                }).then((response) => {

                    resolve(response)

                })

        })
    },

    //getproductDetail






    //deleteproduct


    deleteProduct: (productId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(PRODUCT_COLLECTION).removeOne({ _id: ObjectID(productId) }).then((result) => {
                resolve(result)
                console.log(productId);
            })
        })
    },




    addmanufacturer: (manufacturer) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.MANUFACTURERS_COLLECTION).insertOne(manufacturer).then((data) => {

                resolve(data)
            })
        })
    },

    addCategory: (category) => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(CATEGORY_COLLECTION).insertOne(category).then((data) => {

                resolve(data)


            })
        })
    },

    getAllCategory: (categoryId) => {
        return new Promise(async (resolve, reject) => {

            let category = await db.get().collection(CATEGORY_COLLECTION).find().toArray()

            if (category) {
                resolve(category)
            }
            else {
                reject()
            }
        })
    },


    getmanufacturer: () => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(MANUFACTURERS_COLLECTION).find().toArray().then((manufacturer) => {
                resolve(manufacturer)
            })
        })
    },
    //getcategory


    getCategoryById: (categoryId) => {

        return new Promise(async (resolve, reject) => {


            await db.get().collection(CATEGORY_COLLECTION).findOne({ _id: ObjectID(categoryId) }).then((data) => {

                resolve(data)
            })
        })
    },

    //category update

    updateCategory: (categoryId, data) => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(CATEGORY_COLLECTION).updateOne({ _id: ObjectID(categoryId) },
                {
                    $set: {
                        category: data.category

                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    deleteCategory: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(CATEGORY_COLLECTION).removeOne({ _id: ObjectID(categoryId) }).then((response) => {
                resolve(response)
            })
        })
    },



    viewAllProduct: () => {
        return new Promise((resolve, reject) => {
            let products = db.get().collection(PRODUCT_COLLECTION).find().toArray()
            if (products) {

                resolve(products)
            }
            else {
                reject(products)
            }
        })

    },

    showSingleProduct: (proId) => {

        return new Promise(async (resolve, reject) => {


            console.log(proId);
            let product = await db.get().collection(PRODUCT_COLLECTION).findOne({ _id: ObjectID(proId) }).then((data) => {

                resolve(data)
            })

        })


    },

    getstock: () => {

        return new Promise(async (resolve, reject) => {
            let pdt = db.get().collection(PRODUCT_COLLECTION).find({ stock: { $lt: 1 } }).toArray()
            if (pdt) {
                resolve(pdt)
            }

        })

    },


    addOfferToProduct: (proId, data) => {
        let discount = data.discount
        return new Promise((resolve, reject) => {


            db.get().collection(PRODUCT_COLLECTION).findOne({ _id: ObjectID(proId) }).then((product) => {


                let price = product.price
                let oldPrice = product.price
                let disc = 100 - discount
                new_amount = (disc * price) / 100;


                db.get().collection(PRODUCT_COLLECTION).updateOne({ _id: ObjectID(proId) }, {
                    $set: {
                        discount: data.discount,
                        oldPrice: oldPrice,
                        price: new_amount,
                        valid_from: data.valid_from,
                        valid_to: data.valid_to
                    }
                }).then((data) => {
                    resolve(data)
                })
            })
        })
    },

    viewOffers: () => {
        return new Promise((resolve, reject) => {


            db.get().collection(PRODUCT_COLLECTION).find({ discount: { $exists: true } }).toArray().then((products) => {

                resolve(products)
            })
        })
    },

    addOfferToCategory: (category, data) => {
        return new Promise(async (resolve, reject) => {
            console.log("@@@@@@@@@", data);
            console.log("@@@@@@@@@", category);
            let products = await db.get().collection(PRODUCT_COLLECTION).find({ category: category }).toArray()

            console.log("$$$$$$$$$$$$$$$$$", products);
            let length = products.length
            console.log("lengthhthth", length);

            for (i = 0; i < length; i++) {
                let offer = data.discount

                let discounted_rate = products[i].price - (products[i].price * offer) / 100

                let updated = db.get().collection(PRODUCT_COLLECTION).updateOne({ _id: ObjectID(products[i]._id) }, {
                    $set: {
                        discount: offer,
                        oldPrice: products[i].price,
                        price: discounted_rate,
                        valid_from: data.valid_from,
                        valid_to: data.valid_to
                    }
                })


            }

            resolve()
        })
    },


    deleteOffer: (prodId) => {

        return new Promise(async (resolve, reject) => {

            let product = await db.get().collection(PRODUCT_COLLECTION).findOne({ _id: ObjectID(prodId) })
            let price = product.oldPrice

            db.get().collection(PRODUCT_COLLECTION).updateOne({ _id: ObjectID(prodId) }, {
                $set: {
                    price: price
                }
            })


            db.get().collection(PRODUCT_COLLECTION).updateOne({ _id: ObjectID(prodId) }, {
                $unset: {
                    discount: 1,
                    oldPrice: 1,
                    valid_from: 1,
                    valid_to: 1
                }
            })
            resolve()



        })

    },


    expireOffer: () => {
        return new Promise(async (resolve, reject) => {

            let allProducts = await db.get().collection(PRODUCT_COLLECTION).find().toArray()




            let length = allProducts.length

            for (let i = 0; i < length; i++) {
                if (allProducts[i].discount) {

                    let current_date = moment(new Date()).format("MM/DD/YYYY");

                    current_date = Date.parse(current_date)
                    let valid_date = Date.parse(allProducts[i].valid_to)

                    console.log("KAREDN<<<OLd", current_date, valid_date);
                    if (current_date > valid_date) {

                        console.log("ith suucess aaayi");
                        db.get().collection(PRODUCT_COLLECTION).updateOne({ _id: ObjectID(allProducts[i]._id) }, {
                            $set: {
                                price: allProducts[i].oldPrice
                            },
                            $unset: {
                                discount: 1,
                                oldPrice: 1,
                                valid_from: 1,
                                valid_to: 1
                            }
                        })
                    }
                }
            }

        })
    }


}