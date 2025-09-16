const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: String,
  password: String,
  address: String,
  phone: String,
  company: String,       
  website: String ,
  favourite:[String],
  reviewed:[String]
});

module.exports = mongoose.model('users', userSchema);
