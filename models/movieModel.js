const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  image: String,
  featured:Boolean,
  details: String,
  release_date: Date,
  genre: [String],
  rating: { type: Number, default: 0 },
  ratings: { type: [Number], default: [] },  // Array to store ratings
  author: String,
  synopsis: String,
  release_year: String,
  main_cast: [String],
  language:String,
  runtime: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  upcoming:String
});

module.exports = mongoose.model('movies', movieSchema);

