
var db = require('../config/connection')
var collection = require('../config/dbcollections')
var bcrypt = require('bcrypt')
var moment = require('moment')
const { USER_COLLECTION, PRODUCT_COLLECTION, CART_COLLECTION, ORDER_COLLECTION, ADDRESS_COLLECTION, COUPON_COLLECTION } = require('../config/dbcollections')
const { response } = require('../app')
const { ObjectID, ObjectId } = require('mongodb')
const Razorpay = require('razorpay')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_Qr0tA6O1xhCdHy',
    key_secret: 'Mf0VLj5ZCqBtTObi3Zy79LO3'
});

//paypal
const paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AZ7XH5fDsl2eDf7KUUa7zD8gVzCA_9oNtDUMVTD4ZDw2q5sertwpy1uvyibkzFGl9gurk8O1D6-ItJeD',
    'client_secret': 'EPvxYGFTMODpv9jEcN25D19TmQtnycVrqgNjR5CX5CzSCEkf2jZKU22fKy4xQSxMeR4Yd30iyhbHZNqP'
});






module.exports = {

    // signup new user

    doSignUp: (userData, referalcode) => {
        let userReferalCode = userData.referal;
        return new Promise(async (resolve, reject) => {
            if (userReferalCode) {
                db.get().collection(USER_COLLECTION).updateOne({ referalcode: userReferalCode }, {
                    $inc: {
                        credits: 1
                    }
                })
            }



            let Coupon = await db.get().collection(COUPON_COLLECTION).findOne({ status: true })


            userData.Password = await bcrypt.hash(userData.Password, 10);
            userData.status = 0;
            console.log('hash', userData);
            db.get().collection(collection.USER_COLLECTION).insertOne({

                first_name: userData.first_name,
                email: userData.email,
                phonenumber: userData.phone_number,
                Password: userData.Password,
                status: 0,
                referalcode: referalcode,
                coupon: Coupon



            }).then((data) => {

                resolve(data.ops[0])


            })
        })
    },

    //user login 
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}

            let userfound = await db.get().collection(USER_COLLECTION).findOne({ email: userData.email })

            if (userfound && userfound.status == 0) {


                bcrypt.compare(userData.Password, userfound.Password).then((status) => {

                    if (status) {
                        response.status = true
                        response.userfound = userfound
                        resolve(response)

                        console.log("login successfully");

                    }

                    else {
                        response.status = false;
                        reject(response)
                        console.log("login failed");

                    }

                })
            }

            else {
                response.status = false
                reject(response)
                console.log("login failed22");

            }

        })


    },







    //login verify phone

    verifyPhonenumber: (data) => {

        let response = {}
        return new Promise(async (resolve, reject) => {


            let phnofound = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: data.phonenumber })
            console.log(phnofound);

            //   if(phnofound.status==0)
            //   { 

            response.phnofound = phnofound
            response.status = true

            resolve(response)
            console.log("user session found inside helper", phnofound)

            //   }
            // else
            // {
            //   reject(response)
            // }
        })


    },





    display2nd: () => {
        return new Promise(async (resolve, reject) => {
            let showsaudio = db.get().collection(PRODUCT_COLLECTION).find({ product_type: 'Trending1' }).toArray()
            if (showsaudio) {
                resolve(showsaudio)
            }
            else {
                reject()
            }
        })
    },


    displaypdts: () => {

        return new Promise(async (resolve, reject) => {
            let showpdt = db.get().collection(PRODUCT_COLLECTION).find({ data: 1 }).toArray()

            if (showpdt) {
                resolve(showpdt)

            }
            else {
                reject({ err: "errrr" })
            }
        })
    },



    addToCart: (proId, userId) => {
        let proObj = {
            item: ObjectID(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(CART_COLLECTION).findOne({ user: ObjectID(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectID(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }

                            }).then(() => {
                                resolve()
                            })
                }
                else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId) },
                        {
                            $push: { products: proObj }

                        }

                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {


                let cartObj = {
                    user: ObjectID(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })

    },


    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let usercart = await db.get().collection(CART_COLLECTION).findOne({ user: ObjectID(userId) })

            if (usercart) {
                let cartItems = await db.get().collection(CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectID(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'

                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },
                            // totalamount:{$multiply:[{$arrayElemAt:["product.price",0]},"$quantity"]}
                        }
                    }

                ]).toArray()
                resolve(cartItems)
            }
            else {
                console.log("cart illeda");
                reject()
            }

        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })


    },

    //og

    deleteOneCartItem: function (details) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectID(details.cart) },
                {
                    $pull: { products: { item: ObjectID(details.product) } }
                }).then((response) => {
                    resolve(true)
                })
        })
    },






    deleteCartProduct: (cartId, prodId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(CART_COLLECTION)
                .updateOne(
                    { _id: objectId(cartId) },
                    {
                        $pull: { products: { item: ObjectID(prodId) } },
                    }
                )
                .then((response) => {
                    resolve({ removeProduct: true });
                });
        });
    },


    changeProductQuantity: (details) => {
        let response = {}
        details.quantity = parseInt(details.quantity)
        details.count = parseInt(details.count)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(CART_COLLECTION).updateOne({ _id: ObjectID(details.cart) },
                    {
                        $pull: { products: { item: ObjectID(details.product) } }

                    }
                ).then((response) => {

                    resolve({ removeProduct: true })
                })
            }

            else {

                db.get().collection(CART_COLLECTION)
                    .updateOne({ _id: ObjectID(details.cart), 'products.item': ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }

                        }).then((response) => {

                            resolve(response)

                        })
            }
        })

    },
    getSubTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: ObjectID(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }

                    }

                },
                {
                    $project: {
                        unitPrice: { $toInt: '$product.price' },
                        quantity: { $toInt: '$quantity' }
                    }
                },
                {
                    $project: {
                        _id: null,
                        subtotal: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
                    }
                }

            ]).toArray()
            console.log(subtotal);
            console.log("hereddd" + subtotal[0].subtotal);
            resolve(subtotal[0].subtotal)

        })
    },



    deleteCartProduct: (cartId, prodId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(CART_COLLECTION)
                .updateOne(
                    { _id: ObjectID(cartId) },
                    {
                        $pull: { products: { item: ObjectID(prodId) } },
                    }
                )
                .then((response) => {
                    resolve({ removeProduct: true });
                });
        });
    },

    deleteOneCartItem: function (details) {
        return new Promise((resolve, reject) => {
            console.log("details are@@", details);
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectID(details.cart) },
                {
                    $pull: { products: { item: ObjectID(details.product) } }
                }).then((response) => {
                    resolve(true)
                })
        })
    },

    //

    getTotalamount: (userId) => {

        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },

                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },

                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                    }
                }

            ]).toArray()
            if (total) {
                resolve(total[0].total)
            }
            else {
                reject(total)
                console.log("rejected");
            }


        })

    },

    //place Order


    getCartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {



            let cart = await db.get().collection(CART_COLLECTION).findOne({ user: ObjectID(userId) })

            resolve(cart.products)
        }).catch(() => {
            reject()
        })
    },



    placeOrder: (order, products, price, userId) => {

        return new Promise(async (resolve, reject) => {

            console.log("price iss:: this", price);



            let status = order.paymentMethod == 'cod' ? 'placed' : 'pending'
            let dateIso = new Date()
            let date = moment(dateIso).format('DD-MM-YYYY')
            let orderObj = {
                deliveryDetails: {
                    address: order.address,
                    pincode: order.zip,
                    phone_number: order.phone_number,
                    date: new Date()
                },
                userId: ObjectID(order.userId),
                user: order.user,
                paymentMethod: order.paymentMethod,
                products: products,
                status: status,
                Date: moment(new Date()).format("MM/DD/YYYY"),
                totalamount: price
            }
            if (status == 'placed') {
                db.get().collection(CART_COLLECTION).removeOne({ user: ObjectID(order.userId) })
            }
            db.get().collection(ORDER_COLLECTION).insertOne(orderObj).then((response) => {


                resolve(response.ops[0]._id)
            })

        })
    },




    getAllOrders: (userId) => {

        return new Promise(async (resolve, reject) => {

            let orders = await db.get().collection(ORDER_COLLECTION).find({ userId: ObjectID(userId) }).toArray()

            resolve(orders)

        })
    },


    getorderProducts: (orderId) => {

        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(ORDER_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },

                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] },

                    }
                }

            ]).toArray()
            resolve(orderItems)

        })
    },


    generateRazorPay: (orderId, total) => {
        return new Promise((resolve, reject) => {

            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {

                if (err) {
                    console.log(err);
                }
                else {
                    console.log("new order", order);
                    resolve(order)
                }
            });

        })

    },


    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {

            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'Mf0VLj5ZCqBtTObi3Zy79LO3');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {


                resolve()
            }
            else {
                reject()
            }
        })

    },

    //paypal
    generatePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {

            const create_payment_json = {

                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": ""
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "name",
                            "sku": "sku",
                            "price": total,
                            "currency": "INR",

                        }]

                    },
                    "amount": {
                        "currency": "INR",
                        "total": total
                    },

                }]

            };


            paypal.payment.create(create_payment_json, function (error, payment) {


                if (error) {
                    throw error;
                }
                else {
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === 'approval_url') {
                            res.redirect(payment.links[i].href);
                        }
                    }
                }
            })

        })



    },

    getaddress: (userId) => {
        return new Promise((resolve, reject) => {

            let address = db.get().collection(ADDRESS_COLLECTION).find({ userid: userId }).toArray()
            resolve(address)
        })
    },


    addAddress: (userId, address) => {

        return new Promise((resolve, reject) => {

            let newAddress = db.get().collection(ADDRESS_COLLECTION).insertOne({ userid: userId, first_name: address.first_name, last_name: address.last_name, phone_number: address.phone_number, email: address.email, address: address.address, zip: address.zip, state: address.state, })
            resolve(address)
        })
    },



    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(ORDER_COLLECTION).updateOne({ _id: ObjectID(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    searchProduct: (search) => {

        db.get().collection(PRODUCT_COLLECTION).find({ $or: [{ name: search }, { category: search }] })
    },

    // saveaddress:(address)=>{
    //     return new Promise((resolve,reject)=>{
    //         db.get().
    //     })
    // }




    verifyCoupon: (coupon, user) => {

        console.log("hello", user);
        return new Promise(async (resolve, reject) => {

            let response = {}
            let couponfound = await db.get().collection('coupon').findOne({ coupon: coupon })
            if (couponfound) {

                if (couponfound.status) {
                    response.status = 0
                    db.get().collection('coupon').updateOne({ coupon: coupon }, {
                        $set: {

                            status: false
                        }
                    })
                    db.get().collection(USER_COLLECTION).updateOne({ _id: ObjectID(user) }, {
                        $unset: {
                            coupon: 1
                        }
                    })

                    response.offer = parseInt(couponfound.offer)
                    resolve(response)
                }
                else {
                    response.status = 2
                    resolve(response)

                }

            }
            else {
                response.status = 1
                resolve(response)
            }

        })
    },

    getCoupons: (user) => {


        return new Promise(async (resolve, reject) => {

            let res = await db.get().collection(USER_COLLECTION).findOne({ _id: ObjectID(user) })
            resolve(res)
            console.log("DA IT SUCCES AYI", res);
        })

    },



    getCreditCount: (user) => {
        return new Promise(async (resolve, reject) => {


            let credirs = await db.get().collection(USER_COLLECTION).findOne({ _id: ObjectID(user) })
            resolve(credirs)
            console.log("ssss", credirs);
        })
    },
    creditcount: (user) => {
        return new Promise(async (resolve, reject) => {
            console.log("erthiyeddsa");
            let credirs = await db.get().collection(USER_COLLECTION).findOne({ _id: ObjectID(user) }, { credits: 1 })
            resolve(credirs)
            console.log(credirs, "#######");
        })
    },

    removeCredits: (user) => {

        return new Promise(async (resolve, reject) => {
            let remove = db.get().collection(USER_COLLECTION).updateOne({ _id: ObjectID(user) }, {
                $set: {
                    credits: 0
                }
            })
        })
    },

    searchProducts: (keyword) => {
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(PRODUCT_COLLECTION).find({ $or: [{ name: keyword }, { category: keyword }] }).toArray()
            if (result[0]) {
                resolve(result)

            }
            else {
                reject()

            }
        })

    },
    postFeedback: (feedback) => {
        console.log("feeeeeedbck", feedback);
        let date = moment(new Date()).format('DD-MM-YYYY')
        return new Promise((resolve, reject) => {

            db.get().collection('feedback').insertOne({
                userid: feedback.userid, username: feedback.username,
                email: feedback.email, feedback: feedback.feedback, rating: feedback.rating,
                Date: date
            })
        })
    },

    vieworderProducts: (user, orderid) => {
        user = user._id
        return new Promise(async (resolve, reject) => {

            let orderItems = await db.get().collection(ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: ObjectID(user) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quanity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quanity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)



        })
    },




}

