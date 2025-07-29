module.exports = (sequelize, DataTypes) => {
    const UserType = sequelize.define('user_types', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      type: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  
    UserType.associate = (models) => {
      UserType.hasMany(models.User, { foreignKey: 'userTypeId' });
    };
  
    return UserType;
  };
  