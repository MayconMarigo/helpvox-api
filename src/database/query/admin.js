const { User, Call } = require("../../../models");
const Crypto = require("crypto");
const { CryptoUtils } = require("../../utils/encryption");
const { Op } = require("@sequelize/core");
const { literal } = require("sequelize");
const { userUtils } = require("../../utils/user");
const { dateUtils } = require("../../utils/date");
const { sequelize } = require("../database");

const createUser = async (payload) => {
  const {
    name,
    email,
    phone,
    password,
    userTypeId,
    logoImage = null,
    color,
  } = payload;

  const secret2fa = CryptoUtils.generateBase32Hash();
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      id: Crypto.randomUUID(),
      name,
      email,
      phone,
      password,
      logoImage,
      colorScheme: color,
      status: 1,
      userTypeId,
      secret2fa,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return created;
};

const updateUserByUserEmail = async (payload) => {
  const { name, email, phone, password, status, userTypeId } = payload;

  const updated = await User.update(
    {
      name,
      email,
      phone,
      password,
      status,
      userTypeId,
      updatedAt: new Date(),
    },
    {
      where: { email },
    }
  );

  return updated;
};

const getAllCalls = async (startDate, endDate) => {
  let initDate = "";
  let finalDate = "";

  if (!startDate) {
    initDate = dateUtils.substractDaysFromNewDate(30);
  }

  if (!endDate) {
    finalDate = new Date();
  }

  initDate = startDate.split("-").reverse().join("-");
  finalDate = endDate.split("-").reverse().join("-");

  const [reports] = await sequelize.query(`
    SELECT
      COALESCE(caller.name, "Anônimo") AS callerName,
      receiver.name AS receiverName,
      c.startTime,
      c.endTime,
      c.videoUrl,
      TIMEDIFF(c.endTime, c.startTime) AS callDuration
    FROM calls c
    LEFT JOIN users caller ON c.callerId = caller.id
    INNER JOIN users receiver ON c.receiverId = receiver.id
    WHERE (c.startTime BETWEEN '${initDate} 00:00:00' AND '${finalDate} 23:59:59')
    AND
    caller.userTypeId = 4
    `);

  return reports;
};

const findAllCallsByUserIdAndType = async (
  userId,
  startDate,
  endDate,
  type
) => {
  const types = {
    agent: "receiverId",
    company: "callerId",
  };

  const report = await Call.findAll({
    where: {
      [types[type]]: userId,
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    attributes: [
      "connected",
      "startTime",
      "endTime",
      "callId",
      "callerId",
      "videoUrl",
      [
        literal("TIMESTAMPDIFF(MINUTE, startTime, endTime)"),
        "durationInMinutes",
      ],
    ],
  });

  return report;
};

const getAllUsers = async () => {
  const data = await User.findAll({
    where: { userTypeId: 2 },
    attributes: ["name", "email", "phone", "status"],
  });

  if (!data) return null;

  const users = data.map((user) => {
    if (user.userTypeId)
      user.userTypeId = userUtils.checkUserType(user.userTypeId);

    if (user.status == 1) user.status = "Ativo";

    if (user.status == 0) user.status = "Inativo";

    return user;
  });

  return users;
};

const getAllUsersNameAndId = async () => {
  const data = await User.findAll({
    where: { userTypeId: 3 },
    attributes: [
      [literal("id"), "value"],
      [literal("name"), "text"],
    ],
  });

  if (!data) return null;

  return data;
};

const getDashboardInfo = async () => {
  const [calls] = await sequelize.query(`
  SELECT 
    DATE_FORMAT(startTime, '%m') AS month,
    COUNT(*) AS calls_quantity
  FROM 
    calls
  GROUP BY 
    month
  ORDER BY 
    month;
  `);

  const [users] = await sequelize.query(`
    SELECT 
      COUNT(users.id) AS users_quantity 
      FROM users;
    `);

  const [callsQty] = await sequelize.query(`
    SELECT 
      COUNT(calls.id) AS calls_quantity 
      FROM calls;
    `);

  const [durationInMinutes] = await sequelize.query(`
    SELECT 
      SUM(TIMESTAMPDIFF(MINUTE, c.startTime, c.endTime)) 
      AS minutes_count from calls c
    `);

  const { users_quantity } = users[0];
  const { calls_quantity } = callsQty[0];
  const { minutes_count } = durationInMinutes[0];

  return {
    calls,
    calls_quantity,
    minutes_count,
    users_quantity,
  };
};

const getAgendaByDateRange = async (startDate, endDate, userId) => {
  const [agendas] = await sequelize.query(
    `
      SELECT
        DATE_FORMAT(scheduledDateTime, '%d-%m-%y') as date,
        DATE_FORMAT(scheduledDateTime, '%H:%i') as startTime, 
        DATE_FORMAT(DATE_ADD(scheduledDateTime, INTERVAL 30 MINUTE), '%H:%i') AS endTime,
        caller.name as applicant,  
        receiver.name as requested,
        a.callUrl
      FROM agendas a
      LEFT JOIN users caller ON a.callerId = caller.id
      LEFT JOIN users receiver ON a.receiverId = receiver.id
      WHERE 
      (a.scheduledDateTime BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59')
      AND
      (a.receiverId = '${userId}')
      and
      (a.status = 1)
    `
  );

  const data = [];
  agendas.map((agenda) => {
    const finder = data.find((value) => value.date == agenda.date);
    if (!finder) {
      data.push({ date: agenda.date, history: [] });
    }
  });

  agendas.map((agenda) => {
    const finder = data.find((value) => value.date == agenda.date);
    if (finder) {
      delete agenda.date;
      finder.history.push(agenda);
    }
  });

  return data;
};

exports.adminQueries = {
  createUser,
  updateUserByUserEmail,
  getAllCalls,
  findAllCallsByUserIdAndType,
  getAllUsers,
  getDashboardInfo,
  getAgendaByDateRange,
  getAllUsersNameAndId,
};
