const mongoose = require("mongoose");

const categorySchema= mongoose.Schema({

   men:{
    type:String,
    required:true,
   } ,
   women:{
    type:String,
    required:true,
   }
})

module.exports=mongoose.model("category",categorySchema);
