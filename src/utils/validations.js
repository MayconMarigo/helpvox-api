const { ERROR_MESSAGES } = require("./constants");

const checkRequiredValues = (arrayOfRequiredValues, validationArray) => {
  const sortedRequiredArray = arrayOfRequiredValues.sort().toString();
  const sortedValidationArray = validationArray.sort().toString();

  if (sortedRequiredArray == sortedValidationArray) return;

  arrayOfRequiredValues.forEach((value) => {
    if (validationArray.findIndex((required) => required == value) == -1) {
      throw new Error(
        JSON.stringify({ code: 412, message: `${value} is required.` })
      );
    }
  });
};

const checkTransformedValues = (transformedValues) => {
  const values = Object.values(transformedValues);
  let error = false;
  values.forEach((value) => {
    if (!value && isNaN(value)) {
      return (error = true);
    }
  });

  if (error) {
    throw new Error(JSON.stringify(ERROR_MESSAGES.MALFORMATTED_FIELDS));
  }

  return;
};

exports.ValidationUtils = {
  checkRequiredValues,
  checkTransformedValues,
};
