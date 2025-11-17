const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../user");
const Attachment = require("./attachment");

const Email = sequelize.define(
  "Email",
  {
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    cc: { type: DataTypes.JSONB, allowNull: true },
    bcc: { type: DataTypes.JSONB, allowNull: true },
    recipients: { type: DataTypes.JSONB, allowNull: false },
    linkedType: {
      type: DataTypes.ENUM("deal", "lead", "company", "ticket"),
      allowNull: false,
    },
    linkedId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, references: { model: "Users", key: "id" } },
    sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "emails",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);
module.exports = Email;
