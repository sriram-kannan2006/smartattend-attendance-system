const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');

// Departments
exports.createDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.create(req.body);
  await logAudit('CREATE_DEPARTMENT', req.user.id, { departmentId: department._id });
  res.status(201).json({ success: true, data: department });
});

exports.getDepartments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }
  const departments = await Department.find(query).skip(skip).limit(limit).populate('hodId');
  const total = await Department.countDocuments(query);
  res.status(200).json({ success: true, count: total, data: departments });
});

exports.getDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id).populate('hodId');
  if (!department) return next(new AppError('Department not found', 404));
  res.status(200).json({ success: true, data: department });
});

exports.updateDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) return next(new AppError('Department not found', 404));
  await logAudit('UPDATE_DEPARTMENT', req.user.id, { departmentId: department._id });
  res.status(200).json({ success: true, data: department });
});

exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  if (!department) return next(new AppError('Department not found', 404));
  department.isActive = false;
  await department.save();
  await logAudit('DELETE_DEPARTMENT', req.user.id, { departmentId: department._id });
  res.status(200).json({ success: true, data: {} });
});

// Classes
exports.createClass = asyncHandler(async (req, res, next) => {
  const cls = await Class.create(req.body);
  await logAudit('CREATE_CLASS', req.user.id, { classId: cls._id });
  res.status(201).json({ success: true, data: cls });
});

exports.getClasses = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }
  const classes = await Class.find(query).skip(skip).limit(limit).populate('departmentId');
  const total = await Class.countDocuments(query);
  res.status(200).json({ success: true, count: total, data: classes });
});

exports.getClass = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id).populate('departmentId');
  if (!cls) return next(new AppError('Class not found', 404));
  res.status(200).json({ success: true, data: cls });
});

exports.updateClass = asyncHandler(async (req, res, next) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cls) return next(new AppError('Class not found', 404));
  await logAudit('UPDATE_CLASS', req.user.id, { classId: cls._id });
  res.status(200).json({ success: true, data: cls });
});

exports.deleteClass = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(new AppError('Class not found', 404));
  cls.isActive = false;
  await cls.save();
  await logAudit('DELETE_CLASS', req.user.id, { classId: cls._id });
  res.status(200).json({ success: true, data: {} });
});

// Subjects
exports.createSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.create(req.body);
  await logAudit('CREATE_SUBJECT', req.user.id, { subjectId: subject._id });
  res.status(201).json({ success: true, data: subject });
});

exports.getSubjects = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }
  const subjects = await Subject.find(query).skip(skip).limit(limit).populate('departmentId teacherId classIds');
  const total = await Subject.countDocuments(query);
  res.status(200).json({ success: true, count: total, data: subjects });
});

exports.getSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id).populate('departmentId teacherId classIds');
  if (!subject) return next(new AppError('Subject not found', 404));
  res.status(200).json({ success: true, data: subject });
});

exports.updateSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) return next(new AppError('Subject not found', 404));
  await logAudit('UPDATE_SUBJECT', req.user.id, { subjectId: subject._id });
  res.status(200).json({ success: true, data: subject });
});

exports.deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return next(new AppError('Subject not found', 404));
  subject.isActive = false;
  await subject.save();
  await logAudit('DELETE_SUBJECT', req.user.id, { subjectId: subject._id });
  res.status(200).json({ success: true, data: {} });
});

// Timetable
exports.createTimetableEntry = asyncHandler(async (req, res, next) => {
  const entry = await Timetable.create(req.body);
  await logAudit('CREATE_TIMETABLE', req.user.id, { timetableId: entry._id });
  res.status(201).json({ success: true, data: entry });
});

exports.getTimetable = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const entries = await Timetable.find({}).skip(skip).limit(limit).populate('classId subjectId teacherId');
  const total = await Timetable.countDocuments({});
  res.status(200).json({ success: true, count: total, data: entries });
});

exports.getTimetableByClass = asyncHandler(async (req, res, next) => {
  const entries = await Timetable.find({ classId: req.params.classId }).populate('subjectId teacherId');
  res.status(200).json({ success: true, data: entries });
});

