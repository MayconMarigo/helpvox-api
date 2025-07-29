const { userQueries } = require("../database/query/user");
const { ERROR_MESSAGES } = require("../utils/constants");
const { toDataURL } = require("qrcode");
const { CryptoUtils } = require("../utils/encryption");
const { verifyTokenJwt } = require("../utils/jwt");

const getUserByEmailAndPassword = async (email, password) => {
  const user = await userQueries.findUserByEmailAndPassword(email, password);

  if (!user) throw new Error(JSON.stringify(ERROR_MESSAGES.USER.NOT_FOUND));

  return user;
};

const getUserDataByToken = async (token) => {
  const { id } = verifyTokenJwt(token);

  const user = await userQueries.getUserDataById(id);

  if (!user) throw new Error(JSON.stringify(ERROR_MESSAGES.USER.NOT_FOUND));

  return user;
};

const generateOTPAuthUrl = async (base32_secret) => {
  const totp = CryptoUtils.generateTotpConstructorWithSecret(base32_secret);

  if (!totp) throw new Error(JSON.stringify(ERROR_MESSAGES.TOTP.AUTH_URL));

  return totp.toString();
};

const generateTotpQrCode = async (otpAuthUrl) => await toDataURL(otpAuthUrl);

const verifyTwoFactorAuthenticationCode = async (base32_secret, token) => {
  const totp = CryptoUtils.generateTotpConstructorWithSecret(base32_secret);
  const delta = totp.validate({ token, window: 1 });

  if (delta !== 0) throw new Error(JSON.stringify(ERROR_MESSAGES.CODE_EXPIRED));

  return;
};

const findUserTypeById = async (userId) => {
  const user = await userQueries.findUserTypeById(userId);

  return user;
};

const getAgendaByDateRange = async (startDate, endDate, userId) => {
  const agenda = await userQueries.getAgendaByDateRange(
    startDate,
    endDate,
    userId
  );

  return agenda;
};

const getDashboardInfo = async (userId) => {
  const info = await userQueries.getDashboardInfo(userId);

  return info;
};

const getAllCallsByUserId = async (startDate, endDate, userId) => {
  const info = await userQueries.getAllCallsByUserId(
    startDate,
    endDate,
    userId
  );

  return info;
};

const getAllUsersNameAndId = async (companyId) => {
  const list = await userQueries.getAllUsersByNameAndId(companyId);

  return list;
};

const getAllCredentialsByUserId = async (companyId) => {
  const credentials = await userQueries.getAllCredentialsByUserId(companyId);

  return credentials;
};

const createCredential = async (companyId) => {
  const created = await userQueries.createCredential(companyId);

  return created;
};

const associateCompanyToUserAgenda = async (
  companyId,
  associateId,
  agendaId,
  finalDateTime
) => {
  const associated = await userQueries.associateCompanyToUserAgenda(
    companyId,
    associateId,
    agendaId,
    finalDateTime
  );

  return associated;
};

const getAllUsersByCompanyId = async (companyId) => {
  const users = await userQueries.getAllUsersByCompanyId(companyId);

  return users;
};

const createUser = async (decodedBody, companyId) => {
  const created = await userQueries.createUser(decodedBody, companyId);

  return created;
};

const updateUserByUserEmail = async (decodedBody) => {
  const updated = await userQueries.updateUserByUserEmail(decodedBody);

  return updated;
};

const updateCredentialByUserId = async (credential, status) => {
  const updated = await userQueries.updateCredentialByUserId(
    credential,
    status
  );

  return updated;
};

const getScheduledAgendaByDateRange = async (startDate, endDate, userId) => {
  const agendas = await userQueries.getScheduledAgendaByDateRange(
    startDate,
    endDate,
    userId
  );

  return agendas;
};

const getAllCallsByCompanyId = async (startDate, endDate, companyId) => {
  const calls = await userQueries.getAllCallsByCompanyId(
    startDate,
    endDate,
    companyId
  );

  return calls;
};

const deleteAgendaById = async (agendaId) => {
  const deleted = await userQueries.deleteAgendaById(agendaId);

  return deleted;
};

exports.UserService = {
  getUserDataByToken,
  getUserByEmailAndPassword,
  generateOTPAuthUrl,
  generateTotpQrCode,
  verifyTwoFactorAuthenticationCode,
  findUserTypeById,
  getAgendaByDateRange,
  getDashboardInfo,
  getAllCallsByUserId,
  getAllUsersNameAndId,
  getAllCredentialsByUserId,
  createCredential,
  associateCompanyToUserAgenda,
  getAllUsersByCompanyId,
  createUser,
  updateUserByUserEmail,
  updateCredentialByUserId,
  getScheduledAgendaByDateRange,
  getAllCallsByCompanyId,
  deleteAgendaById,
};
