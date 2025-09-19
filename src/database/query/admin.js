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
    document = null,
    speciality,
  } = payload;

  const formatPhone = (value) => {
    if (!value) return "";
    let a = value;
    a = a.replace("(", "");
    a = a.replace(")", "");
    a = a.replace("-", "");
    a = a.replace(" ", "");

    return a;
  };

  const secret2fa = CryptoUtils.generateBase32Hash();
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      id: Crypto.randomUUID(),
      name,
      email,
      phone: formatPhone(phone),
      password,
      logoImage,
      colorScheme: color,
      status: 1,
      userTypeId,
      secret2fa,
      createdAt: new Date(),
      updatedAt: new Date(),
      document,
      speciality,
    },
  });

  return created;
};

const updateUserByUserEmailOrName = async (payload, type) => {
  const { name, email, phone, password, status, userTypeId, oldEmail } =
    payload;

  const updateObject = {
    2: {
      name,
      email,
      phone,
      password,
      status,
      userTypeId,
      updatedAt: new Date(),
    },
    3: {
      name,
      password,
      status,
      updatedAt: new Date(),
    },
  };

  const whereObject = {
    2: {
      where: { email },
    },
    3: {
      where: { name: oldEmail },
    },
  };

  const updated = await User.update(updateObject[type], whereObject[type]);

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

  initDate = startDate.split("/").reverse().join("/");
  finalDate = endDate.split("/").reverse().join("/");

  console.log(initDate);
  console.log(finalDate);
  const [calls] = await sequelize.query(`
    SELECT
      COALESCE(caller.name, "Anônimo") AS callerName,
      receiver.name AS receiverName,
      caller.speciality as department,
      receiver.speciality,
      DATE_SUB(c.startTime, INTERVAL 3 HOUR) AS startTime,
      TIME_FORMAT(SEC_TO_TIME(GREATEST(CEIL(TIMESTAMPDIFF(SECOND, c.startTime, c.endTime) / 60), 1) * 60), '%H:%i') AS callDuration
    FROM calls c
    LEFT JOIN users caller ON c.callerId = caller.id
    INNER JOIN users receiver ON c.receiverId = receiver.id
    WHERE (c.startTime BETWEEN '${initDate} 00:00:00' AND '${finalDate} 23:59:59')
    AND
    caller.userTypeId = 4
    AND
    c.isSocketConnection = 1
    `);

  const [callsQty] = await sequelize.query(`
    SELECT
      COALESCE(COUNT(c.id), 0) AS calls_quantity
      FROM calls c
      INNER JOIN users u
      ON
      c.callerId = u.id
      AND
        c.isSocketConnection = 1
      AND
        (c.startTime BETWEEN '${initDate} 00:00:00' AND '${finalDate} 23:59:59')
    `);

  const [durationInMinutes] = await sequelize.query(`
      SELECT 
      COALESCE(SUM(
          GREATEST(
              CEIL(TIMESTAMPDIFF(SECOND, c.startTime, c.endTime) / 60),
              1
          )
      ), 0) AS minutes_count
      from calls c
      INNER JOIN users u
      ON
      c.callerId = u.id
      AND
        c.isSocketConnection = 1
      AND
        (c.startTime BETWEEN '${initDate} 00:00:00' AND '${finalDate} 23:59:59')
    `);

  const { calls_quantity } = callsQty[0];
  const { minutes_count } = durationInMinutes[0];

  const dashboardItems = [
    { title: "Atendimentos", value: calls_quantity },
    { title: "Total de Minutos", value: minutes_count },
  ];

  return { calls, dashboardItems };
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

const getAllUsers = async (userTypeId) => {
  const attributesPerTypeId = {
    2: ["name", "email", "phone", "status", "id"],
    3: ["name", "speciality", "status"],
  };

  const data = await User.findAll({
    where: { userTypeId },
    attributes: attributesPerTypeId[userTypeId],
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

const getDashboardCSVInfo = async () => {
  const [calls] = await sequelize.query(
    `
    SELECT 
    co.name as company_name,
    COALESCE(COUNT(*), 0) AS calls_quantity,
    COALESCE(SUM(CEIL(TIMESTAMPDIFF(SECOND, c.startTime, c.endTime) / 60)), 0) AS minutes_count,
    DATE_FORMAT(c.startTime, '%m') AS month
    FROM 
      calls c
    INNER JOIN users u
    ON u.id = c.callerId
    INNER JOIN users co
    ON u.createdBy = co.id
    WHERE
      c.isSocketConnection = 1
    AND
      c.connected = 1
    GROUP BY 
      month,
      u.createdBy
    ORDER BY 
      month;
    `
  );

  return calls;
};

const getDashboardInfo = async (companyId = null) => {
  const [calls] = await sequelize.query(`
  SELECT 
    DATE_FORMAT(startTime, '%m') AS month,
    COALESCE(COUNT(*), 0) AS calls_quantity,
    COALESCE(SUM(CEIL(TIMESTAMPDIFF(SECOND, c.startTime, c.endTime) / 60)), 0) AS minutes_count
  FROM 
    calls c
  WHERE 
    isSocketConnection = 1
  AND
    connected = 1
  GROUP BY 
    month
  ORDER BY 
    month;
  `);

  const [users] = await sequelize.query(`
    SELECT 
      COALESCE(COUNT(users.id), 0) AS users_quantity 
      FROM users
      where userTypeId = 2
    `);

  const [callsQty] = await sequelize.query(
    `
    SELECT COALESCE(COUNT(c.id), 0) AS calls_quantity
    FROM calls c
    INNER JOIN users u 
    ON u.id = c.callerId
    WHERE 
    c.isSocketConnection = 1
    AND 
    c.connected = 1
    AND
    u.createdBy = '${companyId}'
    `
  );

  const [durationInMinutes] = await sequelize.query(`
    SELECT 
    COALESCE(SUM(CEIL(TIMESTAMPDIFF(SECOND, c.startTime, c.endTime) / 60)), 0) AS minutes_count
    FROM calls c
    INNER JOIN users u
    ON u.id = c.callerId
    WHERE 
      c.isSocketConnection = 1
    AND
      c.connected = 1
    AND
    u.createdBy = '${companyId}'
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
  updateUserByUserEmailOrName,
  getAllCalls,
  findAllCallsByUserIdAndType,
  getAllUsers,
  getDashboardInfo,
  getDashboardCSVInfo,
  getAgendaByDateRange,
  getAllUsersNameAndId,
};
