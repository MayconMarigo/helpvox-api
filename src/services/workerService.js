const { workerQueries } = require("../database/query/worker");

const getLastTenCallsByWorkerId = async (workerId) => {
  const workerCalls = await workerQueries.getLastTenCallsByWorkerId(workerId);

  return workerCalls;
};

exports.workerService = {
  getLastTenCallsByWorkerId,
};
