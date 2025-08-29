require("dotenv").config();
const CryptoJs = require("crypto-js");
const Crypto = require("crypto");
const bcrypt = require("bcrypt");
const { TOTP } = require("./constants");
const base32 = require("base-32").default;
const OTPAuth = require("otpauth");

const encryptWithCypher = (value) =>
  CryptoJs.AES.encrypt(value, process.env.CRYPTO_KEY).toString();

const decryptWithCypher = (value) => {
  if (!value) return;
  const bytes = CryptoJs.AES.decrypt(value, process.env.CRYPTO_KEY);
  const decrypted = bytes.toString(CryptoJs.enc.Utf8);

  return decrypted;
};

const retrieveValuesFromEncryptedBody = async (body) => {
  const hashedPassword = await convertToDatabaseFormatedPassword(
    decryptWithCypher(body?.pw)
  );

  let base64Data;
  let buffer = null;

  if (body.fl) {
    base64Data = body.fl.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, "base64");
  }

  const encryptionDictionary = [
    {
      key: "nm",
      transformedValue: decryptWithCypher(body?.nm),
      name: "name",
    },
    { key: "pw", transformedValue: hashedPassword, name: "password" },
    { key: "em", transformedValue: decryptWithCypher(body?.em), name: "email" },
    {
      key: "dc",
      transformedValue: decryptWithCypher(body?.dc),
      name: "document",
    },
    {
      key: "zc",
      transformedValue: decryptWithCypher(body?.zc),
      name: "zipcode",
    },
    {
      key: "ad",
      transformedValue: decryptWithCypher(body?.ad),
      name: "address",
    },
    {
      key: "hn",
      transformedValue: decryptWithCypher(body?.hn),
      name: "addressNumber",
    },
    { key: "st", transformedValue: decryptWithCypher(body?.st), name: "state" },
    { key: "ct", transformedValue: decryptWithCypher(body?.ct), name: "city" },
    {
      key: "pn",
      transformedValue: decryptWithCypher(body?.pn),
      name: "phone",
    },
    {
      key: "stfa",
      transformedValue: decryptWithCypher(body?.stfa),
      name: "secret2fa",
    },
    { key: "t", transformedValue: body?.t, name: "token" },
    { key: "c", transformedValue: decryptWithCypher(body?.c), name: "code" },
    {
      key: "uti",
      transformedValue: decryptWithCypher(body?.uti),
      name: "userTypeId",
    },
    {
      key: "cid",
      transformedValue: decryptWithCypher(body?.cid),
      name: "callId",
    },
    {
      key: "clrid",
      transformedValue: decryptWithCypher(body?.clrid),
      name: "callerId",
    },
    {
      key: "rcvrid",
      transformedValue: decryptWithCypher(body?.rcvrid),
      name: "receiverId",
    },
    {
      key: "cnnd",
      transformedValue: decryptWithCypher(body?.cnnd),
      name: "connected",
    },
    {
      key: "sttm",
      transformedValue: new Date(decryptWithCypher(body?.sttm)),
      name: "startTime",
    },
    {
      key: "stdt",
      transformedValue: decryptWithCypher(body?.stdt),
      name: "startDate",
    },
    {
      key: "eddt",
      transformedValue: decryptWithCypher(body?.eddt),
      name: "endDate",
    },
    {
      key: "rt",
      transformedValue: decryptWithCypher(body?.rt),
      name: "rating",
    },
    {
      key: "uid",
      transformedValue: decryptWithCypher(body?.uid),
      name: "userId",
    },
    {
      key: "sts",
      transformedValue: decryptWithCypher(body?.sts),
      name: "status",
    },
    {
      key: "cl",
      transformedValue: body?.cl,
      name: "color",
    },
    {
      key: "fl",
      transformedValue: buffer,
      name: "logoImage",
    },
    {
      key: "ia",
      transformedValue: decryptWithCypher(body?.ia),
      name: "isAnonymous",
    },
    {
      key: "esp",
      transformedValue: body?.esp,
      name: "speciality",
    },
    {
      key: "doc",
      transformedValue: decryptWithCypher(body?.doc),
      name: "document",
    },
    {
      key: "crd",
      transformedValue: decryptWithCypher(body?.crd),
      name: "credential",
    },
    {
      key: "oem",
      transformedValue: decryptWithCypher(body?.oem),
      name: "oldEmail",
    },
  ];

  const decryptedBody = {};
  const encryptedBody = Object.keys(body);

  encryptionDictionary.forEach(() => {
    encryptedBody.forEach((key) => {
      const match = encryptionDictionary.find((value) => value.key == key);
      decryptedBody[match.name] = match.transformedValue;
    });
  });

  if (encryptedBody.findIndex((value) => value == "pw") !== -1) {
    decryptedBody.encryptedPassword = body?.pw;
  }

  return decryptedBody;
};

const convertToDatabaseFormatedPassword = async (password) => {
  if (!password) return;
  const hash = bcrypt.hash(password, process.env.BCRYPT_SALT_KEY);

  return hash;
};

const comparehashedPasswords = async (password, hashedPassword) => {
  if (!password) return false;

  const compare = bcrypt.compare(password, hashedPassword);

  return compare;
};

const generateBase32Hash = () => {
  const buffer = Crypto.randomBytes(15);
  const hash = base32.encode(buffer).replace(/=/g, "").substring(0, 24);

  return hash;
};

const generateTotpConstructorWithSecret = (base32_secret) =>
  new OTPAuth.TOTP({
    issuer: TOTP.AUTHENTICATOR_NAME,
    label: "Autenticador em duas etapas",
    algorithm: "SHA1",
    period: TOTP.AUTHENTICATOR_TIMEOUT,
    digits: 6,
    secret: base32_secret,
  });

const retrieveValuesFromEncryptedParams = async (params) => {
  const encryptionDictionary = [
    // {
    //   key: "uid",
    //   transformedValue: decryptWithCypher(params?.uid),
    //   name: "userId",
    // },
  ];

  const decryptedParams = {};
  const encryptedParams = Object.keys(params);

  encryptionDictionary.forEach(() => {
    encryptedParams.forEach((key) => {
      const match = encryptionDictionary.find((value) => value.key == key);
      decryptedParams[match.name] = match.transformedValue;
    });
  });

  return decryptedBody;
};

exports.CryptoUtils = {
  encryptWithCypher,
  decryptWithCypher,
  retrieveValuesFromEncryptedBody,
  convertToDatabaseFormatedPassword,
  comparehashedPasswords,
  generateBase32Hash,
  generateTotpConstructorWithSecret,
  retrieveValuesFromEncryptedParams,
};
