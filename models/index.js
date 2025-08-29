const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    dialectOptions: {
      dateStrings: true,
      typeCast: function (field, next) {
        if (field.type === "DATETIME") {
          return field.string();
        }
        return next();
      },
    },
    dialect: "mysql",
    logging: false,
    timezone: "-03:00",
  }
);

const User = require("./User")(sequelize, DataTypes);
const UserType = require("./UserType")(sequelize, DataTypes);
const Credential = require("./Credential")(sequelize, DataTypes);
const Call = require("./Call")(sequelize, DataTypes);
const Agenda = require("./Agenda")(sequelize, DataTypes);
const Rating = require("./Rating")(sequelize, DataTypes);

const db = {
  sequelize,
  Sequelize,
  User,
  UserType,
  Credential,
  Call,
  Agenda,
  Rating,
};

Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
