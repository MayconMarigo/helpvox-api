const { verify, sign } = require("jsonwebtoken");
const { JWT_TOKEN_EXPIRY_TIME } = require("./constants");

const verifyTokenJwt = (token) => verify(token, process.env.JWT_SECRET_KEY);

const createTokenJwt = (data) => sign(data, process.env.JWT_SECRET_KEY, { expiresIn: JWT_TOKEN_EXPIRY_TIME });

// const expireJwt = (token) => 

module.exports = {
    verifyTokenJwt,
    createTokenJwt
}