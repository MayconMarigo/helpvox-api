module.exports = (sequelize, DataTypes) => {
  const Agenda = sequelize.define("agendas", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    callId: {
      type: DataTypes.STRING,
      unique: true,
    },
    callerId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    receiverId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    callUrl: {
      type: DataTypes.STRING,
      unique: true,
    },
    scheduledDateTime: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.INTEGER,
    },
  });

  Agenda.associate = (models) => {
    Agenda.belongsTo(models.User, { as: "Caller", foreignKey: "callerId" });
    Agenda.belongsTo(models.User, { as: "Receiver", foreignKey: "receiverId" });
  };

  return Agenda;
};
