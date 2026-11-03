const express = require('express');
const authMiddleware = require('../middlewares/auth');
const teacherController = require('../controllers/teacherController');

const router = express.Router();
router.use(authMiddleware);
router.get('/reports', teacherController.getTeacherReports);
router.get('/classes/:classId/students', teacherController.listClassStudents);
router.get('/students/:studentId/performance', teacherController.getStudentPerformance);
router.get('/assignments/:assignmentId/submissions', teacherController.getAssignmentSubmissions);
router.patch('/assignments/:assignmentId/submissions/:studentId', teacherController.updateSubmissionReview);

module.exports = router;
