const express = require('express');
const { body } = require('express-validator');
const {
  createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment,
  createClass, getClasses, getClass, updateClass, deleteClass,
  createSubject, getSubjects, getSubject, updateSubject, deleteSubject,
  createTimetableEntry, getTimetable, getTimetableByClass, updateTimetableEntry, deleteTimetableEntry,
  createAcademicYear, getAcademicYears, setCurrentAcademicYear,
  createHostel, getHostels, updateHostel,
  getAllStudents, getStudent, updateStudent, deleteStudent,
  getAllTeachers, getTeacher, updateTeacher, deleteTeacher
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

// Departments
router.route('/departments')
  .get(getDepartments)
  .post(
    body('name').notEmpty().withMessage('Name is required'),
    body('code').notEmpty().withMessage('Code is required'),
    validate,
    createDepartment
  );
router.route('/departments/:id')
  .get(getDepartment)
  .put(updateDepartment)
  .delete(deleteDepartment);

// Classes
router.route('/classes')
  .get(getClasses)
  .post(
    body('name').notEmpty().withMessage('Name is required'),
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('year').isNumeric().withMessage('Year must be a number'),
    validate,
    createClass
  );
router.route('/classes/:id')
  .get(getClass)
  .put(updateClass)
  .delete(deleteClass);

// Subjects
router.route('/subjects')
  .get(getSubjects)
  .post(
    body('name').notEmpty().withMessage('Name is required'),
    body('code').notEmpty().withMessage('Code is required'),
    validate,
    createSubject
  );
router.route('/subjects/:id')
  .get(getSubject)
  .put(updateSubject)
  .delete(deleteSubject);

// Timetable
router.route('/timetable')
  .get(getTimetable)
  .post(
    body('classId').notEmpty().withMessage('Class ID is required'),
    body('dayOfWeek').isNumeric().withMessage('Day of week must be a number'),
    body('hour').isNumeric().withMessage('Hour must be a number'),
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('teacherId').notEmpty().withMessage('Teacher ID is required'),
    validate,
    createTimetableEntry
  );
router.route('/timetable/class/:classId').get(getTimetableByClass);
router.route('/timetable/:id')
  .put(updateTimetableEntry)
  .delete(deleteTimetableEntry);

// Academic Years
router.route('/academic-years')
  .get(getAcademicYears)
  .post(
    body('name').notEmpty().withMessage('Name is required'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    validate,
    createAcademicYear
  );
router.route('/academic-years/:id/current').put(setCurrentAcademicYear);

// Hostels
router.route('/hostels')
  .get(getHostels)
  .post(
    body('name').notEmpty().withMessage('Name is required'),
    validate,
    createHostel
  );
router.route('/hostels/:id').put(updateHostel);

// Students
router.route('/students').get(getAllStudents);
router.route('/students/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

// Teachers
router.route('/teachers').get(getAllTeachers);
router.route('/teachers/:id')
  .get(getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

module.exports = router;
