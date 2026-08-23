import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Mail,
  Phone,
  Home,
  ShieldCheck,
  Filter,
  Loader2,
  RefreshCw,
  ScanFace
} from 'lucide-react';

export default function TeacherStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [faceFilter, setFaceFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      const [studRes, classRes] = await Promise.all([
        api.get('/students', { params: { limit: 200 } }).catch(() => ({ data: { data: [] } })),
        api.get('/classes').catch(() => ({ data: { data: [] } })),
      ]);

      const studList = studRes?.data?.data || studRes?.data?.students || [];
      const clsList = classRes?.data?.data || [];

      setStudents(Array.isArray(studList) ? studList : []);
      setClasses(Array.isArray(clsList) ? clsList : []);
    } catch (err) {
      console.warn('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  const filteredStudents = students.filter((st) => {
    const query = searchQuery.toLowerCase();
    const name = st.name?.toLowerCase() || '';
    const regNo = st.registerNumber?.toLowerCase() || '';
    const rollNo = st.rollNumber?.toLowerCase() || '';
    const email = st.email?.toLowerCase() || '';

    const matchesSearch = name.includes(query) || regNo.includes(query) || rollNo.includes(query) || email.includes(query);

    const matchesClass =
      selectedClassId === 'ALL' ||
      (st.classId?._id || st.classId) === selectedClassId;

    const matchesFace =
      faceFilter === 'ALL' ||
      (faceFilter === 'REGISTERED' && st.faceStatus === 'REGISTERED') ||
      (faceFilter === 'PENDING' && st.faceStatus !== 'REGISTERED');

    return matchesSearch && matchesClass && matchesFace;
  });

  const registeredCount = students.filter((s) => s.faceStatus === 'REGISTERED').length;
  const pendingFaceCount = students.length - registeredCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Class Student Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enrolled student list for ECE Department with face biometric enrollment and contact details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchStudentsData}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{students.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Biometric Registered</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{registeredCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Enrollment</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingFaceCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ScanFace className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-slate-200 bg-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Roll No (e.g. 24ECR177), or Register Number..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Classes / Sections</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <select
              value={faceFilter}
              onChange={(e) => setFaceFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Biometric Statuses</option>
              <option value="REGISTERED">Registered (Verified)</option>
              <option value="PENDING">Pending Registration</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Student Table */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Showing {filteredStudents.length} Students
          </span>
          <span className="text-xs text-slate-500">ECE Department Roster</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 mt-2">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students match your query</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching for a different roll number.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Register / Roll No</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Biometric Status</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Contact Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st, idx) => {
                  const isReg = st.faceStatus === 'REGISTERED';
                  return (
                    <tr key={st._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {st.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{st.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{st.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                          {st.registerNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {st.classId?.name || 'ECE III Year - Sec D'}
                      </td>
                      <td className="py-3 px-4">
                        {isReg ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            REGISTERED
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <ScanFace className="h-3 w-3" />
                            PENDING
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-600">
                          {st.isHosteller ? 'HOSTELLER' : 'DAY SCHOLAR'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {st.phone ? `+91 ${st.phone}` : 'N/A'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
