
var db = require('../config/connection')
var collection = require('../config/dbcollections')
var bcrypt = require('bcrypt')
const { USER_COLLECTION, ADMIN_COLLECTION, ORDER_COLLECTION, COUPON_COLLECTION, PRODUCT_COLLECTION } = require('../config/dbcollections')
const { response } = require('../app')

var ObjectID = require('mongodb').ObjectID
const moment = require('moment')


module.exports = {


    getMobiles: (keyword) => {
        return new Promise(async (resolve, reject) => {
            let mobiles = await db.get().collection(PRODUCT_COLLECTION).find({ category: keyword }).toArray()
            resolve(mobiles)

        })
    },

    ordersGraph: () => {

        return new Promise(async (resolve, reject) => {

            let graphData = await db.get().collection(ORDER_COLLECTION).aggregate([{
                $match: {
                    status: "shipped"
                }
            },
            {
                $project: {
                    Date: 1,
                    _id: 0,
                    totalamount: 1
                }
            },
            {
                $group: {
                    _id: { month: "$Date" },
                    count: { $sum: 1 },
                    total: { $sum: "$totalamount" }
                }
            },
            {
                $project: {
                    _id: 1,
                    total: 1
                }
            }
            ]).toArray()

            var response = {
                date: [],
                total: []
            }
            for (i = 0; i < graphData.length; i++) {
                response.date[i] = graphData[i]._id.month
                response.total[i] = graphData[i].total
            }
            resolve(response)
            console.log("ReS IS", response);

        })
    },

    countcredits: (user) => {
        return new Promise(async (resolve, reject) => {
            let countcr = await db.get().collection(USER_COLLECTION).findOne({ _id: ObjectID(user) }, { credits: 1 })
            if (countcr) {
                resolve(countcr)
                console.log("##", countcr);
            }
        })
    },
    searchProduct: (keyword) => {

        return new Promise((resolve, reject) => {
            let result = db.get().collection(PRODUCT_COLLECTION).find({ name: { $regex: keyword, $options: '$i' } }).toArray()
            if (result[0]) {

                resolve(result)
                console.log("from11");
            }
            else {
                result = db.get().collection(PRODUCT_COLLECTION).find({ category: { $regex: keyword, $options: '$i' } }).toArray().then((result) => {

                    if (result[0]) {
                        resolve(result)
                        console.log("frim222");
                    }
                    else {
                        result = db.get().collection(PRODUCT_COLLECTION).find({ manufacturer: { $regex: keyword, $options: '$i' } }).toArray().then((result) => {
                            if (result[0]) {
                                resolve(result)
                                console.log("frm 33");
                            }
                            else {
                                result = db.get().collection(PRODUCT_COLLECTION).find({ description: { $regex: keyword, $options: "$i" } }).toArray().then((result) => {

                                    if (result[0]) {
                                        resolve(result)
                                        console.log("frm 3");
                                    }
                                    else {
                                        reject(result);
                                        console.log("rjct");
                                    }
                                })

                            }
                        })
                    }
                })
            }


        })
    }








}