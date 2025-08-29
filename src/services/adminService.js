const { adminQueries } = require("../database/query/admin");
const { ERROR_MESSAGES } = require("../utils/constants");

const createUser = async (payload) => {
  const isNewUser = await adminQueries.createUser(payload);

  if (!isNewUser)
    throw new Error(JSON.stringify(ERROR_MESSAGES.USER.ALREADY_EXISTS));

  return isNewUser;
};

const getAllCalls = async (startDate, endDate) => {
  const reports = await adminQueries.getAllCalls(startDate, endDate);

  return reports;
};

const findAllCallsByUserIdAndType = async (
  userId,
  startDate,
  endDate,
  type
) => {
  const reports = await adminQueries.findAllCallsByUserIdAndType(
    userId,
    startDate,
    endDate,
    type
  );

  return reports;
};

const updateUserByUserEmailOrName = async (payload, userTypeId) => {
  const updated = await adminQueries.updateUserByUserEmailOrName(payload, userTypeId);

  return updated;
};

const getAllUsers = async (userTypeId) => {
  const users = await adminQueries.getAllUsers(userTypeId);

  return users;
};

const getAllUsersNameAndId = async () => {
  const users = await adminQueries.getAllUsersNameAndId();

  return users;
};

const getDashboardInfo = async () => {
  const info = await adminQueries.getDashboardInfo();

  return info;
};

const getAgendaByDateRange = async (startDate, endDate, userId) => {
  const agenda = await adminQueries.getAgendaByDateRange(
    startDate,
    endDate,
    userId
  );

  return agenda;
};

exports.adminService = {
  createUser,
  updateUserByUserEmailOrName,
  getAllCalls,
  findAllCallsByUserIdAndType,
  getAllUsers,
  getDashboardInfo,
  getAgendaByDateRange,
  getAllUsersNameAndId,
};
