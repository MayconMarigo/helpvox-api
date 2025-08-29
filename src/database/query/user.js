const { literal } = require("sequelize");
const { User, UserType, Call, Credential, Agenda } = require("../../../models");
const Crypto = require("crypto");
const { dateUtils } = require("../../utils/date");
const { userUtils } = require("../../utils/user");
const { sequelize } = require("../database");
const { generateAdminRoomName } = require("../../services/dailyJsService");
const { CryptoUtils } = require("../../utils/encryption");
const { ERROR_MESSAGES } = require("../../utils/constants");

const findAdminUserByEmail = async (email) => {
  const data = await User.findOne({
    where: {
      email,
      status: 1,
    },
    include: {
      model: UserType,
      required: true,
      attributes: ["type"],
    },
    attributes: [],
  });

  if (!data) return null;

  const { type } = data?.user_type;

  return type == "admin";
};

const findUserByEmailAndPassword = async (email, password) => {
  const data = await User.findOne({
    where: { email, password, status: 1 },
    attributes: ["id", "name", "email", "secret2fa", "userTypeId"],
  });

  if (!data) return null;

  const { dataValues } = data;

  const user = {
    ...dataValues,
    type: userUtils.checkUserType(dataValues.userTypeId),
  };

  return user;
};

const findUserById = async (userId) => {
  const data = await User.findOne({
    where: { id: userId, status: 1 },
    attributes: ["password"],
  });

  if (!data) return null;

  const { password } = data?.dataValues;

  return password;
};

const getUserDataById = async (userId) => {
  const data = await User.findOne({
    where: { id: userId, status: 1 },
    attributes: [
      "id",
      "name",
      "email",
      "phone",
      "logoImage",
      "colorScheme",
      "userTypeId",
      "createdBy",
    ],
    include: {
      model: UserType,
      required: true,
      attributes: ["type"],
    },
  });

  if (!data) return null;

  const { type } = data?.user_type;

  const { dataValues } = data;

  dataValues.type = type;
  delete dataValues.user_type;

  if (dataValues.userTypeId == "4") {
    const [createdByData] = await sequelize.query(
      `
        SELECT 
        u.logoImage
        FROM users u
        where u.id = '${dataValues.createdBy}'
      `
    );

    const logoImage = createdByData[0]?.logoImage;

    dataValues.logoImage = logoImage;
  }

  if (dataValues.logoImage) {
    const base64Image = dataValues.logoImage.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    dataValues.logoImage = dataUrl;
  }

  delete dataValues.createdBy;

  return dataValues;
};

const findUserTypeById = async (userId) => {
  const data = await User.findOne({
    where: { id: userId, status: 1 },
    attributes: ["userTypeId"],
  });

  if (!data) return null;

  const { userTypeId } = data?.dataValues;

  return userTypeId;
};

const getAgendaByDateRange = async (startDate, finalDate, userId) => {
  const endDate =
    finalDate || dateUtils.addDaysFromNewDate(5, new Date(startDate));
  const [agendas] = await sequelize.query(
    `
      SELECT
        DATE_FORMAT(scheduledDateTime, '%d-%m-%Y') as date,
        DATE_FORMAT(scheduledDateTime, '%H:%i') as startTime, 
        DATE_FORMAT(DATE_ADD(scheduledDateTime, INTERVAL 30 MINUTE), '%H:%i') AS endTime,
        caller.name as applicant,  
        receiver.name as requested,
        receiver.id as associateId,
        a.id as agendaId,
        a.callUrl
      FROM agendas a
      LEFT JOIN users caller ON a.callerId = caller.id
      INNER JOIN users receiver ON a.receiverId = receiver.id
      WHERE 
      (a.scheduledDateTime BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59')
      AND
      (a.receiverId = '${userId}')
      AND
      (a.callUrl IS NULL)
      AND
      (a.status = 1)
      ORDER BY
      a.scheduledDateTime asc
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

const getDashboardInfo = async (userId) => {
  const [calls] = await sequelize.query(`
    SELECT 
      DATE_FORMAT(c.startTime, '%m') AS month,
      COUNT(*) AS calls_quantity
    FROM 
      calls c
    JOIN 
      users u ON c.receiverId = u.id
    WHERE 
      u.createdBy = '${userId}'
    GROUP BY 
      month
    ORDER BY 
      month;
  `);

  const [callsQty] = await sequelize.query(`
    SELECT 
      COUNT(c.id) AS calls_quantity 
      FROM calls c
      INNER JOIN users u
      ON 
      c.receiverId = u.id
      WHERE
        u.createdBy = '${userId}'
    `);

  const [durationInMinutes] = await sequelize.query(`
    SELECT 
      SUM(TIMESTAMPDIFF(MINUTE, c.startTime, c.endTime)) 
      AS minutes_count from calls c
      INNER JOIN users u
      ON 
      c.receiverId = u.id
      WHERE
        u.createdBy = '${userId}'
    `);

  const { calls_quantity } = callsQty[0];
  const { minutes_count } = durationInMinutes[0];

  return {
    calls,
    calls_quantity,
    minutes_count,
  };
};

const getAllCallsByUserId = async (startDate, endDate, userId) => {
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
    WHERE 
    (c.startTime BETWEEN '${initDate} 00:00:00' AND '${finalDate} 23:59:59')
    AND
    c.receiverId = '${userId}'
    `);

  return reports;
};

