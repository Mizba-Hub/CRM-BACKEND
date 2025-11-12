const { Op } = require("sequelize");
const Task = require("../../models/activity/task");
const User = require("../../models/user");

const baseInclude = [
  {
    model: User,
    as: "assignedTo",
    attributes: ["id", "firstName", "lastName"],
  },
];

const buildWhereClause = ({
  status,
  linkedModule,
  linkedModuleId,
  search,
  taskType,
  priority,
}) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (linkedModule) {
    where.linkedModule = linkedModule;
  }

  if (linkedModuleId) {
    where.linkedModuleId = linkedModuleId;
  }

  if (taskType) {
    where.taskType = taskType;
  }

  if (priority) {
    where.priority = priority;
  }

  if (search) {
    const normalizedSearch = search.trim();
    where[Op.or] = [
      { taskName: { [Op.iLike]: `%${normalizedSearch}%` } },
      { note: { [Op.iLike]: `%${normalizedSearch}%` } },
    ];
  }

  return where;
};

const findTasks = async (query) => {
  const { page = 1, size = 10 } = query;
  const limit = parseInt(size, 10) || 10;
  const offset = (parseInt(page, 10) - 1) * limit;

  const where = buildWhereClause(query);

  const { rows, count } = await Task.findAndCountAll({
    where,
    include: baseInclude,
    limit,
    offset,
    order: [
      ["dueDate", "ASC"],
      ["dueTime", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  return { tasks: rows, total: count };
};

const findTaskById = async (id) => {
  return Task.findByPk(id, {
    include: baseInclude,
  });
};

const createTask = async (data) => {
  const task = await Task.create(data);
  return task;
};

const updateTask = async (task, data) => {
  await task.update(data);
  return task;
};

const completeTask = async (task, { note }) => {
  const updates = {
    status: "completed",
    completedAt: new Date(),
  };

  if (typeof note === "string") {
    updates.note = note;
  }

  await task.update(updates);
  return task;
};

const deleteTask = async (task) => {
  await task.destroy();
  return true;
};

module.exports = {
  findTasks,
  findTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
};

