const express = require('express');
const { getMyTimetable, getTodayTimetable, getAllTimetables } = require('../controllers/timetableController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/my', getMyTimetable);
router.get('/today', getTodayTimetable);
router.get('/all', getAllTimetables);

module.exports = router;