const getAllUsersByNameAndId = async (companyId) => {
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

const getAllCredentialsByUserId = async (companyId) => {
  const credentials = await Credential.findAll({
    where: { userId: companyId },
  });

  if (!credentials) return [];

  const data = credentials.map((credential) => {
    if (credential.userTypeId)
      credential.userTypeId = userUtils.checkUserType(credential.userTypeId);

    if (credential.status == 1) credential.status = "Ativo";

    if (credential.status == 0) credential.status = "Inativo";

    return { credential: credential.id, status: credential.status };
  });

  return data;
};

const createCredential = async (companyId) => {
  const [created] = await Credential.findOrCreate({
    where: {
      id: crypto.randomUUID(),
    },
    defaults: {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: companyId,
      status: 1,
    },
  });

  return created;
};

const associateCompanyToUserAgenda = async (
  companyId,
  associateId,
  agendaId,
  finalDateTime
) => {
  const roomName = crypto.randomUUID();
  const dateIsLowerThanNow = (dateToCompare) =>
    new Date(dateToCompare) < new Date();

  if (dateIsLowerThanNow(finalDateTime))
    throw new Error(JSON.stringify(ERROR_MESSAGES.DATE_LOWER_THAN_NOW));
  const room = await generateAdminRoomName(roomName, finalDateTime);
  const updated = await sequelize.query(
    `
        UPDATE agendas a
        SET
        a.callerId = '${companyId}',
        a.callId = '${room.id}',
        a.callUrl = '${room.name}'
        WHERE
        a.id = '${agendaId}'
      `
  );

  return updated;
};

const getAllUsersByCompanyId = async (companyId) => {
  const data = await User.findAll({
    where: { createdBy: companyId, userTypeId: 4 },
    attributes: [
      "id",
      "name",
      "email",
      "phone",
      "status",
      [literal("document"), "cpf"],
    ],
  });

  if (data.length == 0 || !data) return [];

  const users = data.map((user) => {
    if (user.userTypeId)
      user.userTypeId = userUtils.checkUserType(user.userTypeId);

    if (user.status == 1) user.status = "Ativo";

    if (user.status == 0) user.status = "Inativo";

    return user;
  });

  return users;
};

const createUser = async (payload, companyId) => {
  const {
    name,
    email,
    phone,
    password = "",
    userTypeId,
    document,
    speciality = null,
  } = payload;

  const checkIfUserIsWorker = (type) => type == 4;

  if (!checkIfUserIsWorker(userTypeId))
    throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

  const findCompanyColorAndLogo = await User.findOne({
    where: { id: companyId },
    attributes: ["logoImage", "colorScheme"],
  });

  const { dataValues } = findCompanyColorAndLogo;

  const colorSchemeFromCompany = dataValues.colorScheme;
  const logoImageFromCompany = dataValues.logoImage;

  const secret2fa = CryptoUtils.generateBase32Hash();
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      id: Crypto.randomUUID(),
      name,
      email,
      phone,
      password,
      logoImage: logoImageFromCompany,
      colorScheme: colorSchemeFromCompany,
      status: 1,
      userTypeId,
      secret2fa,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: companyId,
      document,
      speciality,
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

const updateCredentialByUserId = async (credential, status) => {
  const updated = await Credential.update(
    { status: status },
    { where: { id: credential } }
  );

  return updated;
};

const getScheduledAgendaByDateRange = async (startDate, finalDate, userId) => {
  const endDate =
    finalDate || dateUtils.addDaysFromNewDate(5, new Date(startDate));

  const [agendas] = await sequelize.query(
    `
      SELECT
        DATE_FORMAT(scheduledDateTime, '%Y-%m-%d') as date,
        DATE_FORMAT(scheduledDateTime, '%H:%i') as startTime, 
        DATE_FORMAT(DATE_ADD(scheduledDateTime, INTERVAL 30 MINUTE), '%H:%i') AS endTime,
        caller.name as applicant,  
        receiver.name as requested,
        receiver.id as associateId,
        a.id as agendaId,
        a.callUrl
      FROM agendas a
      LEFT JOIN users caller ON a.callerId = caller.id
      INNER JOIN users receiver ON a.receiverId = receiver.id
      WHERE 
      (a.scheduledDateTime BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59')
      AND
      (a.receiverId = '${userId}')
      AND
      (a.callUrl IS NOT NULL)
      AND
      (a.status = 1)
      ORDER BY
      a.scheduledDateTime asc
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

const getAllCallsByCompanyId = async (startDate, endDate, companyId) => {
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

  const [calls] = await sequelize.query(
    `
      SELECT
        COALESCE(caller.name, "Anônimo") AS callerName,
        receiver.name AS receiverName,
        receiver.speciality,
        c.startTime
      FROM calls c
      LEFT JOIN users caller ON c.callerId = caller.id
      INNER JOIN users receiver ON c.receiverId = receiver.id
      WHERE 
        (c.startTime BETWEEN '${initDate} 00:00:00' AND '${finalDate} 23:59:59')
      AND
      caller.createdBy = '${companyId}'
          `
  );

  return calls;
};

const deleteAgendaById = async (agendaId) => {
  const deleted = await Agenda.update(
    { status: 0 },
    { where: { id: agendaId } }
  );

  return deleted;
};

const bulkCreateUsers = async (decodedBody, companyId) => {
  const usersList = decodedBody.map((user) => {
    return {
      ...user,
      password: "",
      logoImage: null,
      colorScheme: null,
      status: Number(user.status) || 1,
      userTypeId: 4,
      secret2fa: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: companyId,
      speciality: null,
    };
  });

  const created = await User.bulkCreate(usersList);
  return created;
};

const getUserByEmailAndCredential = async (email, credential) => {
  const data = await User.findOne({
    where: { email, status: 1, userTypeId: 4 },
    attributes: ["id", "name", "email", "userTypeId"],
  });

  if (!data) throw new Error(JSON.stringify(ERROR_MESSAGES.USER.NOT_FOUND));

  const { dataValues } = data;

  const [findUsersAllowedList] = await sequelize.query(`
    SELECT DISTINCT(u.id) FROM credentials c
    INNER JOIN users u
    ON
    c.userId = u.createdBy
    where c.id = '${credential}'
    `);

  const allowed = !!findUsersAllowedList.find(
    (user) => user.id == dataValues.id
  );

  if (!allowed) throw new Error(JSON.stringify(ERROR_MESSAGES.UNAUTHORIZED));

  const [createdByData] = await sequelize.query(
    `
      SELECT 
      u.logoImage
      FROM users u 
      INNER JOIN credentials c 
      ON c.userId = u.id 
      WHERE c.id = '${credential}'
    `
  );

  // const logoImage = createdByData[0]?.logoImage;

  const user = {
    ...dataValues,
    type: userUtils.checkUserType(dataValues.userTypeId),
    // logoImage,
  };

  return user;
};

const bulkDeleteUsers = async (companyId) => {
  const deleted = await sequelize.query(
    `
      DELETE FROM users
      WHERE
      userTypeId = 4
      AND
      createdBy = '${companyId}'
    `
  );

  return deleted;
};

const getUserTypeIdById = async (userId) => {
  const [data] = await sequelize.query(
    `
      SELECT userTypeId from users
      WHERE id = '${userId}'
    `
  );
  const { userTypeId } = data[0];
  return userTypeId;
};

exports.userQueries = {
  findAdminUserByEmail,
  findUserByEmailAndPassword,
  findUserById,
  getUserDataById,
  findUserTypeById,
  getAgendaByDateRange,
  getDashboardInfo,
  getAllCallsByUserId,
  getAllUsersByNameAndId,
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
  bulkCreateUsers,
  getUserByEmailAndCredential,
  bulkDeleteUsers,
  getUserTypeIdById,
};
