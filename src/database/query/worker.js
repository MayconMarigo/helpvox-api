const { sequelize } = require("../database");

const getLastTenCallsByWorkerId = async (workerId) => {
  const [workerCalls] = await sequelize.query(`
      SELECT 
      DATE_FORMAT(DATE_SUB(c.startTime, INTERVAL 3 HOUR), '%d/%m/%Y %H:%i') AS startTime,
      TIME_FORMAT(SEC_TO_TIME(GREATEST(CEIL(TIMESTAMPDIFF(SECOND, c.startTime, c.endTime) / 60), 1) * 60), '%i') AS callDuration,
      c.callId
      FROM calls c
      WHERE
      c.callerId = '${workerId}'
      LIMIT 10
    `);

  return workerCalls;
};
exports.workerQueries = { getLastTenCallsByWorkerId };
