import React from 'react';
import { Users, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', attendance: 85 },
  { name: 'Tue', attendance: 88 },
  { name: 'Wed', attendance: 92 },
  { name: 'Thu', attendance: 80 },
  { name: 'Fri', attendance: 75 },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              KEC Administration
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Kongu Engineering College (Autonomous), Perundurai
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            SmartAttend Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-wide biometric and anti-proxy attendance monitoring across all engineering departments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value="4,250"
          trend="up"
          trendValue="2.1%"
          variant="primary"
        />
        <StatCard
          icon={BookOpen}
          label="Total Teachers"
          value="312"
          trend="up"
          trendValue="1.5%"
          variant="success"
        />
        <StatCard
          icon={GraduationCap}
          label="Avg. Attendance"
          value="88.5%"
          trend="down"
          trendValue="0.8%"
          variant="warning"
        />
        <StatCard
          icon={Building2}
          label="Departments"
          value="12"
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartContainer title="Weekly Attendance Overview" subtitle="Average attendance across all departments">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }} 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <div className="rounded-lg border border-secondary-200 bg-white shadow-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-secondary-100 last:border-0 last:pb-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary-600"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-900">System Update Completed</p>
                  <p className="text-xs text-secondary-500">The attendance sync server has been updated to v2.1.</p>
                  <p className="text-xs text-secondary-400 mt-1">{i} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
