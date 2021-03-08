const { response } = require('express');
var express = require('express');
const adminHelper = require('../helpers/admin-helper');
const productHelper = require('../helpers/product-helper');
const productManagement = require('../helpers/product-helper');
const userHelper = require('../helpers/user-helper');
var router = express.Router();
let viewCount = 0;
const jimp = require('jimp');
const { ORDER_COLLECTION } = require('../config/dbcollections');
const { render } = require('../app');
const voucher_codes = require('voucher-code-generator');
const listProductsHelper = require('../helpers/listProductsHelper');
var base64 = require('file-base64');
var base64ToFile = require('base64-to-file');
var base64 = require('base-64');
var base64ToImage = require('base64-to-image');

/* GET Admin page*/

const verifyLogin = (req, res, next) => {

  if (req.session.admin) {
    next()
  }
  else {
    res.redirect('/admin')
  }
}


router.get('/admin', async function (req, res, next) {

  let sess = req.session.admin
  if (sess) {
    // let cancelled_orders=await adminHelper.cancelled_orders()
    let Revenue = await adminHelper.totalRevenue()
    let monthsales = await listProductsHelper.ordersGraph()
    let completed_orders = await adminHelper.completed_orders()
    let totalProducts = await adminHelper.totalProducts()
    let ordercount = await adminHelper.ordercount()

    let usercount = await adminHelper.usercount()
    console.log("hm");
    console.log(monthsales, "DDD");
    res.render('admin/home', { admin: true, monthsales, Revenue, totalProducts, ordercount, usercount, completed_orders })
  }
  else {
    res.render('admin/login', { admin: true, navbar: true })
  }
});



//admin login to the adminHome

router.post('/adhome', async (req, res) => {
  let email = req.body.username
  let password = req.body.Password

  let admin = { email: "admin@ecart", Password: "123" }

  let response = {}
  if (email == admin.email && password == admin.Password) {

    let usercount = await adminHelper.usercount()

    req.session.admin = req.body.username
    req.session.admin = req.body.Password;

    res.send({ status: true })
    // res.redirect('/admin')
    // res.render('admin/home',{admin:true,usercount}) 

  }
  else {
    res.send({ status: false })


  }

});







router.get('/adhome', (req, res) => {
  let sess = req.session.admin
  if (sess) {

    res.render('admin/home', { email: sess, admin: true, data })

  }
  else {
    res.redirect('/admin')
  }
})

// logout

router.get('/adminlogout', (req, res) => {

  req.session.admin = false
  res.redirect('/admin')
})




// admin view user

router.get("/manage-users", (req, res) => {
  let sess = req.session.admin
  if (sess) {

    adminHelper.getAllUsers().then((data) => {

      console.log(data);
      res.render('admin/view-users', { admin: true, data })
    }).catch("error getting in data errr")
  }
  else {
    res.redirect('/admin')
  }
})



///get user edit page

router.get('/blockUser/:id', async (req, res) => {
  let sess = req.session.admin
  if (sess) {
    console.log("block page");

    //  adminHelper.getUserById(req.params.id).then((user)=>{


    //   res.render('admin/edituser',{admin:true,user})


    // })
  }
  else {
    res.redirect('/admin')
  }



})

router.get('/edituser/:id', (req, res) => {
  let sess = req.session.admin;
  if (sess) {
    let result = adminHelper.getUserById(req.params.id).then((user) => {
      console.log('hi');
      console.log('user is:', user);
      res.render('admin/edituser', { admin: true, user })
    })

  }
})



router.post('/updateuser/:id', (req, res) => {

  let sess = req.session.admin
  if (sess) {
    console.log("user updte", req.body);
    adminHelper.updateUser(req.params.id, req.body).then(() => {

      console.log("response");
      res.redirect('/manage-users')

    })
  }
  else {
    res.redirect('/admin')
  }

})



// delete a user by admin

router.get('/deleteuser/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    let userId = req.params.id

    adminHelper.deleteUser(userId).then((result) => {

      res.redirect("/manage-users")
    })
  }
  else {
    res.redirect('/admin')
  }
})

//load create user page
router.get('/createuserpage', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    res.render('admin/create-user', { admin: true })
  }
  else {
    res.redirect('/admin')
  }
})

//create user by admin 
router.post('/createuser', (req, res) => {
  let sess = req.session.admin
  console.log("the admin is", sess);
  if (sess) {
    adminHelper.createUser(req.body).then((data) => {
      res.redirect('/manage-users')
    })
  }
  else {
    res.redirect('/admin')
  }

})


//block a user

router.get('/block-user/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    adminHelper.blockUser(req.params.id).then((data) => {
      console.log("ok to blk usr");
      res.redirect('/manage-users')
    })
  }

})


