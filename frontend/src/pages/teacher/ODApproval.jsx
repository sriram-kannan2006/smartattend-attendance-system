import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { odService } from '@/services/odService';
import { useToast } from '@/context/ToastContext';
import { FileText, Check, X, Clock, Calendar, Search, Loader2 } from 'lucide-react';

export default function ODApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processingId, setProcessingId] = useState(null);
  const { showSuccess, showError } = useToast();

  const fetchODRequests = async () => {
    try {
      setLoading(true);
      const res = await odService.getODRequests({ status: statusFilter !== 'ALL' ? statusFilter : undefined });
      const data = res?.data?.data || res?.data || res;
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load OD requests:', err);
      showError('Failed to load OD requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchODRequests();
  }, [statusFilter]);

  const handleDecision = async (id, status) => {
    try {
      setProcessingId(id);
      await odService.updateODRequest(id, { status });
      showSuccess(`OD request ${status.toLowerCase()} successfully!`);
      setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
    } catch (err) {
      console.error('Decision error:', err);
      showError(err.response?.data?.message || 'Failed to update OD request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">On-Duty (OD) Approvals</h1>
          <p className="text-sm text-slate-500">Review and approve student on-duty attendance requests</p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No OD Requests</h3>
          <p className="text-xs text-slate-400 mt-1">There are no {statusFilter.toLowerCase()} OD applications to review.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((od) => (
            <Card key={od._id} className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={
                      od.status === 'APPROVED' ? 'success' : od.status === 'REJECTED' ? 'error' : 'warning'
                    }
                  >
                    {od.status}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(od.date).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-0.5">
                  {od.studentId?.name || 'Student'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mb-3">
                  {od.studentId?.registerNumber || '—'}
                </p>

                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mb-3">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Duration:</span>
                    <span className="font-semibold text-slate-800">Hours {od.startHour} to {od.endHour}</span>
                  </div>
                  {od.event && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Event:</span>
                      <span className="font-semibold text-slate-800">{od.event}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 italic">
                  "{od.reason}"
                </p>
              </div>

              {od.status === 'PENDING' && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                    disabled={processingId === od._id}
                    onClick={() => handleDecision(od._id, 'APPROVED')}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-200 font-semibold rounded-xl"
                    disabled={processingId === od._id}
                    onClick={() => handleDecision(od._id, 'REJECTED')}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
