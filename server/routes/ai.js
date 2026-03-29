const express = require('express');
const auth = require('../middleware/auth');
const { createStudyPlan, createQuiz, askQuestion } = require('../controllers/aiController');

const router = express.Router();

router.post('/study-plan', auth, createStudyPlan);
router.post('/quiz', auth, createQuiz);
router.post('/ask', auth, askQuestion);

module.exports = router;

