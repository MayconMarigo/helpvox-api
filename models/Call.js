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
    callerId: {
      type: DataTypes.STRING(36),
    },
    receiverId: {
      type: DataTypes.STRING(36),
    },
    createdBy: {
      type: DataTypes.STRING(36),
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
    },
    isSocketConnection: {
      type: DataTypes.INTEGER,
    },
    callDuration: {
      type: DataTypes.STRING(5),
    },
  });

  Calls.associate = (models) => {
    // Calls.belongsTo(models.User, { as: "Caller", foreignKey: "callerId" });
    // Calls.belongsTo(models.User, { as: "Receiver", foreignKey: "receiverId" });
  };

  return Calls;
};
