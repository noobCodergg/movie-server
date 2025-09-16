const express = require("express");
const { uploadMovie, getAllMovie, deleteMovie, updateMovie, getMovieById, updateRating, postFav, getFavourites, deleteFav, uploadAuthor, getAuthorDetails, getSuggestions } = require("../controllers/movieController");
const upload = require('../middlewares/multer')


const router = express.Router();

router.post('/upload-movie',upload.single("image"),uploadMovie)
router.get('/get-all-movie',getAllMovie)
router.delete('/delete-movie/:id',deleteMovie)
router.put('/update-movie/:id',updateMovie)
router.get('/get-movie-by-id/:id/:userId',getMovieById)
router.put('/update-rating/:movieId',updateRating)
router.post('/post-fav',postFav)
router.get('/get-favourites/:userId',getFavourites)
router.delete('/delete-fav/:userId/:movieId',deleteFav)
router.post('/upload-author',upload.single("image"),uploadAuthor)
router.get('/get-author-detail/:name',getAuthorDetails)
router.get('/get-suggested/:userId',getSuggestions)

module.exports = router;