import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function Classes() {
  const [classes, setClasses] = useState([
    { id: 1, name: 'B.Tech CSE A', dept: 'CSE', year: '3', sections: 'A', status: 'Active' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Classes</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-left text-sm font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Year</th>
              <th className="px-6 py-4">Sections</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td className="px-6 py-4 font-medium">{cls.name}</td>
                <td className="px-6 py-4 text-slate-600">{cls.dept}</td>
                <td className="px-6 py-4 text-slate-600">{cls.year}</td>
                <td className="px-6 py-4 text-slate-600">{cls.sections}</td>
                <td className="px-6 py-4"><Badge variant="success">{cls.status}</Badge></td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4 text-slate-500" /></Button>
                  <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Class">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div><label className="block text-sm font-medium mb-1">Name</label><Input required /></div>
          <div><label className="block text-sm font-medium mb-1">Department</label><select className="w-full border rounded-md p-2"><option>CSE</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Year</label><select className="w-full border rounded-md p-2"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Sections (comma separated)</label><Input /></div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
