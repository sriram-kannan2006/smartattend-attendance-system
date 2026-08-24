// Load and register all Mongoose models
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Subject = require('./Subject');
const Department = require('./Department');
const Parent = require('./Parent');
const Hostel = require('./Hostel');
const Warden = require('./Warden');
const Attendance = require('./Attendance');
const AttendanceSession = require('./AttendanceSession');
const Timetable = require('./Timetable');
const ODRecord = require('./ODRecord');
const FaceProfile = require('./FaceProfile');
const FaceVerificationEvent = require('./FaceVerificationEvent');
const Notification = require('./Notification');
const NotificationJob = require('./NotificationJob');
const NotificationRule = require('./NotificationRule');
const NotificationTemplate = require('./NotificationTemplate');
const Report = require('./Report');
const AcademicYear = require('./AcademicYear');
const AuditLog = require('./AuditLog');

module.exports = {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  Department,
  Parent,
  Hostel,
  Warden,
  Attendance,
  AttendanceSession,
  Timetable,
  ODRecord,
  FaceProfile,
  FaceVerificationEvent,
  Notification,
  NotificationJob,
  NotificationRule,
  NotificationTemplate,
  Report,
  AcademicYear,
  AuditLog,
};
