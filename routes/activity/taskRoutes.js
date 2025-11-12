const express = require("express");

const router = express.Router();

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
} = require("../../controllers/activity/taskController");

router.route("/").get(getTasks).post(createTask);

router.route("/:taskId").get(getTaskById).put(updateTask).delete(deleteTask);

router.route("/:taskId/complete").patch(completeTask);

module.exports = router;

