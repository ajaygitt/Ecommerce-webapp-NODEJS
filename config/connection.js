const mongoClient = require('mongodb').MongoClient
var dotenv=require('dotenv').config()
const state = {
    db:null 
}

module.exports.connect = function(done){
    const url = 'mongodb://localhost:27017'
    const dbname = 'Ecart_Gadget_hub'
   
    mongoClient.connect(process.env.MONGO_CONNECTION_URL,(err,data)=>{
        
        if(err) return done(err)
        state.db=data.db(dbname) 
        done()
    })
}
module.exports.get=function(){
    return state.db
}