exports.updateTimetableEntry = asyncHandler(async (req, res, next) => {
  const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!entry) return next(new AppError('Timetable entry not found', 404));
  await logAudit('UPDATE_TIMETABLE', req.user.id, { timetableId: entry._id });
  res.status(200).json({ success: true, data: entry });
});

exports.deleteTimetableEntry = asyncHandler(async (req, res, next) => {
  const entry = await Timetable.findByIdAndDelete(req.params.id);
  if (!entry) return next(new AppError('Timetable entry not found', 404));
  await logAudit('DELETE_TIMETABLE', req.user.id, { timetableId: entry._id });
  res.status(200).json({ success: true, data: {} });
});

// Academic Years
exports.createAcademicYear = asyncHandler(async (req, res, next) => {
  const acYear = await AcademicYear.create(req.body);
  await logAudit('CREATE_ACADEMIC_YEAR', req.user.id, { academicYearId: acYear._id });
  res.status(201).json({ success: true, data: acYear });
});

exports.getAcademicYears = asyncHandler(async (req, res, next) => {
  const acYears = await AcademicYear.find({});
  res.status(200).json({ success: true, count: acYears.length, data: acYears });
});

exports.setCurrentAcademicYear = asyncHandler(async (req, res, next) => {
  await AcademicYear.updateMany({}, { isCurrent: false });
  const acYear = await AcademicYear.findByIdAndUpdate(req.params.id, { isCurrent: true }, { new: true });
  if (!acYear) return next(new AppError('Academic Year not found', 404));
  await logAudit('SET_CURRENT_ACADEMIC_YEAR', req.user.id, { academicYearId: acYear._id });
  res.status(200).json({ success: true, data: acYear });
});

// Hostels
exports.createHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.create(req.body);
  await logAudit('CREATE_HOSTEL', req.user.id, { hostelId: hostel._id });
  res.status(201).json({ success: true, data: hostel });
});

exports.getHostels = asyncHandler(async (req, res, next) => {
  const hostels = await Hostel.find({}).populate('wardenId');
  res.status(200).json({ success: true, count: hostels.length, data: hostels });
});

exports.updateHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!hostel) return next(new AppError('Hostel not found', 404));
  await logAudit('UPDATE_HOSTEL', req.user.id, { hostelId: hostel._id });
  res.status(200).json({ success: true, data: hostel });
});

// Students
exports.getAllStudents = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const students = await Student.find({}).skip(skip).limit(limit).populate('user');
  const total = await Student.countDocuments({});
  res.status(200).json({ success: true, count: total, data: students });
});

exports.getStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id).populate('user');
  if (!student) return next(new AppError('Student not found', 404));
  res.status(200).json({ success: true, data: student });
});

exports.updateStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!student) return next(new AppError('Student not found', 404));
  await logAudit('UPDATE_STUDENT', req.user.id, { studentId: student._id });
  res.status(200).json({ success: true, data: student });
});

exports.deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return next(new AppError('Student not found', 404));
  await logAudit('DELETE_STUDENT', req.user.id, { studentId: student._id });
  res.status(200).json({ success: true, data: {} });
});

// Teachers
exports.getAllTeachers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const teachers = await Teacher.find({}).skip(skip).limit(limit).populate('user');
  const total = await Teacher.countDocuments({});
  res.status(200).json({ success: true, count: total, data: teachers });
});

exports.getTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id).populate('user');
  if (!teacher) return next(new AppError('Teacher not found', 404));
  res.status(200).json({ success: true, data: teacher });
});

exports.updateTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!teacher) return next(new AppError('Teacher not found', 404));
  await logAudit('UPDATE_TEACHER', req.user.id, { teacherId: teacher._id });
  res.status(200).json({ success: true, data: teacher });
});

exports.deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) return next(new AppError('Teacher not found', 404));
  await logAudit('DELETE_TEACHER', req.user.id, { teacherId: teacher._id });
  res.status(200).json({ success: true, data: {} });
});
