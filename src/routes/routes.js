const { userQueries } = require("../database/query/user");
const { isAdmin } = require("../middlewares/admin");
const { isAuthenticated } = require("../middlewares/authenticated");
const { isCredential } = require("../middlewares/credential");
const { adminService } = require("../services/adminService");
const { agendaService } = require("../services/agendaService");
const { departmentsService } = require("../services/departmentsService");
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

  app.get("/api/admin/users/get-all/:userTypeId", isAdmin, async (req, res) => {
    try {
      const { userTypeId } = req.params;
      const users = await adminService.getAllUsers(userTypeId);

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

  app.get(
    "/api/admin/dashboards/:companyId/get-all",
    isAdmin,
    async (req, res) => {
      try {
        const companyId = req.params.companyId ?? null;
        const info = await adminService.getDashboardInfo(companyId);

        res.status(200).send(info);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get("/api/admin/dashboards/csv", isAdmin, async (req, res) => {
    try {
      const info = await adminService.getDashboardCSVInfo();

      res.status(200).send(info);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.get(
    "/api/:companyId/dashboards/csv",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const info = await UserService.getDashboardCSVInfo(companyId);

        res.status(200).send(info);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

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

  app.get(
    "/api/enterprise/calls/:companyId/get-all",
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

  app.post(
    "/api/enterprise/calls/rating/:callId",
    isAuthenticated,
    async (req, res) => {
      try {
        const { callId } = req.params;

        const { rating } = req.body;

        await RatingService.createRating(callId, rating);

        res.status(200).send({ ok: true });
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.get(
    "/api/departments/:companyId/get-all",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;

        ValidationUtils.checkTransformedValues(req.query);

        const departments =
          await departmentsService.getAllDepartmentsByCompanyId(companyId);

        res.status(200).send(departments);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.post(
    "/api/:companyId/department/create",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;

        const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
          req.body
        );

        ValidationUtils.checkRequiredValues(
          ["departmentName", "departmentCode"],
          Object.keys(decodedBody)
        );
        ValidationUtils.checkTransformedValues(decodedBody);

        await departmentsService.createDepartment(decodedBody, companyId);

        res.status(200).send({ success: true });
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

  app.put("/api/admin/user/update/:userTypeId", isAdmin, async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );

      const { userTypeId } = req.params;

      ValidationUtils.checkRequiredValues(
        ["name", "status"],
        Object.keys(decodedBody)
      );
      // ValidationUtils.checkTransformedValues(decodedBody);
      await adminService.updateUserByUserEmailOrName(decodedBody, userTypeId);

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
        ["name", "email", "status"],
        Object.keys(decodedBody)
      );

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
    const { meeting_id, room } = req.body.payload;

    if (!meeting_id) return res.status(404).send({ ok: false });

    try {
      const meetingInfo = await generateMeetingInformation(meeting_id);

      let user01Info = meetingInfo.data[0];
      let user02Info = meetingInfo.data[1];

      const user01 = await userQueries.getUserTypeIdById(user01Info.user_id);
      const user02 = await userQueries.getUserTypeIdById(user02Info.user_id);

      user01Info.userTypeId = user01;
      user02Info.userTypeId = user02;

      const participants = {};
      const findCallerAndReceiver = (firstUserInfo, secondUserInfo) => {
        if (firstUserInfo.userTypeId == 3) {
          participants.receiver = firstUserInfo;
          participants.caller = secondUserInfo;
          return;
        }

        participants.caller = firstUserInfo;
        participants.receiver = secondUserInfo;
      };

      findCallerAndReceiver(user01Info, user02Info);

      console.log(participants);
      const callerId = participants.caller.user_id;
      const receiverId = participants.receiver.user_id;

      const getInitialTime = (userJoinTime) => new Date(userJoinTime * 1000);
      const getFinalTime = (userJoinTime, duration) =>
        new Date(userJoinTime * 1000 + duration * 1000);

      await CallService.createCall(
        room,
        callerId,
        receiverId,
        1,
        getInitialTime(user01Info.join_time),
        getFinalTime(user01Info.join_time, user01Info.duration),
        null,
        false,
        1
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

  app.post(
    "/api/:companyId/users/create/bulk",
    isAuthenticated,
    async (req, res) => {
      try {
        const cloneBody = [...req.body];

        const decodeUserArray = async (usersArray) => {
          const t = [];
          for (const user of usersArray) {
            const temp = await CryptoUtils.retrieveValuesFromEncryptedBody(
              user
            );
            t.push(temp);
          }
          return t;
        };

        const decodedBody = await decodeUserArray(cloneBody);

        const { companyId } = req.params;

        const created = await UserService.bulkCreateUsers(
          decodedBody,
          companyId
        );
        res.status(201).send({ created });
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.post(
    "/api/:companyId/departments/create/bulk",
    isAuthenticated,
    async (req, res) => {
      try {
        const cloneBody = [...req.body];

        const decodeUserArray = async (usersArray) => {
          const t = [];
          for (const user of usersArray) {
            console.log(user);
            const temp = await CryptoUtils.retrieveValuesFromEncryptedBody(
              user
            );
            t.push(temp);
          }
          return t;
        };

        const decodedBody = await decodeUserArray(cloneBody);

        const { companyId } = req.params;

        const created = await departmentsService.bulkCreateDepartments(
          decodedBody,
          companyId
        );
        res.status(201).send({ created });
      } catch (error) {
        console.log(error);
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

  app.delete(
    "/api/:companyId/users/delete/bulk",
    isAuthenticated,
    async (req, res) => {
      try {
        const { companyId } = req.params;

        const deleted = await UserService.bulkDeleteUsers(companyId);
        res.status(201).send({ deleted });
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );

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

  app.post("/api/credentials/auth", async (req, res) => {
    try {
      const decodedBody = await CryptoUtils.retrieveValuesFromEncryptedBody(
        req.body
      );
      ValidationUtils.checkRequiredValues(
        ["email", "password"],
        Object.keys(decodedBody)
      );
      ValidationUtils.checkTransformedValues(decodedBody);

      const { email, password } = decodedBody;

      const user = await UserService.getUserByEmailAndCredential(
        email,
        password
      );

      const token = TokenService.createEncodedToken(user);

      return res.status(200).send({ token: token, phone: user.phone });
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
      const { name, email, phone, credential, document } = req.body;

      ValidationUtils.checkRequiredValues(
        ["name", "email", "phone", "credential", "document"],
        [...Object.keys(req.body)]
      );

      const created = await credentialsService.createUserWithCredential(
        name,
        email,
        phone,
        credential,
        document
      );

      res.status(200).send(created);
    } catch (error) {
      const { code, message } = extractCodeAndMessageFromError(error.message);
      res.status(code).send({ message });
    }
  });

  app.put("/api/user/credentials/update", isCredential, async (req, res) => {
    try {
      const { name, email, phone, document } = req.body;

      const credential = req.body?.credential || null;
      const userId = req.body?.userId || null;

      if (!credential)
        throw new Error("Credencial não encontrada no corpo requisição.");

      if (!userId)
        throw new Error("Credencial não encontrada no corpo requisição.");

      ValidationUtils.checkRequiredValues(
        ["credential", "userId"],
        [...Object.keys(req.body)]
      );

      const created = await credentialsService.updateUserWithCredential(
        name,
        email,
        phone,
        credential,
        document,
        userId
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

  app.post(
    "/api/credentials/agenda/:agendaId/delete",
    isCredential,
    async (req, res) => {
      try {
        const credential = req.body?.credential || null;
        const { agendaId } = req.params;

        if (!credential)
          throw new Error("Credencial não encontrada no corpo requisição.");

        if (!agendaId)
          throw new Error("Id da agenda não encontrada no corpo requisição.");

        ValidationUtils.checkRequiredValues(
          ["credential", "agendaId"],
          ["credential", "agendaId"]
        );

        const deleted = await credentialsService.diassociateAgendaFromUser(
          credential,
          agendaId
        );

        res.status(200).send(deleted);
      } catch (error) {
        const { code, message } = extractCodeAndMessageFromError(error.message);
        res.status(code).send({ message });
      }
    }
  );
};
