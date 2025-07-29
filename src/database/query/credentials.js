const { literal } = require("sequelize");
const { Credential, User, Agenda } = require("../../../models");
const {
  ERROR_MESSAGES,
  BASE_DAILY_JS_URL_FRONTEND,
} = require("../../utils/constants");
const { sequelize } = require("../database");
const { generateAdminRoomName } = require("../../services/dailyJsService");

const findValidCredential = async (credential) => {
  const isValid = await Credential.findOne({
    where: { id: credential, status: 1 },
  });

  return !!isValid;
};

const getUserAgendaWithCredential = async (startDate, endDate, credential) => {
  // const [findUsersAllowedList] = await sequelize.query(`
  //   SELECT DISTINCT(u.id) FROM credentials c
  //   INNER JOIN users u
  //   ON
  //   c.userId = u.createdBy
  //   where c.id = '${credential}'
  //   `);

  // const allowed = !!findUsersAllowedList.find((user) => user.id == userId);

  // if (!allowed) throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

  const [agendas] = await sequelize.query(
    `
      SELECT
        DATE_FORMAT(scheduledDateTime, '%d-%m-%Y') as data,
        DATE_FORMAT(scheduledDateTime, '%H:%i') as hora_inicio, 
        DATE_FORMAT(DATE_ADD(scheduledDateTime, INTERVAL 30 MINUTE), '%H:%i') AS hora_fim,
        receiver.name as medico,
        caller.name as usuario,
        a.id as id_agenda
      FROM agendas a
      LEFT JOIN users caller ON a.callerId = caller.id
      INNER JOIN users receiver ON a.receiverId = receiver.id
      WHERE 
      (a.scheduledDateTime BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59')
      AND
      (a.callUrl IS NULL)
      AND
      (a.status = 1)
      ORDER BY
      a.scheduledDateTime asc
    `
  );
  // CONCAT('${BASE_DAILY_JS_URL_FRONTEND}', a.callUrl) as url_chamada,

  const data = [];
  agendas.map((agenda) => {
    const finder = data.find((value) => value.data == agenda.data);
    if (!finder) {
      data.push({ data: agenda.data, agendas: [] });
    }
  });

  agendas.map((agenda) => {
    const finder = data.find((value) => value.data == agenda.data);
    if (finder) {
      delete agenda.data;
      finder.agendas.push(agenda);
    }
  });

  return data;
};

const getUsersListWithCredential = async (credential) => {
  const findUserByCredential = await Credential.findOne({
    where: {
      id: credential,
    },
    attributes: ["userId"],
  });

  if (!findUserByCredential)
    throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

  // const { dataValues } = findUserByCredential;
  // const { userId } = dataValues;

  const users = await User.findAll({
    where: { userTypeId: 3 },
    attributes: ["id", [literal("name"), "nome"]],
  });

  return users;
};

const associateAgendaToUser = async (credential, agendaId) => {
  const findUserByCredential = await Credential.findOne({
    where: {
      id: credential,
    },
    attributes: ["userId"],
  });

  if (!findUserByCredential)
    throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

  const { dataValues } = findUserByCredential;
  const { userId } = dataValues;

  const [findReceiverIdByAgendaId] = await sequelize.query(
    `
      SELECT 
      a.id, 
      a.receiverId,
      DATE_FORMAT(a.scheduledDateTime, '%Y-%m-%d %H:%i') as scheduledDateTime
      FROM agendas a 
      INNER JOIN users u
      ON a.receiverId = u.id
      WHERE a.id = '${agendaId}'
    `
  );

  if (!findReceiverIdByAgendaId[0])
    throw new Error(JSON.stringify(ERROR_MESSAGES.INVALID_AGENDA_ID));

  // const [findUsersAllowedList] = await sequelize.query(`
  //   SELECT DISTINCT(u.id) FROM credentials c
  //   INNER JOIN users u
  //   ON
  //   c.userId = u.createdBy
  //   where c.id = '${credential}'
  //   `);

  const { receiverId, scheduledDateTime } = findReceiverIdByAgendaId[0];

  // const allowed = !!findUsersAllowedList.find((user) => user.id == receiverId);

  // if (!allowed) throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

  const dateIsLowerThanNow = (dateToCompare) =>
    new Date(dateToCompare) < new Date();

  if (dateIsLowerThanNow(scheduledDateTime))
    throw new Error(JSON.stringify(ERROR_MESSAGES.DATE_LOWER_THAN_NOW));

  const roomName = crypto.randomUUID();

  const room = await generateAdminRoomName(roomName, scheduledDateTime);

  const updated = await Agenda.update(
    {
      callId: room.id,
      callUrl: room.name,
      callerId: userId,
    },
    { where: { id: agendaId } }
  );

  return !!updated;
};

exports.credentialsQueries = {
  findValidCredential,
  getUserAgendaWithCredential,
  getUsersListWithCredential,
  associateAgendaToUser,
};
