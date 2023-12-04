const mongoose=require('mongoose')
// const category=require('./category')

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
  Category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
 

  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true,

  },
  });
  
  module.exports = mongoose.model("product", createSchema);
  