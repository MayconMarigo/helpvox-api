const { agendaQueries } = require("../database/query/agenda");

const createAgenda = async (
  callId,
  callerId,
  receiverId,
  videoUrl,
  scheduledDateTime
) => {
  const created = await agendaQueries.createAgenda(
    callId,
    callerId,
    receiverId,
    videoUrl,
    scheduledDateTime
  );

  return created;
};

const findAgendaByUserId = async (userId, startDate, endDate) => {
  const agenda = await agendaQueries.findAgendaByUserId(
    userId,
    startDate,
    endDate
  );

  return agenda;
};

const insertAgendaByDate = async (userId, timeRange, date, multiple) => {
  const data = await agendaQueries.insertAgendaByDate(
    userId,
    timeRange,
    date,
    multiple
  );

  return data;
};

const associateUserAgendaToCompany = async (agendaId, companyId) => {
  const updated = await agendaQueries.associateUserAgendaToCompany(
    agendaId,
    companyId
  );

  return updated;
};

exports.agendaService = {
  createAgenda,
  findAgendaByUserId,
  insertAgendaByDate,
  associateUserAgendaToCompany,
};
