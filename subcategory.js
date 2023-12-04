
const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    
        tshirt: {
          type: String,
          required: true,
          unique: true,
        },
        pants: {
          type: String,
          required: true,
          unique: true,
        },
        trousers: {
          type: String,
          required: true,
          unique: true,
        },
        mensCasuals: {
          type: String,
          required: true,
          unique: true,
        },
        nightDresses: {
          type: String,
          required: true,
          unique: true,
        },
        saree: {
          type: String,
          required: true,
          unique: true,
        },
        tShirtsForGirls: {
          type: String,
          required: true,
          unique: true,
        },
        kurthaSets: {
          type: String,
          required: true,
          unique: true,
        },
        jeansForHer: {
          type: String,
          required: true,
          unique: true,
        },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true,
  },
});

const subcategory = mongoose.model('subcategory', subcategorySchema);

module.exports = subcategory;
