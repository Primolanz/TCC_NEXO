const express = require('express');
const authMiddleware = require('../middlewares/auth');
const teacherController = require('../controllers/teacherController');

const router = express.Router();
router.use(authMiddleware);
router.get('/classes/:classId/students', teacherController.listClassStudents);
router.get('/students/:studentId/performance', teacherController.getStudentPerformance);

module.exports = router;
