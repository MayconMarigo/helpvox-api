const { ERROR_MESSAGES } = require("./constants");
const { stringUtils } = require("./string");

const extractCodeAndMessageFromError = (stringifiedMessage) => {
  if (!stringifiedMessage)
    return {
      code: ERROR_MESSAGES.ERRORS.GENERIC_ERROR.CODE,
      message: ERROR_MESSAGES.ERRORS.GENERIC_ERROR.MESSAGE,
    };

  const returnedErrorMessage = stringUtils.isJson(stringifiedMessage)
    ? JSON.parse(stringifiedMessage)
    : { code: 422, message: stringifiedMessage };

  return returnedErrorMessage;
};

const formatErrorFieldsMessageFromDatabase = (errorObject) => {
  if (!errorObject.fields) return "";

  const formattedErrorMessage = `on field(s): ${Object.keys(errorObject.fields).join(", ")}.`;

  return formattedErrorMessage;
};

module.exports = {
  extractCodeAndMessageFromError,
  formatErrorFieldsMessageFromDatabase,
};
