import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { reportService } from '@/services/reportService';
import { adminService } from '@/services/adminService';
import { useToast } from '@/context/ToastContext';
import { FileSpreadsheet, Download, Eye, Calendar, Filter, Search, BookOpen, Users, Loader2 } from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const { showSuccess, showError } = useToast();

  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    date: '',
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReports(filters);
      const data = res?.data?.data || res?.data || res;
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      showError('Failed to load institutional reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [clsRes, subRes] = await Promise.all([
          adminService.getClasses(),
          adminService.getSubjects(),
        ]);
        setClasses(clsRes?.data?.data || clsRes?.data || []);
        setSubjects(subRes?.data?.data || subRes?.data || []);
      } catch (err) {
        console.error('Metadata load error:', err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const handleDownload = (report) => {
    try {
      window.open(`/api/reports/${report._id}/download`, '_blank');
      showSuccess(`Downloading ${report.fileName}...`);
    } catch (err) {
      showError('Failed to download report');
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Report Library</h1>
          <p className="text-sm text-slate-500">Search, inspect, and export official 4-sheet Excel attendance records</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.classId}
            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filters.subjectId}
            onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Generated Reports</h3>
          <p className="text-xs text-slate-400 mt-1">Reports are automatically generated when teachers finalize sessions.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Teacher</th>
                  <th className="py-3.5 px-4 text-center">Attendance Breakdown</th>
                  <th className="py-3.5 px-4 text-center">Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rpt) => (
                  <tr key={rpt._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {new Date(rpt.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="block text-[10px] text-slate-400 font-mono">Hour {rpt.hour}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{rpt.classId?.name || 'Class'}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{rpt.subjectId?.name || 'Subject'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rpt.subjectId?.code}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{rpt.teacherId?.name || 'Faculty'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          P: {rpt.stats?.present || 0}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold text-[10px]">
                          A: {rpt.stats?.absent || 0}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">
                          OD: {rpt.stats?.od || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-800">
                      {rpt.stats?.percentage || 0}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(rpt)}
                          className="h-8 px-2.5 rounded-lg text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleDownload(rpt)}
                          className="h-8 px-2.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Excel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Report Summary Modal */}
      {selectedReport && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`Report Summary: ${selectedReport.reportId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Subject</span><span className="font-bold text-slate-800">{selectedReport.subjectId?.name} ({selectedReport.subjectId?.code})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Class</span><span className="font-semibold text-slate-800">{selectedReport.classId?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Faculty</span><span className="font-semibold text-slate-800">{selectedReport.teacherId?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date & Hour</span><span className="font-semibold text-slate-800">{new Date(selectedReport.date).toLocaleDateString('en-IN')} (Hour {selectedReport.hour})</span></div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-100 rounded-xl"><span className="text-[10px] text-slate-500 block uppercase font-bold">Total</span><span className="text-base font-extrabold text-slate-800">{selectedReport.stats?.totalStudents || 0}</span></div>
              <div className="p-2.5 bg-emerald-50 rounded-xl"><span className="text-[10px] text-emerald-600 block uppercase font-bold">Present</span><span className="text-base font-extrabold text-emerald-600">{selectedReport.stats?.present || 0}</span></div>
              <div className="p-2.5 bg-red-50 rounded-xl"><span className="text-[10px] text-red-600 block uppercase font-bold">Absent</span><span className="text-base font-extrabold text-red-600">{selectedReport.stats?.absent || 0}</span></div>
              <div className="p-2.5 bg-amber-50 rounded-xl"><span className="text-[10px] text-amber-600 block uppercase font-bold">OD</span><span className="text-base font-extrabold text-amber-600">{selectedReport.stats?.od || 0}</span></div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700 flex items-start gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-slate-900">Multi-Sheet Excel Workbook</span>
                Includes Sheet 1 (Detailed Scans), Sheet 2 (Institutional Summary), Sheet 3 (Absent Roll), Sheet 4 (OD Approvals).
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowViewModal(false)} className="flex-1 rounded-xl">
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownload(selectedReport)}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download File
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
