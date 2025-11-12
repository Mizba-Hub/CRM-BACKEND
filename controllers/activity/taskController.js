
const asyncHandler = require("express-async-handler");
const CustomError = require("../../utils/customError");
const User = require("../../models/user");
const Lead = require("../../models/lead");
const Deal = require("../../models/deal");
const Ticket = require("../../models/ticket");
const Company = require("../../models/company");
const taskRepository = require("../../repositories/activity/taskRepository");
const Task = require("../../models/activity/task");

const {
  taskType: taskTypeAttribute,
  priority: priorityAttribute,
  status: statusAttribute,
  linkedModule: linkedModuleAttribute,
} = Task.getAttributes();

const TASK_TYPES = taskTypeAttribute.values;
const TASK_PRIORITIES = priorityAttribute.values;
const TASK_STATUSES = statusAttribute.values;
const TASK_MODULES = linkedModuleAttribute.values;

const MODULE_MODEL_MAP = {
  lead: { model: Lead, label: "Lead" },
  deal: { model: Deal, label: "Deal" },
  ticket: { model: Ticket, label: "Ticket" },
  company: { model: Company, label: "Company" },
};

const isPresent = (value) =>
  typeof value === "string" ? value.trim().length > 0 : value !== undefined;

const formatUser = (user) => {
  if (!user) return null;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return {
    id: String(user.id),
    name: fullName || user.firstName || user.lastName || null,
  };
};

const formatTaskResponse = (task, options = {}) => {
  const { includeTimezone = false, includeCompletedAt = false } = options;
  const payload = {
    id: task.id,
    taskName: task.taskName,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    taskType: task.taskType,
    priority: task.priority,
    assignedTo: formatUser(task.assignedTo),
    note: task.note,
    status: task.status,
    linkedModule: task.linkedModule,
    linkedModuleId: task.linkedModuleId,
    createdAt: task.createdAt ? task.createdAt.toISOString() : null,
    updatedAt: task.updatedAt ? task.updatedAt.toISOString() : null,
  };

  if (includeTimezone) {
    payload.timezone = task.timezone ?? null;
  }

  if (includeCompletedAt) {
    payload.completedAt = task.completedAt
      ? task.completedAt.toISOString()
      : null;
  }

  return payload;
};

const ensureValidEnum = (value, validValues, field, code = "INVALID_VALUE") => {
  if (!validValues.includes(value)) {
    throw new CustomError(
      `${field} must be one of: ${validValues.join(", ")}`,
      400,
      code
    );
  }
};

const ensureAssignedUserExists = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new CustomError("Assigned user not found", 404, "USER_NOT_FOUND");
  }
  return user;
};

const ensureModuleExists = async (linkedModule, linkedModuleId) => {
  const moduleEntry = MODULE_MODEL_MAP[linkedModule];
  if (!moduleEntry) {
    throw new CustomError("Invalid linked module", 400, "INVALID_LINKED_MODULE");
  }

  const record = await moduleEntry.model.findByPk(linkedModuleId);
  if (!record) {
    throw new CustomError(
      `${moduleEntry.label} with id ${linkedModuleId} not found`,
      404,
      `${moduleEntry.label.toUpperCase()}_NOT_FOUND`
    );
  }

  return record;
};

const getTasks = asyncHandler(async (req, res) => {
  const { status, taskType, priority, linkedModule } = req.query;

  if (status) ensureValidEnum(status, TASK_STATUSES, "status");
  if (taskType) ensureValidEnum(taskType, TASK_TYPES, "taskType");
  if (priority) ensureValidEnum(priority, TASK_PRIORITIES, "priority");
  if (linkedModule) ensureValidEnum(linkedModule, TASK_MODULES, "linkedModule");

  const { tasks } = await taskRepository.findTasks(req.query);
  const formatted = tasks.map((task) => formatTaskResponse(task));

  res.json(formatted);
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskRepository.findTaskById(req.params.taskId);
  if (!task)
    throw new CustomError(
      `Task with id ${req.params.taskId} not found`,
      404,
      "TASK_NOT_FOUND"
    );

  res.json({
    success: true,
    data: formatTaskResponse(task, {
      includeTimezone: true,
      includeCompletedAt: true,
    }),
  });
});

