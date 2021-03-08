var express = require('express');
const { response, resource, render } = require('../app');
var router = express.Router();
var userHelper = require('../helpers/user-helper')
var connection = require('../config/connection');
const productHelper = require('../helpers/product-helper');
const listproductshelper = require('../helpers/listProductsHelper');
var ObjectID = require('mongodb').ObjectID
const config = require('../config/twilio')
const client = require('twilio')(config.accountSID, config.authToken)
const isOnline = require('is-online')
const referal = require('voucher-code-generator');
const listProductsHelper = require('../helpers/listProductsHelper');
const verifyLogin = (req, res, next) => {

  if (req.session.userfound) {
    next()
  }
  else {
    res.render('user/login', { loginmsg: true })
  }
}




// home Get
router.get('/', function (req, res, next) {


  productHelper.expireOffer()

  userfound = req.session.userfound
  userHelper.displaypdts().then((data) => {
    userHelper.display2nd().then(async (data2) => {

      if (userfound) {
        let creditCount = await userHelper.getCreditCount(userfound._id)
        let cartcount = await userHelper.getCartCount(req.session.userfound._id)

        res.render('user/home', { userfound, data, cartcount, data2, creditCount })


      }
      else {
      
        res.render('user/index', { data, data2 })
     
      }
    });
  })
})





//to login page

router.get('/login', function (req, res) {
  let userfound = req.session.userfound
  if (userfound) {
    res.redirect('/')
  }
  else {

    res.render('user/login', { logginErr: req.session.logginErr });
    req.session.logginErr = false

  }
});





router.post('/login', (req, res) => {

  let userfound = req.session.userfound
  if (userfound) {
    res.redirect('/')
  }

  else {
    let userdata = req.body
    userHelper.doLogin(userdata).then((response) => {

      if (response.userfound) {
        req.session.userfound = response.userfound
        res.redirect('/')
      }
      else {
        req.session.logginErr = true;
        res.redirect('/login')
      }

    }).catch((response) => {
      req.session.logginErr = true;
      res.redirect('/login')
    })
  }
})










//register or signup new user
router.post('/signup', (req, res) => {

  let referalcodeis = referal.generate({ length: 8, count: 1 })
  let referalcode = referalcodeis[0]



  userHelper.doSignUp(req.body, referalcode).then((data) => {


    console.log("entered to db");
    let usersign = true
    res.render('user/login', { usersign: true })

  })
});


router.get('/signup', (req, res) => {
  res.render('user/signup')
})


//register using Otp


// router.post('/login',(req,res)=>{
//   let userfound=req.body.userfound
//   if(userfound)
//   {

//     res.redirect('/')
//   }
// else
// {
//   userHelper.doLogin(req.body).then((response)=>{

//     if(response.userfound){
//       req.session.userfound=response.userfound
//       console.log("at if");
//       res.json(response)
//     }  
//   }).catch((response)=>{
//     res.json(response)
//   })
// }

// });



//otp login

router.get('/verify-phone-page', (req, res) => {

  req.session.verifyphn = true;

  res.render('user/verify-phone')

  req.session.verifyphn = false
})




