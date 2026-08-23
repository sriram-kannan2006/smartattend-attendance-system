import React from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Plus } from 'lucide-react';

export default function Subjects() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Subject</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-8 text-center text-slate-500">
        Subjects list will appear here.
      </div>
    </div>
  );
}
