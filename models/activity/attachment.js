const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../user");
const Email=require('../activity/email')

const Attachment = sequelize.define("Attachment", {
  filename: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  uploadedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Users", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  },
  emailId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "emails", key: "id" },
    onDelete: "CASCADE",
  },
  linkedType: {
    type: DataTypes.ENUM("deal", "lead", "company", "ticket"),
    allowNull: true,
  },
  linkedId: { type: DataTypes.STRING, allowNull: true },
});


module.exports = Attachment;
