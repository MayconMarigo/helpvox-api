const { userQueries } = require("../database/query/user");
const { isAdmin } = require("../middlewares/admin");
const { isAuthenticated } = require("../middlewares/authenticated");
const { isCredential } = require("../middlewares/credential");
const { adminService } = require("../services/adminService");
const { agendaService } = require("../services/agendaService");
const { CallService } = require("../services/callService");
const { credentialsService } = require("../services/credentialsService");
const { generateMeetingInformation } = require("../services/dailyJsService");
const { RatingService } = require("../services/ratingService");
const { TokenService } = require("../services/tokenService");
const { UserService } = require("../services/userService");
const { CryptoUtils } = require("../utils/encryption");
const {
  extractCodeAndMessageFromError,
  formatErrorFieldsMessageFromDatabase,
} = require("../utils/error");
const { ValidationUtils } = require("../utils/validations");

exports.routesProvider = (app) => {
  // Rotas GET
  app.get("/api/admin/reports/:userId", isAdmin, async (req, res) => {
    try {
      ValidationUtils.checkRequiredValues(
        ["userId", "startDate", "endDate", "type"],
        [...Object.keys(req.params), ...Object.keys(req.query)]
      );

      ValidationUtils.checkTransformedValues({ ...req.query, ...req.params });

      const { startDate, endDate, type } = req.query;
      const { userId } = req.params;

      const reports = await adminService.findAllCallsByUserIdAndType(
        userId,
        startDate,
        endDate,
        type
      );

      res.status(200).send(reports);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get("/api/admin/users/get-all", isAdmin, async (req, res) => {
    try {
      const users = await adminService.getAllUsers();

      res.status(200).send(users);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get("/api/admin/users/list", isAdmin, async (req, res) => {
    try {
      const users = await adminService.getAllUsersNameAndId();

      res.status(200).send(users);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get("/api/admin/calls/get-all", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      ValidationUtils.checkTransformedValues(req.query);

      const calls = await adminService.getAllCalls(startDate, endDate);

      res.status(200).send(calls);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get("/api/admin/dashboards", isAdmin, async (req, res) => {
    try {
      const info = await adminService.getDashboardInfo();

      res.status(200).send(info);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get("/api/admin/schedule/:userId/get-all", isAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const { userId } = req.params;

      ValidationUtils.checkRequiredValues(
        ["userId", "startDate", "endDate"],
        [...Object.keys(req.params), ...Object.keys(req.query)]
      );

      ValidationUtils.checkTransformedValues({ ...req.query, ...req.params });

      const agenda = await adminService.getAgendaByDateRange(
        startDate,
        endDate,
        userId
      );

      res.status(200).send(agenda);
    } catch (error) {
      console.log(error);
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  // ROTAS <> ADMIN

  app.get(
    "/api/calls/:companyId/get-all",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const { startDate, endDate } = req.query;

        ValidationUtils.checkTransformedValues(req.query);

        const calls = await UserService.getAllCallsByCompanyId(
          startDate,
          endDate,
          companyId
        );

        res.status(200).send(calls);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get(
    "/api/:companyId/users/get-all",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;

        ValidationUtils.checkRequiredValues(
          ["companyId"],
          [...Object.keys(req.params)]
        );

        ValidationUtils.checkTransformedValues({ ...req.params });
        const users = await UserService.getAllUsersByCompanyId(companyId);

        res.status(200).send(users);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get("/api/dashboards/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;

      ValidationUtils.checkRequiredValues(["userId"], Object.keys(req.params));

      const info = await UserService.getDashboardInfo(userId);

      res.status(200).send(info);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get(
    "/api/credentials/:companyId/list",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;

        ValidationUtils.checkRequiredValues(
          ["companyId"],
          Object.keys(req.params)
        );

        const credentials = await UserService.getAllCredentialsByUserId(
          companyId
        );

        res.status(200).send(credentials);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get(
    "/api/schedule/:userId/get-all",
    isAuthenticated,
    async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        const { userId } = req.params;

        ValidationUtils.checkRequiredValues(
          ["userId", "startDate"],
          [...Object.keys(req.params), ...Object.keys(req.query)]
        );

        ValidationUtils.checkTransformedValues({ ...req.query, ...req.params });

        const agenda = await UserService.getAgendaByDateRange(
          startDate,
          endDate,
          userId
        );

        res.status(200).send(agenda);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get(
    "/api/scheduled/:userId/get-all",
    isAuthenticated,
    async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        const { userId } = req.params;

        ValidationUtils.checkRequiredValues(
          ["userId", "startDate"],
          [...Object.keys(req.params), ...Object.keys(req.query)]
        );

        ValidationUtils.checkTransformedValues({ ...req.query, ...req.params });

        const agenda = await UserService.getScheduledAgendaByDateRange(
          startDate,
          endDate,
          userId
        );

        res.status(200).send(agenda);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get("/api/calls/:userId/get-all", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const { userId } = req.params;

      ValidationUtils.checkRequiredValues(
        ["userId", "startDate", "endDate"],
        [...Object.keys(req.params), ...Object.keys(req.query)]
      );

      ValidationUtils.checkTransformedValues({ ...req.query, ...req.params });

      const calls = await UserService.getAllCallsByUserId(
        startDate,
        endDate,
        userId
      );

      res.status(200).send(calls);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  // ROTAS PUT

  app.put("/api/admin/user/update", isAdmin, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      ValidationUtils.checkRequiredValues(
        ["name", "email", "password", "status"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      await adminService.updateUserByUserEmail(decodedBody);

      res.status(204).send();
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);

      res.status(code).send({ message });
    }
  });

  app.put("/api/agenda/:agendaId/delete", isAuthenticated, async (req, res) => {
    try {
      const { agendaId } = req.params;
      await UserService.deleteAgendaById(agendaId);

      res.status(204).send();
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);

      res.status(code).send({ message });
    }
  });

  app.put("/api/enterprise/user/update", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      ValidationUtils.checkRequiredValues(
        ["name", "email", "password", "status"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      await UserService.updateUserByUserEmail(decodedBody);

      res.status(204).send();
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);

      res.status(code).send({ message });
    }
  });

  app.put(
    "/api/enterprise/credential/update",
    isAuthenticated,
    async (req, res) => {
      try {
        ValidationUtils.checkRequiredValues(
          ["credential", "status"],
          Object.keys(req.body)
        );
        const { credential, status } = req.body;

        await UserService.updateCredentialByUserId(credential, status);

        res.status(201).send();
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);

        res.status(code).send({ message });
      }
    }
  );

  app.get("/api/users/:companyId/list", isAuthenticated, async (req, res) => {
    try {
      const { companyId } = req.params;

      ValidationUtils.checkRequiredValues(
        ["companyId"],
        [Object.keys(req.params)]
      );

      const users = await UserService.getAllUsersNameAndId(companyId);

      res.status(200).send(users);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post(
    "/api/credentials/:companyId/create",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;

        ValidationUtils.checkRequiredValues(
          ["companyId"],
          [...Object.keys(req.params)]
        );

        await UserService.createCredential(companyId);

        res.status(201).send();
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.post(
    "/api/agenda/:companyId/associate/:associateId",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId, associateId } = req.params;
        const { agendaId, finalDateTime } = req.body;

        ValidationUtils.checkRequiredValues(
          ["companyId", "associateId", "agendaId", "finalDateTime"],
          [...Object.keys(req.params), ...Object.keys(req.body)]
        );

        await UserService.associateCompanyToUserAgenda(
          companyId,
          associateId,
          agendaId,
          finalDateTime
        );

        res.status(201).send();
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.post("/api/schedule/:agendaId", isAuthenticated, async (req, res) => {
    try {
      const { agendaId } = req.params;
      const { companyId } = req.body;

      ValidationUtils.checkRequiredValues(
        ["agendaId", "companyId"],
        [Object.keys(...req.body), ...Object.keys(req.params)]
      );

      ValidationUtils.checkTransformedValues({ ...req.body, ...req.params });

      await agendaService.associateUserAgendaToCompany(agendaId, companyId);

      res.status(204).send();
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  // Rotas POST

  app.post("/api/call/end", async (req, res) => {
    if (req.body.test) return res.status(200).send();
    const { meeting_id, room } = req.body.payload;

    if (!meeting_id) return res.status(404).send({ ok: false });

    try {
      const meetingInfo = await generateMeetingInformation(meeting_id);

      console.log("meetingInfo", meetingInfo);

      const user01Info = meetingInfo.data[0];
      const user02Info = meetingInfo.data[1];

      let user01;
      if (user01Info.user_id == null) {
        user01 = "4";
      } else {
        user01 = "3";
      }
      console.log("user01", user01);

      let user02;
      if (user02Info.user_id == null) {
        user02 = "4";
      } else {
        user02 = "3";
      }
      console.log("user02", user02);

      const callerId = user01 == "2" ? user01Info.user_id : user02Info.user_id;
      console.log("callerId", callerId);
      const receiverId =
        user01 == "3" ? user01Info.user_id : user02Info.user_id;
      console.log("receiverId", receiverId);

      const getInitialTime = (userJoinTime) => new Date(userJoinTime * 1000);
      const getFinalTime = (userJoinTime, duration) =>
        new Date(userJoinTime * 1000 + duration * 1000);

      const isAnonymous =
        user01Info.user_id === null || user02Info.user_id === null;
      console.log("isAnonymous", isAnonymous);

      await CallService.createCall(
        room,
        callerId,
        receiverId,
        1,
        getInitialTime(user01Info.join_time),
        getFinalTime(user01Info.join_time, user01Info.duration),
        null,
        isAnonymous
      );

      return res.status(200).send({ ok: true });
    } catch (error) {
      res.status(400).send({ message: "Error." });
    }
  });

  app.post("/api/verify-token", async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      ValidationUtils.checkRequiredValues(["token"], Object.keys(decodedBody));
      ValidationUtils.checkTransformedValues(decodedBody);

      const { token } = decodedBody;

      const decodedUser = await TokenService.verifyEncodedToken(token, [
        "type",
        "id",
      ]);

      res.status(200).send(decodedUser);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      const formattedErrorMessage = formatErrorFieldsMessageFromDatabase(error);

      res.status(code).send(`${message} ${formattedErrorMessage}`);
    }
  });

  app.post("/api/admin/reports", isAdmin, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      ValidationUtils.checkRequiredValues(
        ["startDate", "endDate"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      const { startDate, endDate } = decodedBody;

      const reports = await adminService.findAllCalls(startDate, endDate);

      res.status(200).send(reports);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/admin/user/create", isAdmin, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      console.log(decodedBody);
      ValidationUtils.checkRequiredValues(
        ["name", "email", "password", "userTypeId"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      const created = await adminService.createUser(decodedBody);
      res.status(201).send({ created });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/:companyId/user/create", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      console.log(decodedBody);

      const { companyId } = req.params;

      ValidationUtils.checkRequiredValues(
        ["name", "email", "password", "userTypeId"],
        Object.keys(decodedBody)
      );

      const clone = JSON.parse(JSON.stringify(decodedBody));
      delete clone.logoImage;

      ValidationUtils.checkTransformedValues(clone);

      const created = await UserService.createUser(decodedBody, companyId);
      res.status(201).send({ created });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/rating/create", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      ValidationUtils.checkRequiredValues(
        ["callId", "rating"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      const { callId, rating } = decodedBody;

      const created = await RatingService.createRating(callId, rating);

      res.status(201).send({ created });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/call/create", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      ValidationUtils.checkRequiredValues(
        [
          "callId",
          "callerId",
          "receiverId",
          "connected",
          "startTime",
          "endTime",
        ],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      const { callId, callerId, receiverId, connected, startTime, endTime } =
        decodedBody;

      const created = await CallService.createCall(
        callId,
        callerId,
        receiverId,
        connected,
        startTime,
        endTime,
        decodedBody?.videoUrl ?? null,
        decodedBody?.isAnonymous ?? false
      );

      res.status(201).send({ created });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/auth", async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      ValidationUtils.checkRequiredValues(
        ["email", "password"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      const { email, password, encryptedPassword } = decodedBody;

      const user = await UserService.getUserByEmailAndPassword(email, password);
      const token = TokenService.createEncodedToken({
        ...user,
        encryptedPassword,
      });

      return res.status(200).send({ token: token });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);

      res.status(code).send({ message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      ValidationUtils.checkRequiredValues(["token"], Object.keys(decodedBody));
      ValidationUtils.checkTransformedValues(decodedBody);

      const { token } = decodedBody;

      const user = await TokenService.verifyEncodedToken(token);

      const otpAuthUrl = await UserService.generateOTPAuthUrl(user.secret2fa);
      const qrcodeData = await UserService.generateTotpQrCode(otpAuthUrl);

      return res
        .status(200)
        .send({ secret: user.secret2fa, qrCode: qrcodeData });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/user-data", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      ValidationUtils.checkRequiredValues(["token"], Object.keys(decodedBody));
      ValidationUtils.checkTransformedValues(decodedBody);

      const { token } = decodedBody;

      const data = await UserService.getUserDataByToken(token);

      return res.status(200).send(data);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      const formattedErrorMessage = formatErrorFieldsMessageFromDatabase(error);

      res.status(code).send({ message: `${message} ${formattedErrorMessage}` });
    }
  });

  app.post("/api/verify-2fa", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      const { code, secret2fa } = decodedBody;

      ValidationUtils.checkRequiredValues(
        ["code", "secret2fa"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      await UserService.verifyTwoFactorAuthenticationCode(secret2fa, code);

      return res.status(200).send({ success: true });
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      const formattedErrorMessage = formatErrorFieldsMessageFromDatabase(error);

      res.status(code).send({ message: `${message} ${formattedErrorMessage}` });
    }
  });

  app.post("/api/agenda/create", isAuthenticated, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      const { callId, callerId, receiverId, videoUrl, scheduledDateTime } =
        decodedBody;

      ValidationUtils.checkRequiredValues(
        ["callId", "callerId", "receiverId", "videoUrl", "scheduledDateTime"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      await agendaService.createAgenda(
        callId,
        callerId,
        receiverId,
        videoUrl,
        scheduledDateTime
      );

      res.status(204).send();
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/agenda/:userId", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const { userId } = req.params;

      ValidationUtils.checkRequiredValues(
        ["userId", "startDate", "endDate", "videoUrl", "scheduledDateTime"],
        [...Object.keys(req.params), ...Object.keys(req.query)]
      );
      ValidationUtils.checkTransformedValues({ ...req.query, ...req.params });

      await agendaService.findAgendaByUserId(userId, startDate, endDate);

      res.status(204).send();
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post(
    "/api/schedule/:userId/create",
    isAuthenticated,
    async (req, res) => {
      try {
        const { multiple } = req.query;
        const { userId } = req.params;
        const { timeRange, date } = req.body;

        ValidationUtils.checkRequiredValues(
          ["userId", "timeRange", "date"],
          [...Object.keys(req.body), ...Object.keys(req.params)]
        );

        ValidationUtils.checkTransformedValues({ ...req.body, ...req.params });

        await agendaService.insertAgendaByDate(
          userId,
          timeRange,
          date,
          multiple
        );

        res.status(204).send();
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.post("/api/user/credentials/create", isCredential, async (req, res) => {
    try {
      const { name, email, phone, credential } = req.body;

      ValidationUtils.checkRequiredValues(
        ["name", "email", "phone", "credential"],
        [...Object.keys(req.body)]
      );

      const created = await credentialsService.createUserWithCredential(
        name,
        email,
        phone,
        credential
      );

      res.status(200).send(created);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post("/api/user/credentials/delete", isCredential, async (req, res) => {
    try {
      const { userId, credential } = req.body;

      ValidationUtils.checkRequiredValues(
        ["userId", "credential"],
        [...Object.keys(req.body)]
      );

      const deleted = await credentialsService.deleteUserWithCredential(
        credential,
        userId
      );

      res.status(200).send(deleted);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post(
    "/api/credentials/schedule/get-all",
    isCredential,
    async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        const credential = req.body?.credential || null;

        if (!credential)
          throw new Error("Credencial não encontrada no corpo requisição.");

        ValidationUtils.checkRequiredValues(
          ["startDate", "endDate"],
          ["userId", ...Object.keys(req.query)]
        );

        const agenda = await credentialsService.getUserAgendaWithCredential(
          startDate,
          endDate,
          credential
        );

        res.status(200).send(agenda);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.post("/api/credentials/users/get-all", isCredential, async (req, res) => {
    try {
      const credential = req.body?.credential || null;

      if (!credential)
        throw new Error("Credencial não encontrada no corpo requisição.");

      ValidationUtils.checkRequiredValues(["credential"], ["credential"]);

      const users = await credentialsService.getUsersListWithCredential(
        credential
      );

      res.status(200).send(users);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.post(
    "/api/credentials/agenda/:agendaId/update",
    isCredential,
    async (req, res) => {
      try {
        const credential = req.body?.credential || null;
        const userId = req.body?.userId || null;
        const { agendaId } = req.params;

        if (!credential)
          throw new Error("Credencial não encontrada no corpo requisição.");

        if (!userId)
          throw new Error("Id de usuário não encontrada no corpo requisição.");

        ValidationUtils.checkRequiredValues(
          ["credential", "agendaId", "userId"],
          ["credential", "userId", ...Object.keys(req.params)]
        );

        const updated = await credentialsService.associateAgendaToUser(
          credential,
          agendaId,
          userId
        );

        res.status(200).send(updated);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );
};
