const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Lead = require("./lead");

const Company = sequelize.define("Company", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  domainName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  industryType: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  noOfEmployees: { type: DataTypes.INTEGER },
  annualRevenue: { type: DataTypes.DOUBLE },
  phoneNumber: { type: DataTypes.STRING },
  website: { type: DataTypes.STRING },

  leadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Lead,
      key: "id",
    },
  },
});

Company.belongsToMany(User, {
  through: "CompanyOwners",
  as: "Owners",
  foreignKey: "companyId",
  otherKey: "userId",
});

User.belongsToMany(Company, {
  through: "CompanyOwners",
  as: "Companies",
  foreignKey: "userId",
  otherKey: "companyId",
});

Company.belongsTo(Lead, {
  foreignKey: "leadId",
  as: "Lead",
});

module.exports = Company;
