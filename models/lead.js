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

Lead.belongsToMany(User, {
  through: "LeadUsers",
  as: "Users",
  foreignKey: "leadId",
  otherKey: "userId",
});

User.belongsToMany(Lead, {
  through: "LeadUsers",
  as: "Leads",
  foreignKey: "userId",
  otherKey: "leadId",
});

module.exports = Lead;
