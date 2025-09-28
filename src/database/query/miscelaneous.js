const { DCCard } = require("../../../models");

const getAllDCCards = async () => {
  const dcCards = await DCCard.findAll({
    attributes: ["img", "title", "content"],
    limit: 9
  });

  return dcCards;
};

exports.miscelaneousQueries = { getAllDCCards };
