const { USER_TYPES } = require("./constants");

const checkUserType = (type) => {
  return USER_TYPES[type];
};

exports.userUtils = {
  checkUserType,
};