const createTask = asyncHandler(async (req, res) => {
  const {
    taskName,
    dueDate,
    dueTime,
    taskType,
    priority,
    assignedToId,
    note,
    linkedModule,
    linkedModuleId,
    timezone,
  } = req.body;

  if (!isPresent(taskName)) {
    throw new CustomError("taskName is required", 400, "TASK_NAME_REQUIRED");
  }
  if (!isPresent(taskType)) {
    throw new CustomError("taskType is required", 400, "TASK_TYPE_REQUIRED");
  }
  if (!isPresent(priority)) {
    throw new CustomError("priority is required", 400, "TASK_PRIORITY_REQUIRED");
  }
  if (!assignedToId) {
    throw new CustomError(
      "assignedToId is required",
      400,
      "ASSIGNED_USER_REQUIRED"
    );
  }
  if (!isPresent(linkedModule)) {
    throw new CustomError(
      "linkedModule is required",
      400,
      "LINKED_MODULE_REQUIRED"
    );
  }
  if (!isPresent(linkedModuleId)) {
    throw new CustomError(
      "linkedModuleId is required",
      400,
      "LINKED_MODULE_ID_REQUIRED"
    );
  }

  ensureValidEnum(taskType, TASK_TYPES, "taskType");
  ensureValidEnum(priority, TASK_PRIORITIES, "priority");
  ensureValidEnum(linkedModule, TASK_MODULES, "linkedModule");

  await ensureAssignedUserExists(assignedToId);
  await ensureModuleExists(linkedModule, linkedModuleId);

  const task = await taskRepository.createTask({
    taskName,
    dueDate,
    dueTime,
    taskType,
    priority,
    assignedToId,
    note,
    linkedModule,
    linkedModuleId,
    timezone,
  });

  res.status(201).json({
    success: true,
    data: { id: task.id },
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskRepository.findTaskById(req.params.taskId);
  if (!task)
    throw new CustomError(
      `Task with id ${req.params.taskId} not found`,
      404,
      "TASK_NOT_FOUND"
    );

  const {
    taskName,
    dueDate,
    dueTime,
    taskType,
    priority,
    assignedToId,
    note,
    status,
    linkedModule,
    linkedModuleId,
    timezone,
  } = req.body;

  if (taskType) ensureValidEnum(taskType, TASK_TYPES, "taskType");
  if (priority) ensureValidEnum(priority, TASK_PRIORITIES, "priority");
  if (status) ensureValidEnum(status, TASK_STATUSES, "status");
  if (linkedModule) ensureValidEnum(linkedModule, TASK_MODULES, "linkedModule");

  if (assignedToId) {
    await ensureAssignedUserExists(assignedToId);
  }

  if (linkedModule || linkedModuleId) {
    await ensureModuleExists(
      linkedModule || task.linkedModule,
      linkedModuleId || task.linkedModuleId
    );
  }

  const updatePayload = {
    taskName,
    dueDate,
    dueTime,
    taskType,
    priority,
    assignedToId,
    note,
    status,
    linkedModule,
    linkedModuleId,
    timezone,
  };

  Object.keys(updatePayload).forEach((key) => {
    if (typeof updatePayload[key] === "undefined") {
      delete updatePayload[key];
    }
  });

  if (updatePayload.status === "completed" && !task.completedAt) {
    updatePayload.completedAt = new Date();
  }

  if (updatePayload.status === "pending") {
    updatePayload.completedAt = null;
  }

  await taskRepository.updateTask(task, updatePayload);

  res.json({
    success: true,
    data: {
      id: task.id,
      updatedAt: new Date().toISOString(),
    },
  });
});

const completeTask = asyncHandler(async (req, res) => {
  const task = await taskRepository.findTaskById(req.params.taskId);
  if (!task)
    throw new CustomError(
      `Task with id ${req.params.taskId} not found`,
      404,
      "TASK_NOT_FOUND"
    );

  const updatedTask = await taskRepository.completeTask(task, {
    note: req.body?.note,
  });

  res.json({
    success: true,
    data: {
      id: updatedTask.id,
      status: updatedTask.status,
      completedAt: updatedTask.completedAt
        ? updatedTask.completedAt.toISOString()
        : null,
    },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskRepository.findTaskById(req.params.taskId);
  if (!task)
    throw new CustomError(
      `Task with id ${req.params.taskId} not found`,
      404,
      "TASK_NOT_FOUND"
    );

  await taskRepository.deleteTask(task);

  res.json({
    success: true,
    data: { deleted: true },
  });
});

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
};

