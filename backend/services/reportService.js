const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Report = require('../models/Report');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const ODRecord = require('../models/ODRecord');
const AppError = require('../utils/AppError');
const { logAudit } = require('../utils/auditLogger');
const qrService = require('./qrService');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Generate an Excel report for an attendance session.
 *
 * @param {string} sessionMongoId - Session MongoDB _id or string ID
 * @param {string} generatedByUserId - User generating the report
 * @param {Object} req - Express request
 * @returns {Object} Report metadata
 */
const generateSessionReport = async (sessionMongoId, generatedByUserId, req = null) => {
  const sessionDoc = await qrService.findSession(sessionMongoId);

  if (!sessionDoc) {
    throw new AppError('Session not found.', 404);
  }

  const session = await AttendanceSession.findById(sessionDoc._id)
    .populate('classId', 'name year')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name');

  // Get all attendance records for this session
  const records = await Attendance.find({ sessionId: session._id })
    .populate({
      path: 'studentId',
      select: 'registerNumber name email hostelId',
    })
    .sort({ status: 1 });

  // Get OD records
  const odRecords = await ODRecord.find({
    date: session.date,
    startHour: { $lte: session.hour },
    endHour: { $gte: session.hour },
    status: 'APPROVED',
  }).populate('studentId', 'registerNumber name');

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmartAttend — Kongu Engineering College (Autonomous)';
  workbook.created = new Date();

  // ===== SHEET 1: Attendance =====
  const attendanceSheet = workbook.addWorksheet('Attendance', {
    headerFooter: {
      firstHeader: `KONGU ENGINEERING COLLEGE (AUTONOMOUS) - ${session.subjectId?.name || 'Subject'} Attendance Report`,
    },
  });

  // Header styling
  const headerStyle = {
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const cellBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  attendanceSheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Register Number', key: 'registerNumber', width: 18 },
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Class', key: 'className', width: 15 },
    { header: 'Subject', key: 'subjectName', width: 22 },
    { header: 'Hour', key: 'hour', width: 8 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Scanned Time', key: 'scannedAt', width: 18 },
    { header: 'Teacher', key: 'teacher', width: 20 },
  ];

  // Apply header styles
  attendanceSheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  attendanceSheet.getRow(1).height = 28;

  // Add data rows
  records.forEach((record, index) => {
    const row = attendanceSheet.addRow({
      sno: index + 1,
      registerNumber: record.studentId?.registerNumber || 'N/A',
      studentName: record.studentId?.name || 'N/A',
      className: session.classId?.name || 'N/A',
      subjectName: session.subjectId?.name || 'N/A',
      hour: session.hour,
      date: new Date(session.date).toLocaleDateString('en-IN'),
      status: record.status,
      scannedAt: record.scannedAt
        ? new Date(record.scannedAt).toLocaleTimeString('en-IN')
        : '-',
      teacher: session.teacherId?.name || 'N/A',
    });

    // Status color coding
    const statusCell = row.getCell('status');
    if (record.status === 'PRESENT') {
      statusCell.font = { color: { argb: 'FF059669' }, bold: true };
    } else if (record.status === 'ABSENT') {
      statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    } else if (record.status === 'OD') {
      statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
    }

    // Apply cell borders
    row.eachCell((cell) => {
      cell.border = cellBorder;
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }
  });

  // ===== SHEET 2: Summary =====
  const summarySheet = workbook.addWorksheet('Summary');

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const odCount = records.filter((r) => r.status === 'OD').length;
  const totalStudents = records.length;
  const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  summarySheet.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Value', key: 'value', width: 35 },
  ];

  summarySheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });

  const summaryData = [
    { field: 'Class', value: session.classId?.name || 'N/A' },
    { field: 'Subject', value: `${session.subjectId?.name || 'N/A'} (${session.subjectId?.code || ''})` },
    { field: 'Hour', value: session.hour },
    { field: 'Date', value: new Date(session.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { field: 'Teacher', value: session.teacherId?.name || 'N/A' },
    { field: 'Session ID', value: session.sessionId },
    { field: '', value: '' },
    { field: 'Total Students', value: totalStudents },
    { field: 'Present', value: presentCount },
    { field: 'Absent', value: absentCount },
    { field: 'OD', value: odCount },
    { field: 'Attendance %', value: `${percentage}%` },
  ];

  summaryData.forEach((item) => {
    const row = summarySheet.addRow(item);
    row.getCell('field').font = { bold: true };
    row.eachCell((cell) => { cell.border = cellBorder; });
  });

  // ===== SHEET 3: Absent List =====
  const absentSheet = workbook.addWorksheet('Absent List');
  absentSheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Register Number', key: 'registerNumber', width: 18 },
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Hostel', key: 'hostel', width: 15 },
  ];

  absentSheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });

  const absentRecords = records.filter((r) => r.status === 'ABSENT');
  absentRecords.forEach((record, index) => {
    const row = absentSheet.addRow({
      sno: index + 1,
      registerNumber: record.studentId?.registerNumber || 'N/A',
      studentName: record.studentId?.name || 'N/A',
      hostel: record.studentId?.hostelId ? 'Yes' : 'No',
    });
    row.eachCell((cell) => { cell.border = cellBorder; });
  });

  // ===== SHEET 4: OD List =====
  const odSheet = workbook.addWorksheet('OD List');
  odSheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Register Number', key: 'registerNumber', width: 18 },
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Reason', key: 'reason', width: 30 },
    { header: 'Event', key: 'event', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  odSheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });

  odRecords.forEach((record, index) => {
    const row = odSheet.addRow({
      sno: index + 1,
      registerNumber: record.studentId?.registerNumber || 'N/A',
      studentName: record.studentId?.name || 'N/A',
      reason: record.reason || '-',
      event: record.event || '-',
      status: record.status,
    });
    row.eachCell((cell) => { cell.border = cellBorder; });
  });

  // Generate safe filename (sanitizing illegal filesystem characters like / \ : * ? " < > |)
  const sanitize = (s) => (s || 'Item').replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '-');
  const className = sanitize(session.classId?.name || 'Class');
  const subjectName = sanitize(session.subjectId?.name || 'Subject');
  const dateStr = new Date(session.date).toISOString().slice(0, 10);
  const fileName = `KEC_${className}_${subjectName}_Hour-${session.hour}_${dateStr}.xlsx`;

  // Save file
  const filePath = path.join(REPORTS_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);

  // Create report record
  const reportId = `RPT-${uuidv4().slice(0, 8).toUpperCase()}`;
  const report = await Report.create({
    reportId,
    sessionId: session._id,
    classId: session.classId._id || session.classId,
    subjectId: session.subjectId._id || session.subjectId,
    teacherId: session.teacherId._id || session.teacherId,
    date: session.date,
    hour: session.hour,
    fileName,
    filePath,
    generatedBy: generatedByUserId,
    stats: {
      totalStudents,
      present: presentCount,
      absent: absentCount,
      od: odCount,
      percentage,
    },
  });

  // Link report to session
  session.reportId = report._id;
  await session.save();

  await logAudit(generatedByUserId, 'REPORT_GENERATE', 'Report', report._id, {
    fileName,
    sessionId: session.sessionId,
  }, null);

  return {
    report,
    stats: {
      totalStudents,
      present: presentCount,
      absent: absentCount,
      od: odCount,
      percentage,
    },
  };
};

/**
 * Get a report by ID.
 */
const getReport = async (reportId) => {
  const report = await Report.findById(reportId)
    .populate('classId', 'name year')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'name');

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  return report;
};

/**
 * Get reports with filters.
 */
const getReports = async (filters = {}, page = 1, limit = 20) => {
  const query = {};

  if (filters.classId) query.classId = filters.classId;
  if (filters.subjectId) query.subjectId = filters.subjectId;
  if (filters.teacherId) query.teacherId = filters.teacherId;
  if (filters.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }
  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .populate('classId', 'name year')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name')
      .sort({ date: -1, hour: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(query),
  ]);

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get the file path for downloading a report.
 */
const getReportFile = async (reportId) => {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  if (!report.filePath || !fs.existsSync(report.filePath)) {
    throw new AppError('Report file not found on server.', 404);
  }

  return {
    filePath: report.filePath,
    fileName: report.fileName,
  };
};

module.exports = {
  generateSessionReport,
  getReport,
  getReports,
  getReportFile,
};