//unblock user

router.get('/unblock-user/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    adminHelper.unblockUser(req.params.id).then((data) => {

      res.redirect('/manage-users')
    })
  }
  else {
    res.redirect('/')
  }
})


//prouct management begins


//load manageproducts
router.get('/manage-products', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    productManagement.getproduct().then((data) => {

      productHelper.getstock().then((result) => {
        console.log("!!!!", result);

        res.render('admin/product/product-management', { admin: true, data, result })
      })
    })
  }
  else {
    res.redirect('/admin')
  }
})
//load create product page

router.get('/addmanufacturer', (req, res) => {

  res.render('admin/product/addmanufacturer', { admin: true })
})


router.post('/addmanufacturer', (req, res) => {                     //sessn test
  let admin = req.session.admin
  if (admin) {

    productHelper.addmanufacturer(req.body).then(() => {

      res.redirect('/category-management')

    })
  }
  else {
    res.redirect('/admin')
  }
})


router.get('/addproduct', (req, res) => {
  let sess = req.session.admin
  if (sess) {


    productHelper.getmanufacturer().then((manufacturer) => {
      productHelper.getAllCategory().then((category) => {

        res.render('admin/product/add-products', { admin: true, category, manufacturer })
      })
    })
  }

  else {
    res.redirect('/admin')
  }
})





//subit product data

router.post('/create-product', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    productHelper.addproduct(req.body, (id) => {
      console.log("in the data",id);


      res.render('admin/product/crop',{admin:true,id})
    

      // let image = req.files.img1
      // console.log("img1 ", image);
      // image.mv('./public/images/product-image/' + id + '.jpg', (err, done) => {

      //   if (!err) {
      //     res.render('admin/product/crop')
      //   }
      //   else if (err) {
      //     res.send('failed')
      //     console.log(err);
      //   }
      // })
    })
  }
  else {
    res.redirect("/admin")
  }
})


router.post('/upload-pic',verifyLogin, (req, res) => {

  let imgs = req.body.image;
let id=req.body.id

console.log("@@@",id);



var base64Str = imgs;
var path ='./public/images/product-image/';
var optionalObj = {'fileName': id, 'type':'jpg'};

    base64ToImage(base64Str,path,optionalObj); 


res.send(response)


  console.log("ETHIII_________________________________");
  
  console.log("finished",)


})


// edit products

router.get('/edit-product/:id', async (req, res) => {
  let sess = req.session.admin
  if (sess) {
    let result = await productManagement.getproductbyId(req.params.id).then((product) => {

      res.render('admin/product/edit-product', { admin: true, product })
    })
  }
  else {
    res.redirect('/admin')
  }
})


//update product

router.post('/update-product/:id', async (req, res) => {
  let sess = req.session.admin

  if (sess) {
    productHelper.updateproduct(req.params.id, req.body).then(() => {

      res.redirect('/manage-products')
      let image = req.files.Image
      let id = req.params.id
      image.mv('./public/images/product-image/' + id + '.jpg')


    })
  }
  else {
    res.redirect('/admin')
  }
})


router.get('/delete-product/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    productHelper.deleteProduct(req.params.id).then((result) => {
      res.redirect('/manage-products')
    })
  }
})

//get category management page
router.get('/category-management', (req, res) => {


  let sess = req.session.admin
  if (sess) {
    productHelper.getAllCategory().then((category) => {

      console.log(category);
      res.render('admin/product/category-management', { admin: true, category })

    })


  }
})

//add new category

router.get('/addcategory', (req, res) => {
  let sess = req.session.admin
  if (sess) {

    res.render('admin/product/add-category', { admin: true })
  }
})

router.post('/addcategory', (req, res) => {
  let sess = req.session.admin
  if (sess) {

    productHelper.addCategory(req.body).then((data) => {

      res.redirect('/category-management')

    })
  }
  else {
    res.redirect('/admin')
  }
})

//editcategoryid
router.get('/edit-category/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    productHelper.getCategoryById(req.params.id).then((category) => {
      res.render('admin/product/edit-category', { admin: true, category })
    })
  }
  else {
    res.redirect('/admin')
  }
})

//edit-category

router.post('/edit-category/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    productHelper.updateCategory(req.params.id, req.body).then(() => {

      res.redirect('/category-management')
    })
  }

  else {
    res.redirect('/admin')
  }

})

//delete

router.get('/delete-category/:id', (req, res) => {
  let sess = req.session.admin
  if (sess) {
    productHelper.deleteCategory(req.params.id).then(() => {

      res.redirect('/category-management')
    })
  }
  else {
    res.redirect('/admin')
  }

})

