const { miscelaneousQueries } = require("../database/query/miscelaneous");

const getAllDCCards = async () => {
  const dcCards = await miscelaneousQueries.getAllDCCards();

  return dcCards;
};

exports.miscelaneousService = {
  getAllDCCards,
};
