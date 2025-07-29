const { ERROR_MESSAGES } = require("../utils/constants");
const { verifyTokenJwt, createTokenJwt } = require("../utils/jwt");

const verifyEncodedToken = async (token, parametersToReturn = []) => {
  const verified = verifyTokenJwt(token);

  if (!verified)
    throw new Error(JSON.stringify(ERROR_MESSAGES.TOKEN.INVALID_TOKEN));

  if (parametersToReturn.length > 0) {
    const verifiedWithParameters = {};

    Object.keys(verified).forEach((value) => {
      parametersToReturn.forEach((parameter) => {
        if (value === parameter) {
          verifiedWithParameters[value] = verified[value];
        }
      });
    });

    return verifiedWithParameters;
  }

  return verified;
};

const createEncodedToken = (data) => createTokenJwt(data);

const extractTokenFromHeaders = (authorization) => {
  const hasToken =
    authorization?.split("Bearer ")[1] !== "undefined" ? true : false;

  if (!hasToken) return false;

  return authorization?.split("Bearer ")[1];
};

exports.TokenService = {
  verifyEncodedToken,
  createEncodedToken,
  extractTokenFromHeaders,
};
