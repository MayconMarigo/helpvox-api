module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define("departments", {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(60),
    },
    code: {
      type: DataTypes.STRING(60),
    },
    userId: {
      type: DataTypes.STRING(36),
    },
  });

  return Department;
};
