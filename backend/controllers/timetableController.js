const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.getMyTimetable = asyncHandler(async (req, res, next) => {
  let query = {};
  if (req.user.role === 'TEACHER') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (teacher) {
      query.teacherId = teacher._id;
    }
  } else if (req.user.role === 'STUDENT') {
    const student = await Student.findOne({ userId: req.user._id });
    if (student) {
      query.classId = student.classId;
    }
  }

  let timetable = await Timetable.find(query)
    .populate('subjectId', 'name code type credits')
    .populate('teacherId', 'name email cabinNumber phone')
    .populate('classId', 'name year sections')
    .sort({ dayOfWeek: 1, hour: 1 });

  // If teacher has no directly assigned slots (e.g. Dean/HOD/Substitute), return the full ECE III Year D schedule
  if (timetable.length === 0 && req.user.role === 'TEACHER') {
    timetable = await Timetable.find({})
      .populate('subjectId', 'name code type credits')
      .populate('teacherId', 'name email cabinNumber phone')
      .populate('classId', 'name year sections')
      .sort({ dayOfWeek: 1, hour: 1 });
  }

  res.status(200).json({ success: true, count: timetable.length, data: timetable });
});

exports.getTodayTimetable = asyncHandler(async (req, res, next) => {
  let currentDayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday
  if (currentDayOfWeek === 0) {
    currentDayOfWeek = 1; // Default to Monday on Sundays for preview
  }
  
  let query = { dayOfWeek: currentDayOfWeek };
  if (req.user.role === 'TEACHER') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (teacher) {
      const teacherSlots = await Timetable.find({ teacherId: teacher._id, dayOfWeek: currentDayOfWeek });
      if (teacherSlots.length > 0) {
        query.teacherId = teacher._id;
      }
    }
  } else if (req.user.role === 'STUDENT') {
    const student = await Student.findOne({ userId: req.user._id });
    if (student) {
      query.classId = student.classId;
    }
  }

  let timetable = await Timetable.find(query)
    .populate('subjectId', 'name code type credits')
    .populate('teacherId', 'name email cabinNumber phone')
    .populate('classId', 'name year sections')
    .sort({ hour: 1 });

  // Fallback to all slots for today if empty
  if (timetable.length === 0) {
    timetable = await Timetable.find({ dayOfWeek: currentDayOfWeek })
      .populate('subjectId', 'name code type credits')
      .populate('teacherId', 'name email cabinNumber phone')
      .populate('classId', 'name year sections')
      .sort({ hour: 1 });
  }

  res.status(200).json({ success: true, count: timetable.length, data: timetable });
});

exports.getAllTimetables = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.find({})
    .populate('subjectId', 'name code type credits')
    .populate('teacherId', 'name email cabinNumber phone')
    .populate('classId', 'name year sections')
    .sort({ dayOfWeek: 1, hour: 1 });

  res.status(200).json({ success: true, count: timetable.length, data: timetable });
});
