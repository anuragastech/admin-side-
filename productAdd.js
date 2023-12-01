const mongoose=require('mongoose')


const createSchema = mongoose.Schema({
    productname: {
     type: String,
     required: true
   },
   manufacturename: {
     type: String,
     required: true
   },
   brand: {
     type: String,
     required: true
   },
   price: {
    type: String,
    required: true
  },
  discription: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
 
  subcategory: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  });
  
  module.exports = mongoose.model("product", createSchema);
  