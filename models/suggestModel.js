const mongoose = require('mongoose');

const suggestSchema = new mongoose.Schema({
  userId:String,
  genre:[String]
});

module.exports = mongoose.model('suggests', suggestSchema);