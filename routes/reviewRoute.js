const express = require("express");
const { postReview, getReview, deleteComment, updateReview } = require("../controllers/revewController");



const router = express.Router();

router.post('/post-review',postReview)
router.get('/get-reviews/:movieId/:userId',getReview)
router.delete('/delete-comment/:commentId',deleteComment)
router.put('/update-review/:commentId',updateReview)


module.exports = router;