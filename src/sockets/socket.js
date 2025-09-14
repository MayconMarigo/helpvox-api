const {
  addAgentToEndOfQueueAndChangeStatus,
  filterAvailableAgents,
  handleCallAgentBySocketId,
  modifyAgentStatusByType,
  handleAddAgentToQueueByType,
  removeAgentFromQueue,
  handleSendRedirectResponse,
  findCompanyCaller,
  getCompanyPositionOnQueue,
  sendUpdateCompaniesQueueStatus,
  findAgentCaller,
  handleAddToTheQueue,
} = require("../utils/socket");

const {
  generateTokenByRoomName,
  generateAdminRoomName,
} = require("../services/dailyJsService");

const { CallService } = require("../services/callService");

exports.socketProvider = function (io) {
  let agents = [];
  let companies = [];
  let companiesOnHold = [];
  io.on("connection", async (socket) => {
    handleAddAgentToQueueByType(socket, agents, companies);

    socket.on("checkCompaniesOnHold", async () => {
      if (companiesOnHold.length == 0) return;

      agents = modifyAgentStatusByType(agents, socket.id, "busy");

      const agent = socket;
      const agentUser = JSON.parse(socket?.handshake?.query?.user);
      const companyToCall = companiesOnHold[0];
      const companyToCallUser = companiesOnHold[0].user;
      const randomRoomName = crypto.randomUUID();

      const companyToken = await generateTokenByRoomName(
        randomRoomName,
        companyToCallUser,
        true
      );

      // console.log(companyToCall);
      const room = await generateAdminRoomName(randomRoomName, companyToken);
      // const room = crypto.randomUUID();

      const agentToken = await generateTokenByRoomName(
        randomRoomName,
        agentUser
      );

      handleCallAgentBySocketId(
        companyToCall.socket,
        agent.id,
        agentUser.id,
        companyToCall.id,
        companyToCallUser.id,
        room,
        agentToken,
        companyToken,
        companyToCall.user.name
      );

      companiesOnHold = await removeAgentFromQueue(
        companyToCall.id,
        companiesOnHold
      );

      socket.to(companyToCall.id).emit("getPositionOnQueue", 0);

      sendUpdateCompaniesQueueStatus(socket, companiesOnHold);
    });

    socket.on("updatePositionsOnQueue", async (message) => {
      if (companiesOnHold.length == 0) return;

      console.log("updatePositionsOnQueue");
      // console.log(companiesOnHold.map((c) => c.id));
      // const { company } = message;

      sendUpdateCompaniesQueueStatus(socket, companiesOnHold);

      return;
    });

    socket.on("handleAcceptedCall", async (response) => {
      const { company, agent } = response;

      const companyHost = findCompanyCaller(companies, company.socketId);
      const agentHost = findAgentCaller(agents, agent.socketId);

      handleSendRedirectResponse(companyHost.socket, agent.socketId, true);
      handleSendRedirectResponse(agentHost.socket, company.socketId, {
        content: response,
        redirect: true,
      });

      sendUpdateCompaniesQueueStatus(agentHost.socket, companiesOnHold);
    });

    socket.on("handleRejectedCall", async (response) => {
      const { company, agent } = response;
      const {
        agentSocketId,
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        videoUrl,
        isAnonymous,
      } = message;

      await CallService.createCall(
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        videoUrl,
        isAnonymous
      );

      addAgentToEndOfQueueAndChangeStatus(
        {
          id: receiverId,
          name: agent.name,
        },
        agents,
        agentSocketId
      );

      socket.to(company.id).emit("callNotAnswered");
    });

    //
    //
    //
    //

    socket.on("callAvailableAgent", async (callback) => {
      const agentsArray = filterAvailableAgents(agents);
      const agentToCall = agentsArray[0];
      const companyId = socket.id;
      // console.log(agents)
      // console.log("Company ligando", companyId);

      if (agentsArray.length == 0) {
        if (companiesOnHold.find((company) => company.id == socket.id)) return;
        handleAddToTheQueue(socket, companiesOnHold);

        const position = getCompanyPositionOnQueue(companyId, companiesOnHold);

        callback(position);

        return;
      }

      // console.log("Ligando para o agente", agentToCall);
      agents = modifyAgentStatusByType(agents, agentToCall.id, "busy");

      const agentUser = agentToCall.user;
      const company = findCompanyCaller(companies, socket.id);
      const companyUser = company.user;
      const randomRoomName = crypto.randomUUID();

      // console.log("agentUserName", agentUser);
      // console.log("companyUserName", companyUser);
      // console.log("randomRoomName", randomRoomName);

      const companyToken = await generateTokenByRoomName(
        randomRoomName,
        companyUser,
        true
      );

      // console.log("companyToken", companyToken);

      const room = await generateAdminRoomName(randomRoomName, companyToken);

      // console.log("room", room);

      const token = await generateTokenByRoomName(randomRoomName, agentUser);

      // console.log("agentToken", token);
      // console.log("agentToCall", agentToCall.socket.id);
      // console.log("socket", socket.id);
      handleCallAgentBySocketId(
        socket,
        agentToCall.id,
        agentToCall.user.id,
        companyId,
        company.user.id,
        room,
        // { name: randomRoomName },
        token,
        companyToken,
        company.user.name
      );

      // return callback({ name: room.name, companyToken });
      // return callback({ name: randomRoomName, companyToken });
    });

    socket.on("registerNotAnsweredCall", async (message) => {
      const {
        agentSocketId,
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        videoUrl,
        isAnonymous,
        companySocketId,
      } = message;

      await CallService.createCall(
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        videoUrl,
        isAnonymous
      );

      // socket.to(companySocketId).emit("getPositionOnQueue", 0);

      // const agent = findAgentCaller(agents, agentSocketId);
      // console.log(agentSocketId);
      // console.log(agents.map((a) => a.id));
      // handleAddToTheQueue(agent.socket, agents, true);
      // addAgentToEndOfQueueAndChangeStatus(
      //   {
      //     id: receiverId,
      //     name: agent.name,
      //   },
      //   agents,
      //   agentSocketId
      // );
    });

    socket.on("handleCallNextAgentAfterFailedCall", async (message) => {
      const agentIdThatNotAnswered = message.agentId;
      const agent = findAgentCaller(agents, agentIdThatNotAnswered);
      agents = await removeAgentFromQueue(agentIdThatNotAnswered, agents);
      handleAddToTheQueue(agent.socket, agents, true);

      socket.to(message.companyId).emit("callNotAnswered");

      return;
    });

    socket.on("registerCallInformation", async (message) => {
      // console.log("registerCallInformation", message);

      const {
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        videoUrl,
        isAnonymous,
      } = message;

      await CallService.createCall(
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        videoUrl,
        isAnonymous
      );
    });

    socket.on("incomingCallResponse", (message) => {
      const { companyId, status } = message;
      handleSendRedirectResponse(socket, companyId);
    });

    socket.on("handleChangeAgentStatusToBusy", (message) => {
      const { id: agentToModify } = message;
      agents = modifyAgentStatusByType(agents, agentToModify, "busy");
    });

    socket.on("handleChangeAgentStatusToAvailable", (message) => {
      const { id: agentToModify } = message;
      agents = modifyAgentStatusByType(agents, agentToModify, "available");
    });

    socket.on("getAvailableAgents", (callback) => {
      const availableAgents = filterAvailableAgents(agents);

      const mapper = availableAgents.map((agent) => {
        return agent.user.name;
      });
      callback(mapper);
    });

    socket.on("handleDisconnectAgent", async () => {
      console.log("Agente disconectado " + socket.id);
      agents = await removeAgentFromQueue(socket.id, agents);
      socket.disconnect();
    });

    socket.on("disconnect", () => {
      agents = agents.filter((agent) => agent.id !== socket.id);
    });
  });
};
