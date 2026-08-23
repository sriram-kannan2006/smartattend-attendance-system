import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { attendanceService } from '@/services/attendanceService';
import { useToast } from '@/context/ToastContext';
import { Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, Search, Filter, Loader2 } from 'lucide-react';

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { showError } = useToast();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getStudentAttendance();
      const data = res?.data?.data || res?.data || res;
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to load history:', err);
      showError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredRecords = records.filter((rec) => {
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    const matchesSearch =
      search === '' ||
      rec.subjectId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      rec.subjectId?.code?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
          <p className="text-sm text-slate-500">View your verified attendance log across all registered hours</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'PRESENT', 'ABSENT', 'OD'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Records Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no attendance events matching the filter criteria.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Hour</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Verified Time</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {new Date(rec.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-600">Hour {rec.hour}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {rec.subjectId?.name || 'Class Subject'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.subjectId?.code || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {rec.scannedAt ? new Date(rec.scannedAt).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : rec.status === 'ABSENT'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {rec.status === 'PRESENT' && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                        {rec.status === 'OD' && <Clock className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
