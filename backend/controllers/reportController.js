const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');

/**
 * @desc    Generate report for a session (POST)
 * @route   POST /api/reports/generate/:sessionId
 * @access  Private (TEACHER, ADMIN)
 */
const generateReport = asyncHandler(async (req, res) => {
  const result = await reportService.generateSessionReport(
    req.params.sessionId,
    req.user._id,
    req
  );

  res.status(201).json({
    success: true,
    message: 'Report generated successfully',
    data: result,
  });
});

/**
 * @desc    Generate and directly download Excel file (GET)
 * @route   GET /api/reports/generate/:sessionId
 *          GET /api/reports/session/:sessionId/download
 * @access  Private (TEACHER, ADMIN)
 */
const streamSessionReport = asyncHandler(async (req, res) => {
  const result = await reportService.generateSessionReport(
    req.params.sessionId,
    req.user._id,
    req
  );

  const report = result.report;
  if (!report.filePath || !fs.existsSync(report.filePath)) {
    return res.status(404).json({ success: false, message: 'Report file could not be generated' });
  }

  await logAudit(req.user._id, 'REPORT_DOWNLOAD_STREAM', 'Report', report._id, { fileName: report.fileName }, req);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
  res.download(report.filePath, report.fileName);
});

/**
 * @desc    Get all reports (with filters)
 * @route   GET /api/reports
 * @access  Private (TEACHER, ADMIN)
 */
const getReports = asyncHandler(async (req, res) => {
  const { classId, subjectId, teacherId, date, startDate, endDate, page = 1, limit = 20 } = req.query;

  const result = await reportService.getReports(
    { classId, subjectId, teacherId, date, startDate, endDate },
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private (TEACHER, ADMIN)
 */
const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReport(req.params.id);

  res.status(200).json({
    success: true,
    data: report,
  });
});

/**
 * @desc    Download report Excel file by Report ID
 * @route   GET /api/reports/:id/download
 * @access  Private (TEACHER, ADMIN)
 */
const downloadReport = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await reportService.getReportFile(req.params.id);

  await logAudit(req.user._id, 'REPORT_DOWNLOAD', 'Report', req.params.id, { fileName }, req);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.download(filePath, fileName);
});

module.exports = { 
  generateReport, 
  streamSessionReport, 
  getReports, 
  getReport, 
  downloadReport 
};
