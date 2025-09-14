const { Call } = require("../../../models");
const { sequelize } = require("../database");

const createCall = async (
  callId,
  callerId,
  receiverId,
  connected,
  startTime,
  endTime,
  videoUrl,
  isAnonymous,
  isSocketConnection
) => {
  const [findCreatedBy] = await sequelize.query(
    `
      SELECT createdBy from users
      WHERE
      id = '${callerId}'
    `
  );

  const { createdBy } = findCreatedBy[0];

  const [call, created] = await Call.findOrCreate({
    where: { callId },
    defaults: {
      callId,
      callerId,
      receiverId,
      connected,
      startTime,
      endTime,
      videoUrl,
      isAnonymous,
      isSocketConnection,
      createdBy: createdBy,
    },
  });

  return created;
};

exports.callQueries = {
  createCall,
};
