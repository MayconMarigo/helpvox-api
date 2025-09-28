const {
  generateTokenByRoomName,
  generateAdminRoomName,
} = require("../services/dailyJsService");

const removeFirstAgentFromQueue = (arr) => arr.shift();

const removeAgentFromQueue = async (agentId, arr) =>
  arr.filter((value) => value.id !== agentId && value.type !== "available");

const addAgentToEndOfQueueAndChangeStatus = (user, arr, socketId) =>
  arr.push({ id: socketId, status: "available", type: "agent", user });

const filterAvailableAgents = (arr) =>
  arr.filter((agent) => agent.status === "available" && agent.type === "agent");

const handleCallAgentBySocketId = (
  socket,
  agentId,
  agentUserId,
  companyId,
  companyUserId,
  room,
  agentToken,
  companyToken,
  companyName
) =>
  socket.to(agentId).emit("incomingCall", {
    company: {
      socketId: companyId,
      userId: companyUserId,
      token: companyToken,
      name: companyName || "Anônimo",
    },
    agent: {
      socketId: agentId,
      userId: agentUserId,
      token: agentToken,
    },
    room,
  });

const modifyAgentStatusByType = (agents, agentIdToModify, status) =>
  agents.map((agent) => {
    if (agent.id === agentIdToModify) {
      return {
        ...agent,
        status,
      };
    }
    return agent;
  });

const handleAddToTheQueue = (
  socket,
  queue,
  isAgent = false,
  isObserver = false,
  position = "end"
) => {
  let user;
  let recordCall;

  try {
    const parsedUser = JSON.parse(socket?.handshake?.query?.user);
    const parsedRecordCall = JSON.parse(
      socket?.handshake?.query?.recordCall || "false"
    );
    user = parsedUser;
    recordCall = parsedRecordCall || false;
  } catch (error) {
    return (user = { name: "Anônimo", id: null });
  }

  const pushObject = {
    id: socket.id,
    status: isAgent ? "available" : null,
    type: isAgent ? "agent" : isObserver ? "observer" : "company",
    user,
    recordCall,
    socket,
  };

  if (position == "end") {
    queue.push(pushObject);
    return;
  }

  queue.unshift(pushObject);
};

const handleAddAgentToQueueByType = async (
  socket,
  agentQueue = null,
  companiesQueue = null
) => {
  const isAgent = socket.handshake.query.type === "agent";
  const isObserver = socket.handshake.query.type === "observer";

  if (isAgent) {
    console.log("Agente Conectado", socket.id);
    handleAddToTheQueue(socket, agentQueue, isAgent);

    return;
  }
  console.log("Company Conectado", socket.id);
  handleAddToTheQueue(socket, companiesQueue, false, isObserver);
};

const sendRetryCall = (socket, message) => {
  socket.to(message.receiverId).emit("callWaitingCompany", message);
};

const handleCheckIfHasCompaniesWaiting = async (
  socket,
  companiesQueue,
  agentsQueue
) => {
  const isAgent = socket.handshake.query.type === "agent";
  if (!isAgent) return companiesQueue;
  console.log("companiesQueue", companiesQueue);

  if (companiesQueue.length == 0) return [];

  // console.log(socket.handshake.query);

  agentsQueue = modifyAgentStatusByType(agentsQueue, socket.id, "busy");

  const agent = socket;
  const agentUser = JSON.parse(socket?.handshake?.query?.user);
  console.log("agentUser", agentUser);
  const companyToCall = companiesQueue[0];
  console.log("companyToCall", companyToCall);
  const companyToCallUser = companiesQueue[0].user;
  // console.log(companyToCallUser)
  const randomRoomName = crypto.randomUUID();

  // console.log("agentUserName", agentUser);
  // console.log("companyUserName", companyUser);
  console.log("randomRoomName", randomRoomName);

  const companyToken = await generateTokenByRoomName(
    randomRoomName,
    companyToCallUser,
    true
  );

  // console.log("companyToken", companyToken);

  // const room = await generateAdminRoomName(randomRoomName, companyToken);
  const room = crypto.randomUUID();

  // console.log("room", room);

  const agentToken = await generateTokenByRoomName(randomRoomName, agentUser);

  // console.log("agent.id", agent.id);
  // console.log("agentUser.id", agentUser.id);
  // console.log("companyToCall.id", companyToCall.id);
  // console.log("companyToCallUser.id", companyToCallUser.id);
  // console.log("room", room);
  // console.log("agentToken", agentToken);

  handleCallAgentBySocketId(
    companyToCall.socket,
    agent.id,
    agentUser.id,
    companyToCall.id,
    companyToCallUser.id,
    { name: room },
    agentToken
  );

  sendRetryCall(companyToCall.socket, { name: room, companyToken });
  // sendRetryCall(companyToCall.socket, { name: room.name, companyToken });

  companiesQueue = removeAgentFromQueue(companyToCall.id, companiesQueue);
  console.log(companiesQueue);

  return companiesQueue;
};

const handleSendRedirectResponse = (socket, destinyId, content) => {
  socket.to(destinyId).emit("redirectToRoom", content);
  // const handleSendRoomIdToSocket = (socket, destinyId, status) => {
  //   socket.to(destinyId).emit("redirectToRoom", { ok: status });
};

const findCompanyCaller = (companies, socketId) =>
  companies.find((agent) => agent.type === "company" && agent.id == socketId);

const findAgentCaller = (agents, socketId) =>
  agents.find((agent) => agent.type === "agent" && agent.id == socketId);

const getCompanyPositionOnQueue = (companyId, companies) => {
  if (companies.length == 0 || !companyId) return;

  const index = companies.map((company) => company.id).indexOf(companyId);

  return index + 1;
};

const sendUpdateCompaniesQueueStatus = (socket, companies) =>
  companies.forEach((company, index) => {
    socket.to(company.id).emit("getPositionOnQueue", index + 1);
  });

module.exports = {
  handleSendRedirectResponse,
  getCompanyPositionOnQueue,
  sendUpdateCompaniesQueueStatus,
  findAgentCaller,
  handleAddToTheQueue,
  //
  removeFirstAgentFromQueue,
  addAgentToEndOfQueueAndChangeStatus,
  filterAvailableAgents,
  handleCallAgentBySocketId,
  modifyAgentStatusByType,
  handleAddAgentToQueueByType,
  removeAgentFromQueue,
  findCompanyCaller,
  handleCheckIfHasCompaniesWaiting,
};
