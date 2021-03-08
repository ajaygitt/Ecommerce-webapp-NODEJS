
var db = require('../config/connection')
var collection = require('../config/dbcollections')
var bcrypt = require('bcrypt')
const { USER_COLLECTION, ADMIN_COLLECTION, ORDER_COLLECTION, COUPON_COLLECTION, PRODUCT_COLLECTION } = require('../config/dbcollections')
const { response } = require('../app')

var ObjectID = require('mongodb').ObjectID
const moment = require('moment')


module.exports = {

   getAllUsers: () => {
      return new Promise(async (resolve, reject) => {
         let usersData = await db.get().collection(USER_COLLECTION).find().toArray()
         if (usersData) {
            resolve(usersData)
         }
         else {
            reject({ err: "error" })
         }
      })

   },

   deleteUser: (usersId) => {

      return new Promise(async (resolve, reject) => {
         db.get().collection(USER_COLLECTION).removeOne({ _id: ObjectID(usersId) }).then((result) => {
            resolve(result)
            console.log("delete userr", result);
         })

      })

   },

   //getting necessory details of user
   getUserById: (userId) => {

      return new Promise(async (resolve, reject) => {
         let user = await db.get().collection(USER_COLLECTION).findOne({ _id: ObjectID(userId) }).then((data) => {
            resolve(data)
         })
      })

   },


   //update current user data



   updateUser: (userId, data) => {
      return new Promise((resolve, reject) => {
         db.get().collection(USER_COLLECTION).updateOne({ _id: ObjectID(userId) },
            {
               $set:
                  { first_name: data.first_name, email: data.email, phonenumber: data.phonenumber }
            }).then((response) => {
               resolve(response)
            })



      })

   },


   createUser: (usersData) => {
      return new Promise(async (resolve, reject) => {
         usersData.Password = bcrypt.hash(usersData.Password, 10);
         console.log(usersData);
         db.get().collection(USER_COLLECTION).insertOne(usersData).then((data) => {
            resolve(data.ops[0])

         })
      })
   },


   //block

   blockUser: (userId) => {

      return new Promise(async (resolve, reject) => {

         await db.get().collection(USER_COLLECTION).updateOne({ _id: ObjectID(userId) }, {
            $set: {
               status: 1
            }
         }).then((data) => {
            resolve(data)

         })
      })
   },


   //unblock
   unblockUser: (userId) => {
      return new Promise((resolve, reject) => {
         db.get().collection(USER_COLLECTION).updateOne({ _id: ObjectID(userId) }, {

            $set: {
               status: 0
            }


         }).then((data) => {
            resolve(data)
         })
      })
   },
   getorders: () => {
      return new Promise(async (resolve, reject) => {
         let orders = await db.get().collection(ORDER_COLLECTION).find().toArray()
         if (orders) {
            resolve(orders)
         }
         else {
            reject(orders)
         }

      })
   },

   getUsers: (userId) => {
      return new Promise(async (resolve, reject) => {
         db.get().collection(ORDER_COLLECTION).aggregate([

            {
               $match: { userId: userId }
            }
         ])
      })
   },
   usercount: () => {
      return new Promise(async (resolve, reject) => {


         let usercount = await db.get().collection(USER_COLLECTION).count()
         if (usercount) {
            resolve(usercount)
         }
         else {
            reject()
         }
      })
   },
   ordercount: () => {
      return new Promise(async (resolve, reject) => {
         let ordercount = await db.get().collection(ORDER_COLLECTION).count()
         if (ordercount) {
            resolve(ordercount)
         }

      })
   },

   approveOrder: (orderId) => {
      return new Promise(async (resolve, reject) => {
         console.log(orderId);
         db.get().collection(ORDER_COLLECTION).updateOne({ _id: ObjectID(orderId) }, {
            $set: {
               status: 'shipped'
            }
         }).then((data) => {
            resolve(data)
         })

      })

   },

   rejectOrder: (orderId) => {
      return new Promise(async (resolve, reject) => {
         db.get().collection(ORDER_COLLECTION).updateOne({ _id: ObjectID(orderId) }, {
            $set: {
               status: 'rejected'
            }
         }).then((data) => {
            resolve(data)
         })
      })
   },

   deleteorder: (orderId) => {
      return new Promise(async (resolve, reject) => {
         db.get().collection(ORDER_COLLECTION).removeOne({
            _id: ObjectID(orderId)
         }).then((result) => {
            resolve(result)
         })
      })
   },



   createCoupons: (offer, coupon) => {
      return new Promise(async (resolve, reject) => {
         db.get().collection(COUPON_COLLECTION).insertOne({ offer: offer, coupon: coupon, status: true }).then((result) => {
            resolve(result)
         })


      })
   },

   getcoupon: () => {
      return new Promise(async (resolve, reject) => {

         db.get().collection(COUPON_COLLECTION).find().toArray().then((result) => {
            resolve(result)
         })
      })
   },
   deactivateCoupon: (couponId) => {
      return new Promise(async (resolve, reject) => {
         db.get().collection(COUPON_COLLECTION).removeOne({ _id: ObjectID(couponId) }).then((result) => {
            resolve(result)
         })
      })
   },

   getOrderReport: () => {

      return new Promise((resolve, reject) => {

         let orders = db.get().collection(ORDER_COLLECTION).find().toArray().then((result) => {

            resolve(result)
         })

      })


   },








   getOrderByDate: (req) => {

      return new Promise(async (resolve, reject) => {

         let from = req.fromDate
         let to = req.toDate
         let dfrom = moment(from).format("MM/DD/YYYY");
         let dto = moment(to).format("MM/DD/YYYY");
       



         let salesReport = await db.get().collection(ORDER_COLLECTION).aggregate([
            {
               $match: {
                  Date: {
                     $gte: dfrom,
                     $lte: dto
                  }
               }
            },
            {
               $project: {
                  totalamount: 1,
                  paymentMethod: 1,
                  status: 1,
                  Date: 1,
                  _id: 1

               }
            }
         ]).toArray()
         resolve(salesReport)

      })

   },
   completed_orders: () => {

      return new Promise(async (resolve, reject) => {

         let i = await db.get().collection(ORDER_COLLECTION).find({ status: "shipped" }).count()
         resolve(i)

      })
   },
   totalProducts: () => {
      return new Promise(async (resolve, reject) => {
         let totalpdt = await db.get().collection(PRODUCT_COLLECTION).find().count()
         resolve(totalpdt)
      })
   },


   totalRevenue: () => {

      return new Promise(async (resolve, reject) => {

         let y = await db.get().collection(ORDER_COLLECTION).aggregate([{
            $group: {
               _id: null,
               totalamount: {
                  $sum: "$totalamount"
               }
            }
         }]).toArray()

         resolve(y)

      })
   },

   getfeedbacks: (key1, key2) => {
      return new Promise((resolve, reject) => {
         let result = db.get().collection('feedback').find({ $or: [{ rating: key1 }, { rating: key2 }] }).count()

         if (result) {
            resolve(result)
         }
         else {
            reject()
         }
      })
   },
   cancelled_orders: () => {

      return new Promise(async (resolve, reject) => {
         let cancelled = await db.get().collection(ORDER_COLLECTION).countDocuments({ status: "rejected" })
         if (cancelled) {
            resolve(cancelled)
         }
      })
   },
   // thismonthSales:()=>{
   //    return new Promise(async(resolve,reject)=>{
   //       let thismonthSales=await db.get().collection(ORDER_COLLECTION).find({Date:})
   //    })
   // }
   viewFeedbacks: () => {
      return new Promise((resolve, reject) => {
         db.get().collection('feedback').find().toArray().then((result) => {
            resolve(result)
         })
      })
   }

}


