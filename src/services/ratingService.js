const { ratingQueries } = require("../database/query/rating");

const createRating = async (callId, rating) => {
  const rate = await ratingQueries.createRating(callId, rating);

  return rate;
};

exports.RatingService = {
  createRating,
};
