module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("dc_cards", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    img: {
      type: DataTypes.STRING(144),
    },
    title: {
      type: DataTypes.STRING(144),
    },
    content: {
      type: DataTypes.STRING(6000),
    },
  });

  return User;
};
