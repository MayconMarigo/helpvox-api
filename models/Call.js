module.exports = (sequelize, DataTypes) => {
  const Calls = sequelize.define("calls", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    callId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    videoUrl: {
      type: DataTypes.STRING,
      unique: true,
    },
    connected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    startTime: {
      type: "TIMESTAMP",
      allowNull: false,
    },
    endTime: {
      type: "TIMESTAMP",
      allowNull: false,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
    },
  });

  Calls.associate = (models) => {
    Calls.belongsTo(models.User, { as: "Caller", foreignKey: "callerId" });
    Calls.belongsTo(models.User, { as: "Receiver", foreignKey: "receiverId" });
  };

  return Calls;
};
