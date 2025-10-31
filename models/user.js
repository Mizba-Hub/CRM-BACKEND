const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  companyName: { type: DataTypes.STRING },
  industryType: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING },
  resetToken: { type: DataTypes.STRING },
  resetTokenExpiry: { type: DataTypes.DATE },
});

module.exports = User;
