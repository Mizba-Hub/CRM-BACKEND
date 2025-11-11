const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../user");
const { TARGET_TYPES, CALL_RESULTS } = require("../../utils/activity/callConstants");


const Call = sequelize.define(
  "Call",
  {
    id: {
       type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    targetType: {
      type: DataTypes.ENUM(
        TARGET_TYPES.LEAD,
        TARGET_TYPES.COMPANY,
        TARGET_TYPES.TICKET,
        TARGET_TYPES.DEAL
      ),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    callerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    result: {
      type: DataTypes.ENUM(
        CALL_RESULTS.SUCCESSFUL,
        CALL_RESULTS.UNSUCCESSFUL
      ),
      allowNull: false,
      defaultValue: CALL_RESULTS.UNSUCCESSFUL,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    twilioCallSid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "calls",
    timestamps: true,
  }
);

Call.belongsTo(User, {
  foreignKey: "userId",
  as: "User",
});

module.exports = Call;