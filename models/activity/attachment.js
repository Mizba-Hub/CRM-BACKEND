const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../user");

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
  linkedType: {
    type: DataTypes.ENUM("deal", "lead", "company", "ticket"),
    allowNull: false,
  },
  linkedId: { type: DataTypes.STRING, allowNull: false },
});

Attachment.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });
User.hasMany(Attachment, { foreignKey: "uploadedById", as: "attachments" });

module.exports = Attachment;
