import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Shield } from 'lucide-react';

export default function FaceRegistrationAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-800">Face Registration Monitoring</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500">Total Students</div>
          <div className="text-2xl font-bold">1,245</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500">Face Registered</div>
          <div className="text-2xl font-bold text-emerald-600">1,100</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500">Pending</div>
          <div className="text-2xl font-bold text-amber-500">145</div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-left text-sm font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Registered Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-6 py-4">John Doe (REG001)</td>
              <td className="px-6 py-4"><Badge variant="success">Registered</Badge></td>
              <td className="px-6 py-4">2023-10-01</td>
            </tr>
            <tr>
              <td className="px-6 py-4">Jane Smith (REG002)</td>
              <td className="px-6 py-4"><Badge variant="warning">Pending</Badge></td>
              <td className="px-6 py-4">-</td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}
