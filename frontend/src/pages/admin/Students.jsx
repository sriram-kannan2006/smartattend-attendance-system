import React from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function Students() {
  const students = [
    { id: 1, reg: 'REG001', name: 'John Doe', email: 'john@example.com', dept: 'CSE', class: '3', face: true },
    { id: 2, reg: 'REG002', name: 'Jane Smith', email: 'jane@example.com', dept: 'CSE', class: '3', face: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Students</h1>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search students..." className="pl-10" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-left text-sm font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Register No</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4">Face Auth</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(s => (
              <tr key={s.id}>
                <td className="px-6 py-4 font-medium">{s.reg}</td>
                <td className="px-6 py-4">{s.name}</td>
                <td className="px-6 py-4">{s.dept}</td>
                <td className="px-6 py-4">{s.class}</td>
                <td className="px-6 py-4">
                  <Badge variant={s.face ? 'success' : 'warning'}>
                    {s.face ? 'Registered' : 'Pending'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
