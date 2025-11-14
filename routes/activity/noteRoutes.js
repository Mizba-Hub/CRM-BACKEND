const express = require('express');
const router = express.Router();
const noteController = require("../../controllers/activity/noteController");

router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