router.post('/verify-phone', (req, res) => {

  let phone = req.body
  userHelper.verifyPhonenumber(phone).then((response) => {


    req.session.userfound = response.phnofound

    let userfound = req.session.userfound

    client.verify
      .services(config.serviceID)
      .verifications
      .create({
        to: `+91${req.body.phonenumber}`,
        channel: `sms`

      }).then((data) => {

        if (data) {
          res.render('user/otpLogin')
        }
        else {

          res.send("ivlid")
        }
      }).catch((response) => {

        let no = true
        res.render('user/verify-phone', { no })
      })

  })




  router.post('/verify-otp', (req, res) => {

    let userfound = req.session.userfound
    let phno = req.session.userfound.phonenumber

    console.log("session 2 is ", userfound);

    client.verify
      .services(config.serviceID)
      .verificationChecks
      .create({
        to: `+91${req.session.userfound.phonenumber}`,
        code: req.body.code

      }).then((data) => {
        if (data.valid) {
          res.redirect('/')
        }
        else {
          req.session.otpErr = true;
          res.render('user/otpLogin', { otpErr: req.session.otpErr })
          req.session.otpErr = false;
        }
      }).catch()

  })
  //--^^^finished^^^




  // signup otp


  router.post('/verify-reg-otp', (req, res) => {

    client.verify
      .services(config.serviceID)
      .verificationChecks
      .create({
        to: `+91${req.body.phonenumber}`,
        code: req.body.code
      }).then((data) => {

        if (data.valid) {
          req.body.verified = 1;

          console.log("vified", req.body.verified);
          res.redirect('/signup')
        }
        else {
          res.send('otp error')
        }
      }).catch()

  })

})








//logout
router.get('/logout', (req, res) => {
  req.session.userfound = false
  res.redirect('/')
})






// my cart

router.get('/mycart', async (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    // userHelper.getSubTotal(userfound._id) 
    let products = await userHelper.getCartProducts(userfound._id).catch(() => {
      res.redirect('/')
    })

    if (products[0]) {
      let total = await userHelper.getTotalamount(userfound._id)

      console.log("product is ", total);
      res.render('user/mycart', { products, userfound, total })
    }
    else {
      res.render('user/mycart', { userfound })
    }
  }

  else {
    res.redirect('/')
  }

})






router.get('/add-to-cart/:id', (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {

    userHelper.addToCart(req.params.id, req.session.userfound._id).then(() => {
      res.redirect('/')
    })
  }
  else {
    res.redirect('/login')
  }

})

router.post('/add-to-cart', (req, res) => {
  console.log("ividethi");
  let userfound = req.session.userfound
  if (userfound) {
    userHelper.addToCart(req.body.product, req.session.userfound._id).then((response) => {
      res.send(response)
      console.log("added to cart");

    })

  }

})


// delete from cart

router.post('/delete-one-cart', (req, res) => {

  userHelper.deleteOneCartItem(req.body).then((response) => {
    console.log("@cart del");
    res.json(response)
  })
})




//delete an item at cart

// router.post("/deleteCartProduct", (req, res) => {
//   console.log("inside");
//   userHelper.deleteCartProduct(req.body.cartId,req.body.proId).then((response) => {
//     console.log("cart delete");
//     res.json(response);
//   });
// });


//inc/dec quanity 

router.post('/change-Product-Quantity', (req, res) => {

  userHelper.changeProductQuantity(req.body).then(async (response) => {



    if (response.removeProduct == true) {
      let total = 0
      console.log("product removed");

    }
    else {
      console.log("pfroduct mot removed");
      let total = await userHelper.getTotalamount(userfound._id)
      // response.subtotal=await userHelper.getSubTotal(userfound._id)

      if (total) {
        response.total = total
      }
    }

    res.json(response)



  })
})





router.get('/select-payment', async (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    let address = await userHelper.getaddress(userfound._id)

    if (address) {

      let products = await userHelper.getCartProducts(userfound._id)

      let total = await userHelper.getTotalamount(userfound._id)

      let creditCount = await listProductsHelper.countcredits(userfound._id)
      let credits = creditCount.credits * 10
      if (creditCount.credits) {

        total = total - (userfound.credits * 10)

      }

      res.render('user/selectPayment', { userfound, total, products, address, credits })

    }
    else {
      let products = await userHelper.getCartProducts(userfound._id)

      let total = await userHelper.getTotalamount(userfound._id)

      res.render('user/selectPayment', { userfound, total, products })

    }
  }

  else {
    res.redirect('/')
  }
})

router.get('/add-address', (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    res.render('user/add-address', { userfound })
  }
})

