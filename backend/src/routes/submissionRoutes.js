const express = require('express');
const authMiddleware = require('../middlewares/auth');
const teacherController = require('../controllers/teacherController');

const router = express.Router();
router.use(authMiddleware);
router.get('/assignment/:assignmentId', teacherController.getAssignmentSubmissions);

module.exports = router;
