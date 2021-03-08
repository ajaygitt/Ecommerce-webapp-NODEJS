var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db= require('./config/connection')
var dotenv=require('dotenv')
var dotenv=require('dotenv').config()
const isOnline=require('is-online');
var usersRouter = require('./routes');
var adminRouter = require('./routes/admin');
var hbs=require('express-handlebars')
var session=require('express-session')
var app = express();
var fileUpload=require('express-fileupload')
var publicDir = require('path').join(__dirname,'/public'); 
app.use(express.static(publicDir));
app.use(session({
  secret: 'keyboard cat',
 cookie:{maxAge:5000000}
}))

app.use(function (req, res, next) {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

isOnline().then(online => {
  if(online){
      console.log("We have internet");
  }else{
      console.log("No internet");
  }
});

//db connect
db.connect((err) => {
  if (err) {
    console.log("Error in connection");
  } else {
    console.log("Database connected successdully");
  }
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials'}))
app.use(fileUpload())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.bodyParser());
app.use('/', usersRouter);
app.use('/', adminRouter);

app.use(express.static('public'))
app.use(express.static('public/css'))
app.use(express.static('public/images'))
app.use(express.static('/public/images'))


// 



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
