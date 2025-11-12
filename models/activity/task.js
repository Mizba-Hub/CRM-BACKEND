
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const User = require("../user");

const TASK_TYPES = ["to do", "call", "email", "meeting"];
const TASK_PRIORITIES = ["high", "medium", "low"];
const TASK_STATUSES = ["pending", "completed"];
const TASK_MODULES = ["lead", "deal", "ticket", "company"];

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dueTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    taskType: {
      type: DataTypes.ENUM(...TASK_TYPES),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...TASK_PRIORITIES),
      allowNull: false,
      defaultValue: "medium",
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    linkedModule: {
      type: DataTypes.ENUM(...TASK_MODULES),
      allowNull: false,
    },
    linkedModuleId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "GMT+5:30",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
  }
);

Task.belongsTo(User, {
  foreignKey: "assignedToId",
  as: "assignedTo",
});

User.hasMany(Task, {
  foreignKey: "assignedToId",
  as: "AssignedTasks",
});

Task.enums = {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_MODULES,
};

module.exports = Task;

