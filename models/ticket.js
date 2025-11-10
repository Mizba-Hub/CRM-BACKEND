const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");
const Company = require("./company");
const Deal = require("./deal");

const Ticket = sequelize.define(
  "Ticket",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    TicketName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    TicketStatus: {
      type: DataTypes.ENUM(
        "New",
        "Closed",
        "Waiting on us",
        "Waiting on Contact"
      ),
      allowNull: false,
      defaultValue: "New",
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM("Email", "Chat", "Phone"),
      allowNull: true,
    },
    dealId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "deals",
        key: "id",
      },
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Companies",
        key: "id",
      },
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "GMT+5:30",
    },
  },
  {
    timestamps: true,
  }
);

Ticket.belongsToMany(User, {
  through: "TicketUsers",
  as: "Users",
  foreignKey: "ticketId",
  otherKey: "userId",
});

User.belongsToMany(Ticket, {
  through: "TicketUsers",
  as: "Tickets",
  foreignKey: "userId",
  otherKey: "ticketId",
});

Company.hasMany(Ticket, {
  foreignKey: "companyId",
  as: "Tickets",
});

Ticket.belongsTo(Company, {
  foreignKey: "companyId",
  as: "Company",
});

Deal.hasMany(Ticket, {
  foreignKey: "dealId",
  as: "tickets",
});

Ticket.belongsTo(Deal, {
  foreignKey: "dealId",
  as: "Deal",
});

module.exports = Ticket;
