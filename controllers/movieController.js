const movieModel = require('../models/movieModel')
const userModel = require('../models/userModel')
const suggestModel = require('../models/suggestModel')
const fs = require('fs');
const path = require('path');

exports.uploadMovie = async (req, res) => {
  try {
    let {
      title,
      featured,
      details,
      release_date,
      genre,
      rating,
      author,
      synopsis,
      release_year,
      main_cast,
      language,
      runtime,
      upcoming,
    } = req.body;

   

 
    
    if (genre && !Array.isArray(genre)) {
      genre = [genre];
    }
    if (main_cast && !Array.isArray(main_cast)) {
      main_cast = [main_cast];
    }

    const image = req.file;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newMovie = await movieModel.create({
      title,
      featured: featured === "true" || featured === true, 
      details,
      release_date,
      genre,
      rating: Number(rating) || 0,
      author,
      synopsis,
      release_year,
      main_cast,
      language,
      runtime,
      image: image.path,
      upcoming
    });

    res.status(200).json({
      message: "Movie uploaded successfully",
      data: newMovie,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.getAllMovie = async (req, res) => {
  try {
    const search = req.query.search || '';

    const movies = await movieModel.find({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { main_cast: { $regex: search, $options: 'i' } }
      ]
    });

    res.status(200).json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};



exports.deleteMovie =async(req,res)=>{
    try{
        const {id} = req.params;

        await movieModel.findByIdAndDelete(id)
        res.status(200).json("Deleted")
    }catch(error){
        console.log("internal Server Error")
    }
}


exports.updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
   
    const updatedMovie = await movieModel.findByIdAndUpdate(
      id,
      { featured: status },
      { new: true } 
    );
    console.log(updatedMovie)
    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.status(200).json({ message: "Movie updated", data: updatedMovie });
  } catch (error) {
    console.error("Error updating movie:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getMovieById = async (req, res) => {
  try {
    const { id, userId } = req.params;  // movieId and userId from URL params
    

    // Step 1: Fetch the movie by movieId
    const movie = await movieModel.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

   
    let isFavourite = false;
    if (userId) {
      const user = await userModel.findById(userId);  
      if (user && user.favourite && user.favourite.includes(id)) {
        isFavourite = true;  
      }
    }

    // Step 3: Respond with movie data and the favourite status
    res.status(200).json({ movie, isFavourite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.updateRating = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { rating } = req.body;

    

    const movie = await movieModel.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

   
    movie.ratings = movie.ratings || []; 
    movie.ratings.push(rating); 

    
    const averageRating = movie.ratings.reduce((sum, rate) => sum + rate, 0) / movie.ratings.length;

   
    movie.rating = averageRating; 
    await movie.save(); 

   
    res.status(200).json(movie);

  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.postFav = async (req, res) => {
  try {
    const { userId, movieId } = req.body;

    // Step 1: Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Check duplicate favourite
    if (user.favourite.includes(movieId)) {
      return res.status(400).json({ message: 'Movie already in favourites' });
    }

    // Step 3: Add movie to favourites
    user.favourite.push(movieId);
    await user.save();

    // Step 4: Get movie
    const movie = await movieModel.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Step 5: Update suggests
    let suggestDoc = await suggestModel.findOne({ userId });
    if (!suggestDoc) {
      suggestDoc = new suggestModel({
        userId,
        genre: movie.genre,  
      });
    } else {
      suggestDoc.genre = [...suggestDoc.genre, ...movie.genre]; // ✅ array concat
    }
    await suggestDoc.save();

    res.status(200).json({ message: 'Movie added to favourites and suggestion updated' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};




exports.getFavourites = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

 
    const favouriteMovieIds = user.favourite || [];

    
    const movies = await movieModel.find(
      { _id: { $in: favouriteMovieIds } },
      "title image runtime author release_year"
    ).lean();

    res.status(200).json({ favourites: movies });
  } catch (error) {
    console.error("Error fetching favourites:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.deleteFav = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

   
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { favourite: movieId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Movie removed from favourites successfully",
      favourite: updatedUser.favourite,
    });
  } catch (error) {
    console.error("Error deleting favourite:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



const authorModel = require("../models/authorModel"); // your author schema

exports.uploadAuthor = async (req, res) => {
  try {
    let { name, dob, start, bio, nationality, awards } = req.body;

    
    if (awards && !Array.isArray(awards)) {
      awards = awards.split(",").map(a => a.trim());
    }

    const image = req.file; 

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newAuthor = await authorModel.create({
      name,
      dob,
      start,
      bio,
      nationality,
      awards,
      image: image.path, // multer file path
    });

    res.status(200).json({
      message: "Author uploaded successfully",
      data: newAuthor,
    });
  } catch (err) {
    console.error("Author upload failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getAuthorDetails = async (req, res) => {
  try {
    const { name } = req.params;

    // Find author by name
    const author = await authorModel.findOne({ name });
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    // Find all movies by this author
    const movies = await movieModel.find({ author: name });

    res.status(200).json({
      author,
      movies,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;

    const suggestDoc = await suggestModel.findOne({ userId });
    if (!suggestDoc || !suggestDoc.genre || suggestDoc.genre.length === 0) {
      return res.status(404).json({ message: "Not enough data to generate suggestions" });
    }

    // frequency map
    const freqMap = {};
    suggestDoc.genre.forEach((g) => {
      freqMap[g] = (freqMap[g] || 0) + 1;
    });

    // top 3 genre
    const topGenres = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    let suggestions = [];
    const movieIds = new Set();

    // প্রতিটা genre থেকে সব matching movies আনো (non-empty genre)
    for (let genre of topGenres) {
      const movies = await movieModel.find({
        genre: { $in: [genre], $exists: true, $ne: [] }
      });

      // প্রতিটা movie check করে unique রাখি
      for (let movie of movies) {
        if (!movieIds.has(movie._id.toString())) {
          suggestions.push(movie);
          movieIds.add(movie._id.toString());
        }
      }
    }

    if (suggestions.length === 0) {
      return res.status(404).json({ message: "No movies found for top genres" });
    }

    // Randomly shuffle the suggestions
    for (let i = suggestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [suggestions[i], suggestions[j]] = [suggestions[j], suggestions[i]];
    }

    // Limit to max 10 movies
    suggestions = suggestions.slice(0, 10);

    res.status(200).json({
      topGenres,
      suggestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



 