import React from 'react';
import { Button } from '@/components/ui/Button';

export default function Teachers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Teachers</h1>
        <Button>Add Teacher</Button>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center text-slate-500">
        Teacher list goes here.
      </div>
    </div>
  );
}
