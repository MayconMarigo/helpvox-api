const { userQueries } = require("../database/query/user");
const { TokenService } = require("../services/tokenService");
const { ERROR_MESSAGES } = require("../utils/constants");
const { CryptoUtils } = require("../utils/encryption");
const { extractCodeAndMessageFromError } = require("../utils/error");

const isAdmin = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    const token = TokenService.extractTokenFromHeaders(authorization);
    const data = await TokenService.verifyEncodedToken(token);

    const { id, email, encryptedPassword } = data;
    const hashedPassword = await userQueries.findUserById(id);
    const decryptedPassword = CryptoUtils.decryptWithCypher(encryptedPassword);

    const arePasswordsEqual = await CryptoUtils.comparehashedPasswords(
      decryptedPassword,
      hashedPassword
    );

    if (!arePasswordsEqual) {
      throw new Error(JSON.stringify(ERROR_MESSAGES.CREDENTIALS_CHANGED));
    }

    const userIsAdmin = await userQueries.findAdminUserByEmail(
      email,
      encryptedPassword
    );

    if (!userIsAdmin)
      throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

    next();
  } catch (error) {
    const { code, message } = extractCodeAndMessageFromError(error.message);
    res.status(code).send({ message });
  }
};

module.exports = {
  isAdmin,
};
