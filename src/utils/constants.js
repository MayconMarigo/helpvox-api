//TOTP
const TOTP = {
  AUTHENTICATOR_TIMEOUT: 30,
  AUTHENTICATOR_NAME: "BEM+ security",
};

//URLS

const BASE_DAILY_JS_URL = "https://api.daily.co/v1";
const BASE_DAILY_JS_URL_FRONTEND = "https://helpvox-kof.daily.co/";

const secondsInAMinute = 60;
const sefcondsInAHour = 3600;
const secondsInTenYears = 315532800;

//JWT
const JWT_TOKEN_EXPIRY_TIME = secondsInTenYears;

// DATABASE
const ACTIVE_USER_STATUS = 1;

// USER TYPES

const USER_TYPES = {
  1: "admin",
  2: "company",
  3: "agent",
  4: "worker",
};

//ERROR MESSAGES

const ERROR_MESSAGES = {
  DATE_LOWER_THAN_NOW: {
    code: 412,
    message:
      "Erro ao realizar agendamento. Data selecionada é inferior a data de hoje.",
  },
  CREDENTIAL_NOT_FOUND: {
    code: 401,
    message: "Credenciais ausentes na requisição.",
  },
  INVALID_AGENDA_ID: {
    code: 404,
    message: "Id da agenda inválido.",
  },
  CREDENTIALS_CHANGED: {
    code: 401,
    message:
      "Credenciais alteradas durante sua sessão, por favor faça login novamente.",
  },
  UNAUTHORIZED: {
    code: 401,
    message: "Não autorizado.",
  },
  MALFORMATTED_FIELDS: {
    code: 422,
    message: "Um ou mais campos mal formatados ou ausentes.",
  },
  CODE_EXPIRED: {
    code: 401,
    message: "Código expirado ou inválido.",
  },
  USER: {
    NOT_FOUND: {
      code: 422,
      message: "Se o usuário existir, por favor verifique as credenciais.",
    },
    ALREADY_EXISTS: {
      message: "Usuário já existe na base de dados.",
      code: 422,
    },
  },
  TOKEN: {
    INVALID_TOKEN: {
      code: 401,
      message: "Token inválido.",
    },
  },
  TOTP: {
    AUTH_URL: {
      code: 422,
      message: "Erro ao gerar URL de autenticação.",
    },
  },
  ERRORS: {
    GENERIC_ERROR: {
      code: 500,
      message:
        "Erro ao processar requisição, por favor tente novamente em alguns instantes.",
    },
  },
};

module.exports = {
  TOTP,
  JWT_TOKEN_EXPIRY_TIME,
  ACTIVE_USER_STATUS,
  ERROR_MESSAGES,
  USER_TYPES,
  BASE_DAILY_JS_URL,
  BASE_DAILY_JS_URL_FRONTEND,
};
