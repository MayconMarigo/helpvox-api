const { credentialsQueries } = require("../database/query/credentials");

const findValidCredential = async (credential) => {
  const isValid = await credentialsQueries.findValidCredential(credential);

  return isValid;
};

const getUserAgendaWithCredential = async (startDate, endDate, credential) => {
  const agenda = await credentialsQueries.getUserAgendaWithCredential(
    startDate,
    endDate,
    credential
  );

  return agenda;
};

const getUsersListWithCredential = async (credential) => {
  const users = await credentialsQueries.getUsersListWithCredential(credential);

  return users;
};

const associateAgendaToUser = async (credential, agendaId, userId) => {
  const updated = await credentialsQueries.associateAgendaToUser(
    credential,
    agendaId,
    userId
  );

  return updated;
};

const createUserWithCredential = async (name, email, phone, credential) => {
  const created = await credentialsQueries.createUserWithCredential(
    name,
    email,
    phone,
    credential
  );

  return created;
};

const deleteUserWithCredential = async (credential, userId) => {
  const deleted = await credentialsQueries.deleteUserWithCredential(
    credential,
    userId
  );
  return deleted;
};

exports.credentialsService = {
  findValidCredential,
  getUserAgendaWithCredential,
  getUsersListWithCredential,
  associateAgendaToUser,
  createUserWithCredential,
  deleteUserWithCredential,
};
