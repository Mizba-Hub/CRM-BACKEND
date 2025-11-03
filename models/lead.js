const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const Lead = sequelize.define("Lead", {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  phoneNumber: { type: DataTypes.STRING },
  jobTitle: { type: DataTypes.STRING },
  leadStatus: {
    type: DataTypes.ENUM("NEW", "OPEN", "QUALIFIED", "IN PROGRESS", "CLOSED"),
    defaultValue: "NEW",
  },
});

Lead.belongsTo(User, {
  as: "ContactOwner",
  foreignKey: "ContactOwnerId",
  onDelete: "SET NULL",
});

module.exports = Lead;
