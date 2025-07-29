const { Rating } = require("../../../models");

const createRating = async (callId, rating) => {
  const [rate, created] = await Rating.findOrCreate({
    where: { callId },
    defaults: {
      callId,
      rating,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return created;
};

exports.ratingQueries = {
  createRating,
};
