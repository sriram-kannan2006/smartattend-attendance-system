import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, Users, AlertTriangle, Clock, Calendar, Search, Filter, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { reportService } from '@/services/reportService';
import { useToast } from '@/context/ToastContext';

export default function WardenDashboard() {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  // Sample data for hostel absentees & OD
  const [hostelAbsentees, setHostelAbsentees] = useState([
    { id: 1, name: 'Sriram Krishnan', regNo: '24ECR100', hostel: "Men's Hostel A", block: 'Block 1', room: '204', subject: 'Signals and Systems', hour: 3, status: 'ABSENT' },
    { id: 2, name: 'Karthik Sundaram', regNo: '24ECR102', hostel: "Men's Hostel A", block: 'Block 2', room: '112', subject: 'Digital Electronics', hour: 2, status: 'ABSENT' },
    { id: 3, name: 'Vijay Shankar', regNo: '24ECR106', hostel: "Men's Hostel A", block: 'Block 1', room: '308', subject: 'Mathematics III', hour: 1, status: 'ABSENT' },
    { id: 4, name: 'Aishwarya Balaji', regNo: '24ECR101', hostel: "Women's Hostel B", block: 'Block 1', room: '105', subject: 'Electronics Lab', hour: 4, status: 'OD' },
    { id: 5, name: 'Divya Priya', regNo: '24ECR103', hostel: "Women's Hostel B", block: 'Block 2', room: '210', subject: 'Digital Electronics', hour: 2, status: 'ABSENT' },
  ]);

  useEffect(() => {
    const loadHostelData = async () => {
      try {
        setLoading(true);
        const res = await adminService.getHostels();
        const data = res?.data?.data || res?.data || [];
        setHostels(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Hostel load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHostelData();
  }, []);

  const filteredStudents = hostelAbsentees.filter((s) => {
    if (selectedHostel === 'ALL') return true;
    return s.hostel.toLowerCase().includes(selectedHostel.toLowerCase());
  });

  const totalHostelStudents = 180;
  const absentTodayCount = filteredStudents.filter(s => s.status === 'ABSENT').length;
  const odTodayCount = filteredStudents.filter(s => s.status === 'OD').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              KEC Hostel Warden Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Kongu Engineering College (Autonomous)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Resident Absence Roster</h1>
          <p className="text-xs text-slate-500">Live monitoring of resident hostel students' academic hour presence & absentees</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Hostels</option>
            <option value="Men">Men's Hostel A</option>
            <option value="Women">Women's Hostel B</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Total Resident Students</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalHostelStudents}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Hostel Absentees Today</span>
            <span className="text-2xl font-extrabold text-red-600">{absentTodayCount} students</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Approved On-Duty (OD)</span>
            <span className="text-2xl font-extrabold text-amber-600">{odTodayCount} students</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Hostel Attendance Rate</span>
            <span className="text-2xl font-extrabold text-emerald-600">
              {Math.round(((totalHostelStudents - absentTodayCount) / totalHostelStudents) * 100)}%
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Hostel Absence Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Hostel Absentee & OD Roster</h2>
            <p className="text-xs text-slate-500">Live feed updated whenever class attendance sessions close</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showSuccess('Exporting hostel absence log to spreadsheet...')}
            className="text-xs rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Log
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Hostel & Block</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Missed Course Hour</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{s.regNo}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {s.hostel} • <span className="text-slate-500 font-normal">{s.block}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{s.room}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{s.subject}</span>
                    <span className="text-[10px] text-slate-400">Hour {s.hour}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