router.post('/add-address', async (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {

    let newAddress = req.body
    let addAddress = await userHelper.addAddress(userfound._id, newAddress)
    res.redirect('/select-payment')
  }
  else {
    res.redirect('/')
  }

})


//place order form
router.post('/place-order', async (req, res) => {


  let userfound = req.session.userfound
  if (userfound) {

    let discount = req.body.offerId
    console.log('PODEYEYEDYEYDYE', discount)
    let products = await userHelper.getCartProductList(userfound._id)
    let totalprice = await userHelper.getTotalamount(req.body.userId)
    console.log("ivide ethi");
    if (discount) {
      totalprice = totalprice * (100 - discount) / 100

    }
    let creditCount = await listProductsHelper.countcredits(userfound._id)
    if (creditCount.credits) {
      totalprice = totalprice - (userfound.credits * 10)
      userHelper.removeCredits(userfound._id)
      console.log("totalil ninn credit minused", totalprice);
    }



    userHelper.placeOrder(req.body, products, totalprice).then((orderId) => {

      req.session.orderId = orderId;
      req.session.total = req.body.total;





      if (req.body.paymentMethod === 'cod') {


        res.json({ cod_success: true })
      }

      else if (req.body.paymentMethod === 'paypal') {

        res.json({ paypal: true, total: totalprice })


      }
      else {
        userHelper.generateRazorPay(orderId, totalprice).then((response) => {

          res.json(response)

        })
      }

    })
  }

})



// router.post("/place-order", async (req, res) => {
//   let products = await userHelpers.getCartProductList(req.body.userId);
//   await user.getTotalAmount(req.session.user._id, products).then((result) => {
//     console.log("req.body.total"), result;
//     req.body.total = result;
//   });
//   userHelpers.placeOrder(req.body, products).then((orderId) => {
//     req.session.orderId = orderId;
//     req.session.total = req.body.total;
//     if (req.body.payment == "cash") {
//       res.json({
//         codSuccess: "COD",
//       });
//     } else if (req.body.payment === "razorpay") {
//       userHelpers.generateRazorpay(orderId, req.body.total).then((response) => {
//         response.codSuccess = "razorpay";
//         res.json(response);
//       });
//     } else if (req.body.payment === "paypal") {
//       response.codSuccess = "paypal";
//       res.json(response);
//     }
//   });
// });












//order placed window

router.get('/order-placed', (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {


    res.render('user/order-placed', { userfound })
  }
  else {
    res.redirect('/')
  }
})

