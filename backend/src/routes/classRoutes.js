const express = require('express');
const authMiddleware = require('../middlewares/auth');
const classController = require('../controllers/classController');

const router = express.Router();
router.use(authMiddleware);
router.get('/student', classController.listStudentClasses);
router.post('/join', classController.joinClass);
router.get('/', classController.listClasses);
router.post('/', classController.createClass);

module.exports = router;
