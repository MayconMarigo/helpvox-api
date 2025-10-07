const { callQueries } = require("../database/query/call");

const createCall = async (
  callId,
  callerId,
  receiverId,
  connected,
  startTime,
  endTime,
  videoUrl,
  isAnonymous,
  isSocketConnection,
  callDuration
) => {
  const call = await callQueries.createCall(
    callId,
    callerId,
    receiverId,
    connected,
    startTime,
    endTime,
    videoUrl,
    isAnonymous,
    isSocketConnection,
    callDuration
  );

  return call;
};

exports.CallService = {
  createCall,
};