//verify payment
router.post('/verify-payment', (req, res) => {

  console.log("*verifypayment", req.body);

  userHelper.verifyPayment(req.body).then(() => {

    console.log("**");
    console.log("++++++", req.body['order[receipt]']);

    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {

      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})





//view my orders

router.get('/myOrders', async (req, res) => {

  let userfound = req.session.userfound
  if (userfound) {

    let orders = await userHelper.getAllOrders(userfound._id)

    res.render('user/myOrders', { userfound, orders })
  }
  else {
    res.redirect('/')
  }
})

router.get('/view-order-products/:id', verifyLogin, async (req, res) => {

  let products = await userHelper.getorderProducts(req.params.id)

  console.log("looololoo", products);
})


//view single pdt




router.get('/view-all-products', (req, res) => {

  let userfound = req.session.userfound
  productHelper.viewAllProduct().then((products) => {

    let length = products.length
    console.log("legth is ", length);
    let pageNumber = [{ page: 1 }, { page: 2 }, { page: 3 }, { page: 4 }, { page: 5 },{page:6}]



    const page = parseInt(req.query.page)

    const limit = parseInt(req.query.limit)
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    products = products.slice(startIndex, endIndex)

    if (!products[0]) {
      console.log("end");
    }

    if (userfound) {


      res.render('user/allProducts', { products, userfound, pageNumber })


    }
    else {
      res.render('user/allproducts', { products, pageNumber })
    }
  })
})


router.get("/view-profile", (req, res) => {

  let userfound = req.session.userfound
  if (userfound) {
    res.render('user/myprofile', { userfound })
  }
  else {
    res.redirect('/')
  }
})
router.post('/edit-profile', verifyLogin, (req, res) => {

})



router.get('/view-single/:id', (req, res) => {

  let userfound = req.session.userfound

  console.log("id ", req.params.id);
  let proId = req.params.id
  let result = productHelper.showSingleProduct(proId).then((product) => {

    if (userfound) {
      res.render('user/single', { userfound, product })

    }
    else {
      res.render('user/single', { product })
    }
  })
})


router.post('/search-product', (req, res) => {

  let search = req.body.search
  console.log("kk", search);

  userHelper.searchProduct(search)

})


router.post('/verifyCoupon', (req, res) => {


  let coupon = req.body.coupon
  let user = req.body.user
  console.log("dey ith ivid undo", req.body)
  userHelper.verifyCoupon(coupon, user).then((response) => {

    res.json(response)

  })
})

router.get('/myCoupons', verifyLogin, async (req, res) => {

  let coup = await userHelper.getCoupons(userfound._id)

  res.render('user/myCoupons', { userfound, coup })
})


//buynow without CArt

router.get('/buy-now/:id', (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    let product = req.params.id
    userHelper.addToCart(req.params.id, req.session.userfound._id).then(() => {
      res.redirect('/select-payment')
    })
  }
  else {
    res.redirect('/login')
  }
})

router.post('/search', (req, res) => {

  let keyword = req.body.search
  let userfound = req.session.userfound


  listproductshelper.searchProduct(keyword).then((products) => {
    if (userfound) {
      res.render('user/allproducts', { products, userfound })
    }
    else {
      res.render('user/allproducts', { products })
    }
  }).catch(() => {

    if (userfound) {
      res.render('user/allproducts', { noproducts: true, userfound })
    }
    else {
      res.render('user/allproducts', { noproducts: true })
    }
  })
})


router.get('/add-feedback', verifyLogin, (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    res.render('user/add-feedback', { userfound })
  }
  else {
    redirect('/')
  }
})


router.post('/addfeedback', (req, res) => {

  let userfound = req.session.userfound
  if (userfound) {
    userHelper.postFeedback(req.body)
    res.redirect('/')
  }
  else {
    redirect('/')
  }
})


router.get('/viewProducts/:id', (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    userHelper.vieworderProducts(userfound, req.params.id).then((products) => {

      console.log("prod", products);
      res.render('user/viewOrdered', { products })
    })

  }
  else {
    res.redirect('/')
  }
})



//product picking and listing each products////

router.get('/mobiles', verifyLogin, async (req, res) => {
  let keyword = "Smartphones"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})
router.get('/tablets', verifyLogin, async (req, res) => {
  let keyword = "Tablets"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})
router.get('/smarttvs', verifyLogin, async (req, res) => {
  let keyword = "Smart Tvs"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})
router.get('/cameras', verifyLogin, async (req, res) => {
  let keyword = "DSLR Camera"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})
router.get('/speakers', verifyLogin, async (req, res) => {
  let keyword = "Speakers"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})
router.get('/headphones', verifyLogin, async (req, res) => {
  let keyword = "Headphones"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})
router.get('/smartwatches', verifyLogin, async (req, res, next) => {
  let keyword = "Smart Watches"
  let products = await listproductshelper.getMobiles(keyword)
  res.render('user/allProducts', { products, userfound })
})


router.get('/newArrivals', async (req, res) => {
  let userfound = req.session.userfound
  if (userfound) {
    let keyword = "Smart Watches"
    let products = await listproductshelper.getMobiles(keyword)
    res.render('user/allProducts', { products, userfound })
  }
  else {
    res.redirect('/')
  }

})
//ennd




module.exports = router;