router.get('/orders', verifyLogin, (req, res) => {

  let orders = adminHelper.getorders().then(async (orders) => {
    console.log(orders);
    // let userid=orders.userId
    // console.log("hehe",userid); 

    //  let userslist=await adminHelper.getUsers()

    res.render('admin/product/order-management', { admin: true, orders })
  })
})

router.get('/manage-orders', verifyLogin, (req, res) => {
  let orders = adminHelper.getorders().then(async (orders) => {

    res.render('admin/product/order-approval', { admin: true, orders })

  })
})

router.get('/approve-shipping/:id', verifyLogin, (req, res) => {

  adminHelper.approveOrder(req.params.id).then((data) => {

    res.redirect('/manage-orders')
  })

})

router.get('/delete-order/:id', verifyLogin, (req, res) => {
  adminHelper.deleteorder(req.params.id).then((data) => {
    res.redirect('/manage-orders')
  })
})
router.get('/reject-order/:id', verifyLogin, (req, res) => {

  adminHelper.rejectOrder(req.params.id).then((data) => {
    res.redirect('/manage-orders')
  })
})

router.get('/offers', verifyLogin, async (req, res) => {

  productHelper.viewOffers().then((data) => {


    res.render('admin/product/offer', { admin: true, data })

  })
})

router.get('/create-offer', verifyLogin, async (req, res) => {

  productHelper.getproduct().then((products) => {


    res.render('admin/product/add-offer', { admin: true, products })
  })
})


router.post('/create-offer', verifyLogin, (req, res) => {
  console.log(req.body);
  let proId = req.body.product
  productHelper.addOfferToProduct(proId, req.body).then((data) => {
    res.redirect('/offers')
  })


})

router.get('/create-offer-ByCategory', verifyLogin, (req, res) => {

  productHelper.getAllCategory().then((category) => {
    console.log("cats", category);
    res.render('admin/product/add-offer', { admin: true, category })
  })
})

router.post('/create-offer-ByCategory', verifyLogin, (req, res) => {

  let catId = req.body.category
  console.log("evide", catId);
  productHelper.addOfferToCategory(catId, req.body).then((data) => {
    res.redirect('/offers')
  })
})

router.get('/delete-offer', verifyLogin, (req, res) => {

  productHelper.viewOffers().then((data) => {

    res.render('admin/product/delete-offer', { admin: true, data })
  })
})

router.get('/delete-offer/:id', verifyLogin, (req, res) => {

  let proId = req.params.id
  productHelper.deleteOffer(proId).then((data) => {

    res.redirect('/offers')
  })
})

router.get('/coupon', verifyLogin, (req, res) => {

  adminHelper.getcoupon().then((coupons) => {


    res.render('admin/product/coupon', { admin: true, coupons })
  })
})

router.get('/new-coupon', verifyLogin, (req, res) => {

  res.render('admin/product/add-coupon', { admin: true })
})

router.get('/generate-couponCode', verifyLogin, (req, res) => {

  let voucher = voucher_codes.generate({
    length: 8,
    count: 1
  })
  let voucherCode = voucher[0]
  res.send(voucherCode)
})

router.post('/new-coupon', async (req, res) => {

  let coupon = req.body.coupon
  let offer = req.body.offer

  await adminHelper.createCoupons(offer, coupon).then(() => {
    res.redirect('/coupon')
  })

})

router.get('/delete-coupon/:id', async (req, res) => {

  await adminHelper.deactivateCoupon(req.params.id).then(() => {
    console.log("dkd");
    res.redirect('/coupon')
  })

})

router.get('/salesReport', verifyLogin, (req, res) => {


  adminHelper.getOrderReport().then(async (result) => {
    let monthsales = await listProductsHelper.ordersGraph()

    res.render('admin/reports', { admin: true, result, monthsales })
  })
})


router.post('/findReportbyDate', verifyLogin, (req, res) => {

  adminHelper.getOrderByDate(req.body).then((response) => {
    console.log("yeah its wrking", response);
    res.render('admin/viewSalesByDate', { admin: true, response })
  })

})



router.get('/feedbacks', verifyLogin, async (req, res) => {

  let key1 = "5";
  let key2 = "4"
  let positive = await adminHelper.getfeedbacks(key1, key2)
  key1 = "3"
  key2 = "2.5"
  let intermediate = await adminHelper.getfeedbacks(key1, key2)
  key1 = "2"
  key2 = "1"
  let negative = await adminHelper.getfeedbacks(key1, key2)

  res.render('admin/feedback-report', { admin: true, positive, intermediate, negative })
})

router.get('/viewfeedbacks', verifyLogin, (req, res) => {

  adminHelper.viewFeedbacks().then((feedbacks) => {

    console.log("@@", feedbacks);

    res.render('admin/view-feedbacks', { admin: true, feedbacks })
  })
})












module.exports = router;
