const express = require('express');
const authMiddleware = require('../middlewares/auth');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();
router.use(authMiddleware);
router.get('/student', assignmentController.listStudentAssignments);
router.post('/:id/submit', assignmentController.submitAssignment);
router.post('/', assignmentController.createAssignment);

module.exports = router;
