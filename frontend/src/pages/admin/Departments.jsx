import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function Departments() {
  const [departments, setDepartments] = useState([
    { id: '1', name: 'Computer Science', code: 'CSE', hod: 'Dr. Smith', status: 'Active' },
    { id: '2', name: 'Information Technology', code: 'IT', hod: 'Dr. Jones', status: 'Active' }
  ]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
        <Button onClick={() => { setEditingDept(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search departments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-left text-sm font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">HOD</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-800">{dept.name}</td>
                <td className="px-6 py-4 text-slate-600">{dept.code}</td>
                <td className="px-6 py-4 text-slate-600">{dept.hod}</td>
                <td className="px-6 py-4">
                  <Badge variant={dept.status === 'Active' ? 'success' : 'secondary'}>{dept.status}</Badge>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingDept(dept); setIsModalOpen(true); }}>
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDept ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <Input defaultValue={editingDept?.name} placeholder="e.g. Computer Science" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <Input defaultValue={editingDept?.code} placeholder="e.g. CSE" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">HOD</label>
            <Input defaultValue={editingDept?.hod} placeholder="HOD Name" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
