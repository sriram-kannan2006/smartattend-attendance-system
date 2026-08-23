import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { odService } from '@/services/odService';
import { useToast } from '@/context/ToastContext';
import { FileText, Plus, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ODManagement() {
  const [odList, setOdList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    startHour: 1,
    endHour: 4,
    reason: '',
    event: '',
  });

  const fetchODHistory = async () => {
    try {
      setLoading(true);
      const res = await odService.getODRequests();
      const data = res?.data?.data || res?.data || res;
      setOdList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load OD history:', err);
      showError('Failed to load OD applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchODHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showError('Please provide a reason for OD');
      return;
    }

    try {
      setSubmitting(true);
      await odService.createODRequest({
        ...formData,
        startHour: parseInt(formData.startHour, 10),
        endHour: parseInt(formData.endHour, 10),
      });
      showSuccess('OD Application submitted for faculty approval!');
      setShowApplyModal(false);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        startHour: 1,
        endHour: 4,
        reason: '',
        event: '',
      });
      fetchODHistory();
    } catch (err) {
      console.error('OD submit error:', err);
      showError(err.response?.data?.message || 'Failed to submit OD application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">On-Duty (OD) Management</h1>
          <p className="text-sm text-slate-500">Apply for official institutional OD to protect attendance record</p>
        </div>

        <Button
          onClick={() => setShowApplyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Apply for OD
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : odList.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No OD Applications</h3>
          <p className="text-xs text-slate-400 mt-1">You have not submitted any On-Duty requests yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {odList.map((od) => (
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
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(od.date).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 border border-slate-100 mb-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Hours:</span>
                    <span className="font-semibold text-slate-800">Hour {od.startHour} – Hour {od.endHour}</span>
                  </div>
                  {od.event && (
                    <div className="flex justify-between text-slate-600">
                      <span>Event / Activity:</span>
                      <span className="font-semibold text-slate-800">{od.event}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 italic">
                  "{od.reason}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Applied: {new Date(od.createdAt || od.date).toLocaleDateString('en-IN')}</span>
                {od.status === 'APPROVED' && <span className="text-emerald-600 font-semibold">Exempted from Absence</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Apply OD Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for On-Duty (OD)"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Start Hour</label>
              <select
                value={formData.startHour}
                onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>Hour {h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">End Hour</label>
              <select
                value={formData.endHour}
                onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h} disabled={h < formData.startHour}>Hour {h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Event / Symposium (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Smart India Hackathon / Sports Meet"
              value={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Reason</label>
            <textarea
              rows={3}
              placeholder="Detailed justification for OD application..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApplyModal(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
