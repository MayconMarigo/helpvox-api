const { Call } = require("../../../models");

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
    },
  });

  return created;
};

exports.callQueries = {
  createCall,
};
