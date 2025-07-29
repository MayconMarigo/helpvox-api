const { where } = require("sequelize");
const { Agenda } = require("../../../models");
const { sequelize } = require("../database");

const createAgenda = async (
  callId,
  callerId,
  receiverId,
  videoUrl,
  scheduledDateTime
) => {
  const [agenda, created] = await Agenda.findOrCreate({
    where: { callId },
    defaults: {
      callId,
      callerId,
      receiverId,
      videoUrl,
      scheduledDateTime,
      status: 1,
    },
  });

  return created;
};

const findAgendaByUserId = async (userId, startDate, endDate) => {
  const agenda = await Agenda.findAll({
    where: {
      userId,
      scheduledDateTime: {
        [Op.between]: [startDate, endDate],
      },
    },
    attributes: [
      "callId",
      "callerId",
      "receiverId",
      "videoUrl",
      "scheduledDateTime",
    ],
  });

  if (!agenda) return null;

  return agenda;
};

const insertAgendaByDate = async (userId, timeRange, date, multiple) => {
  const createDateTime = (initDate, initTimeRange) =>
    `${initDate} ${initTimeRange}`;

  if (multiple) {
    const dateTimeWithRange = timeRange.map((time) => {
      return {
        scheduledDateTime: createDateTime(time, date),
      };
    });

    const data = await sequelize.transaction(async (t) => {
      for (const range of dateTimeWithRange) {
        await Agenda.create(
          {
            scheduledDateTime: range.scheduledDateTime,
            receiverId: userId,
            callerId: null,
            status: 1,
          },
          { transaction: t }
        );
      }
    });

    return data;
  }

  const [data] = await sequelize.query(
    `
      INSERT INTO Agendas
      (scheduledDateTime, createdAt, updatedAt, receiverId)
      VALUES
      ('${createDateTime(date, timeRange)}', now(), now(), '${userId}');
    `
  );

  return data;
};

const associateUserAgendaToCompany = async (agendaId, companyId) => {
  const [updated] = Agenda.update(
    { callerId: companyId },
    {
      where: { id: agendaId },
    }
  );

  return updated;
};

exports.agendaQueries = {
  createAgenda,
  findAgendaByUserId,
  insertAgendaByDate,
  associateUserAgendaToCompany,
};
