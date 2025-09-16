const Review = require('../models/reviewModel');
const User = require('../models/userModel'); 

exports.postReview = async (req, res) => {
  try {
    const { userId, movieId, review } = req.body;

    if (!userId || !movieId || !review) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    
    const newReview = new Review({ userId, movieId, review });
    await newReview.save();

   
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { reviewed: movieId } },
      { new: true }
    );

    res.status(201).json({ message: 'Review added successfully', review: newReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getReview = async (req, res) => {
  try {
    const { movieId, userId } = req.params;

    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    // find reviews for this movie
    const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });

    // check if this user already reviewed
    const userReviewed = reviews.some((review) => review.userId === userId);

    // fetch user names for each review
    const reviewsWithUser = await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findById(review.userId).select("name");
        return {
          _id: review._id,
          movieId: review.movieId,
          review: review.review,
          createdAt: review.createdAt,
          user: {
            id: review.userId,
            name: user ? user.name : "Unknown"
          }
        };
      })
    );

    res.status(200).json({
      reviews: reviewsWithUser,
      userReviewed
    });

  } catch (error) {
    console.error("Error in getReview:", error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

  
    const review = await Review.findById(commentId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const userId = review.userId;
    const movieId = review.movieId;

  
    await Review.findByIdAndDelete(commentId);

  
    await User.findByIdAndUpdate(
      userId,
      { $pull: { reviewed: movieId } },
      { new: true }
    );

    res.status(200).json({ message: "Review deleted successfully" });

  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.updateReview = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { review } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      commentId,
      { review },
      { new: true } // return updated document
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(updatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};