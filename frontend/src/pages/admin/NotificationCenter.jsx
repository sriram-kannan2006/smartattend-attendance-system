import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/context/ToastContext';
import {
  Bell,
  Radio,
  Sliders,
  FileText,
  Building2,
  Users,
  History,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Check,
  X,
  Sparkles,
  Info,
  ShieldCheck,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';

export default function NotificationCenter() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'rules' | 'templates' | 'hods' | 'parents' | 'history'

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [hodsLoading, setHodsLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Data
  const [stats, setStats] = useState(null);
  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [supportedVariables, setSupportedVariables] = useState([]);
  const [hodsData, setHodsData] = useState({ departments: [], availableTeachers: [] });
  const [parents, setParents] = useState([]);
  const [parentsPagination, setParentsPagination] = useState({ page: 1, totalPages: 1 });
  const [parentSearch, setParentSearch] = useState('');
  const [jobs, setJobs] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({ status: '', channel: '', type: '', search: '', page: 1 });
  const [historyPagination, setHistoryPagination] = useState({ page: 1, totalPages: 1 });

  // Modals
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState({ channel: 'WHATSAPP', type: 'ABSENCE_ALERT', recipientAddress: '+918300380302' });
  const [testSubmitting, setTestSubmitting] = useState(false);

  const [editTemplateModal, setEditTemplateModal] = useState(null);
  const [templateForm, setTemplateForm] = useState({ title: '', body: '', isActive: true });
  const [previewResult, setPreviewResult] = useState(null);

  const [assignHodModal, setAssignHodModal] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [editParentModal, setEditParentModal] = useState(null);
  const [parentForm, setParentForm] = useState({ parentName: '', phone: '', whatsappNumber: '', whatsappOptIn: true, email: '', notificationPreferences: { inApp: true, email: true, whatsapp: true } });

  const [jobDetailModal, setJobDetailModal] = useState(null);

  // Load Overview Stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await notificationService.getStats();
      setStats(res.data?.data || null);
    } catch (err) {
      console.warn('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Tab dynamic loading
  useEffect(() => {
    if (activeTab === 'rules') loadRules();
    if (activeTab === 'templates') loadTemplates();
    if (activeTab === 'hods') loadHODs();
    if (activeTab === 'parents') loadParents();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadRules = async () => {
    try {
      setRulesLoading(true);
      const res = await notificationService.getRules();
      setRules(res.data?.data || []);
    } catch (err) {
      showError('Failed to load notification rules');
    } finally {
      setRulesLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await notificationService.getTemplates();
      setTemplates(res.data?.data || []);
      setSupportedVariables(res.data?.supportedVariables || []);
    } catch (err) {
      showError('Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadHODs = async () => {
    try {
      setHodsLoading(true);
      const res = await notificationService.getDepartmentHODs();
      setHodsData(res.data?.data || { departments: [], availableTeachers: [] });
    } catch (err) {
      showError('Failed to load department HOD mappings');
    } finally {
      setHodsLoading(false);
    }
  };

  const loadParents = async (page = 1, search = parentSearch) => {
    try {
      setParentsLoading(true);
      const res = await notificationService.getParentProfiles({ page, limit: 15, search });
      setParents(res.data?.data || []);
      setParentsPagination({ page: res.data?.page || 1, totalPages: res.data?.totalPages || 1 });
    } catch (err) {
      showError('Failed to load parent profiles');
    } finally {
      setParentsLoading(false);
    }
  };

  const loadHistory = async (filters = historyFilters) => {
    try {
      setHistoryLoading(true);
      const res = await notificationService.getNotificationJobs({ ...filters, limit: 15 });
      setJobs(res.data?.data?.jobs || []);
      setHistoryPagination({ page: res.data?.data?.page || 1, totalPages: res.data?.data?.totalPages || 1 });
    } catch (err) {
      showError('Failed to load notification history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle Rule Toggle
  const handleToggleRule = async (rule, channelKey) => {
    try {
      const updatedChannels = {
        ...rule.channels,
        [channelKey]: !rule.channels[channelKey],
      };
      const res = await notificationService.updateRule(rule._id, { channels: updatedChannels });
      setRules((prev) => prev.map((r) => (r._id === rule._id ? res.data?.data : r)));
      showSuccess(`Rule updated for ${rule.eventType} (${rule.recipientRole})`);
    } catch (err) {
      showError('Failed to update rule');
    }
  };

  // Handle Test Notification
  const handleTriggerTest = async (e) => {
    e.preventDefault();
    try {
      setTestSubmitting(true);
      const res = await notificationService.testNotification(testForm);
      showSuccess(res.data?.message || 'Test notification triggered successfully');
      setTestModalOpen(false);
      loadStats();
      if (activeTab === 'history') loadHistory();
    } catch (err) {
      showError(err.response?.data?.message || 'Test notification failed');
    } finally {
      setTestSubmitting(false);
    }
  };

  // Handle Template Preview & Save
  const handlePreviewTemplate = async () => {
    try {
      const res = await notificationService.previewTemplate({
        title: templateForm.title,
        body: templateForm.body,
      });
      setPreviewResult(res.data?.data || null);
    } catch (err) {
      showError('Preview generation error');
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      await notificationService.updateTemplate(editTemplateModal._id, templateForm);
      showSuccess('Template updated successfully');
      setEditTemplateModal(null);
      loadTemplates();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save template');
    }
  };

  // Handle HOD Assignment
  const handleAssignHOD = async (e) => {
    e.preventDefault();
    try {
      await notificationService.assignDepartmentHOD(assignHodModal.departmentId, {
        teacherId: selectedTeacherId || null,
      });
      showSuccess(`HOD assignment updated for ${assignHodModal.name}`);
      setAssignHodModal(null);
      loadHODs();
    } catch (err) {
      showError('Failed to assign HOD');
    }
  };

  // Handle Parent Save
  const handleSaveParent = async (e) => {
    e.preventDefault();
    try {
      await notificationService.updateParentProfile(editParentModal.studentId, parentForm);
      showSuccess(`Parent contact updated for ${editParentModal.studentName}`);
      setEditParentModal(null);
      loadParents(parentsPagination.page);
    } catch (err) {
      showError('Failed to update parent profile');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              Institutional Communications Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">Kongu Engineering College</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Notification Center</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Orchestrate In-App alerts, Email dispatch, and WhatsApp notifications across students, parents, HODs, and wardens.
          </p>
        </div>

        <Button
          onClick={() => setTestModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          <span>Trigger Test Notification</span>
        </Button>
      </div>

      {/* Channel Status & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* In-App Channel Card */}
        <Card className="p-5 rounded-3xl border border-emerald-100 bg-emerald-50/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-600" /> In-App Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ● ACTIVE
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.channels?.inApp?.count ?? 0}</div>
          <p className="text-[11px] text-slate-500">Live dashboard inboxes and real-time Socket.IO notifications.</p>
        </Card>

        {/* Email Channel Card */}
        <Card className="p-5 rounded-3xl border border-slate-200 bg-slate-50/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-500" /> Email Service
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
              ● NOT CONFIGURED
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-700">{stats?.channels?.email?.count ?? 0}</div>
          <p className="text-[11px] text-slate-500">Architecture prepared. SMTP credentials can be linked anytime.</p>
        </Card>

        {/* WhatsApp Channel Card */}
        <Card className="p-5 rounded-3xl border border-amber-200 bg-amber-50/50 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Channel
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
              ● DEVELOPMENT SIMULATION
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-950">{stats?.channels?.whatsapp?.count ?? 0}</div>
          <p className="text-[11px] text-amber-800 font-medium">Safe mock simulation active. No real WhatsApp API calls.</p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview & Statistics', icon: Radio },
          { id: 'rules', label: 'Notification Rules', icon: Sliders },
          { id: 'templates', label: 'Templates & Preview', icon: FileText },
          { id: 'hods', label: 'Department HOD Mapping', icon: Building2 },
          { id: 'parents', label: 'Parent Profiles & Opt-Ins', icon: Users },
          { id: 'history', label: 'Notification History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & STATISTICS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Jobs', value: stats?.overview?.total ?? 0, color: 'text-slate-900 bg-slate-50' },
              { label: 'Today Dispatched', value: stats?.overview?.todayCount ?? 0, color: 'text-blue-900 bg-blue-50' },
              { label: 'Sent (In-App)', value: stats?.overview?.sent ?? 0, color: 'text-emerald-900 bg-emerald-50' },
              { label: 'Simulated (WA)', value: stats?.overview?.simulated ?? 0, color: 'text-amber-900 bg-amber-50' },
              { label: 'Queued', value: stats?.overview?.queued ?? 0, color: 'text-indigo-900 bg-indigo-50' },
              { label: 'Failed', value: stats?.overview?.failed ?? 0, color: 'text-red-900 bg-red-50' },
            ].map((card, i) => (
              <div key={i} className={`p-4 rounded-2xl border border-slate-200 ${card.color} text-center space-y-1`}>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">{card.label}</span>
                <span className="text-xl font-extrabold block">{card.value}</span>
              </div>
            ))}
          </div>

          <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Architecture Highlights & Safety Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <strong className="block font-bold text-slate-900">🛡️ Non-Blocking Asynchronous Queue</strong>
                <p>
                  Attendance finalization triggers notifications in the background. If any notification fails,
                  attendance is still permanently recorded and Excel reports are generated without disruption.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <strong className="block font-bold text-slate-900">🔒 Strict Parent Privacy Protection</strong>
                <p>
                  Parents can only view attendance alerts for their own registered ward. Cross-student or class-wide
                  records are strictly blocked by backend security filters.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <strong className="block font-bold text-slate-900">📊 Single HOD Summary per Session</strong>
                <p>
                  When a session closes with multiple absentees, the department HOD receives exactly one summary alert
                  with attendance percentage rather than multiple spam notifications.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <strong className="block font-bold text-slate-900">📱 WhatsApp Development Simulation</strong>
                <p>
                  WhatsApp jobs are safely routed to the Mock provider and marked as SIMULATED. No real messages are
                  sent until Meta WhatsApp Business is officially configured.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NOTIFICATION RULES MATRIX                                          */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification Dispatch Rules</h2>
              <p className="text-xs text-slate-500">Configure which channels are active for each role and alert event.</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadRules} className="text-xs rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Rules
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Target Recipient</th>
                  <th className="py-3 px-4 text-center">In-App</th>
                  <th className="py-3 px-4 text-center">Email</th>
                  <th className="py-3 px-4 text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">{rule.eventType}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {rule.recipientRole}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleRule(rule, 'inApp')}
                        className={`w-6 h-6 rounded-lg inline-flex items-center justify-center cursor-pointer transition ${
                          rule.channels?.inApp ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {rule.channels?.inApp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleRule(rule, 'email')}
                        className={`w-6 h-6 rounded-lg inline-flex items-center justify-center cursor-pointer transition ${
                          rule.channels?.email ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {rule.channels?.email ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleRule(rule, 'whatsapp')}
                        className={`w-6 h-6 rounded-lg inline-flex items-center justify-center cursor-pointer transition ${
                          rule.channels?.whatsapp ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {rule.channels?.whatsapp ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMPLATES & PREVIEW                                                */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates list */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Message Templates</h2>
                  <p className="text-xs text-slate-500">Customizable message templates with dynamic variable placeholders.</p>
                </div>
              </div>

              <div className="space-y-3">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl._id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{tmpl.name}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {tmpl.channel}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditTemplateModal(tmpl);
                          setTemplateForm({ title: tmpl.title, body: tmpl.body, isActive: tmpl.isActive !== false });
                          setPreviewResult(null);
                        }}
                        className="text-xs rounded-xl"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit / Preview
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 font-mono line-clamp-2 bg-white p-2 rounded-xl border border-slate-200">
                      {tmpl.body}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Supported Variables Guide */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Supported Template Variables
              </h3>
              <p className="text-xs text-slate-500">
                You can insert any of these placeholders into template titles and message bodies:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {supportedVariables.map((v) => (
                  <span
                    key={v}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-blue-700 font-semibold"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEPARTMENT HOD MAPPING                                             */}
      {/* ========================================================================= */}
      {activeTab === 'hods' && (
        <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Department HOD Management</h2>
              <p className="text-xs text-slate-500">Assign designated faculty members as Head of Department (HOD) for attendance summaries.</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadHODs} className="text-xs rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Assigned HOD</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hodsData.departments.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{dept.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{dept.hodName}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{dept.hodPhone || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={dept.status === 'Active' ? 'success' : 'secondary'} className="text-[10px]">
                        {dept.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssignHodModal(dept);
                          setSelectedTeacherId(dept.hodId || '');
                        }}
                        className="text-xs rounded-xl"
                      >
                        Change HOD
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PARENT PROFILES & PREFERENCES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'parents' && (
        <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Parent Notification Profiles</h2>
              <p className="text-xs text-slate-500">Manage parent contact numbers, WhatsApp opt-in status, and alert preferences.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student / parent..."
                  value={parentSearch}
                  onChange={(e) => {
                    setParentSearch(e.target.value);
                    loadParents(1, e.target.value);
                  }}
                  className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Parent Name</th>
                  <th className="py-3 px-4">WhatsApp Number</th>
                  <th className="py-3 px-4">WhatsApp Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parents.map((p) => (
                  <tr key={p.studentId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.registerNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.studentName}</td>
                    <td className="py-3 px-4 text-slate-700">{p.parentName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.whatsappNumber || p.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {p.whatsappStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditParentModal(p);
                          setParentForm({
                            parentName: p.parentName,
                            phone: p.phone,
                            whatsappNumber: p.whatsappNumber,
                            whatsappOptIn: p.whatsappOptIn,
                            email: p.email,
                            notificationPreferences: p.notificationPreferences,
                          });
                        }}
                        className="text-xs rounded-xl"
                      >
                        Edit Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: NOTIFICATION HISTORY & AUDIT LOG                                   */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <Card className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification History & Audit Log</h2>
              <p className="text-xs text-slate-500">Live stream of all queued, sent, simulated, and retried notification events.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => loadHistory()} className="text-xs rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No notification events recorded yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(job.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{job.jobId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {job.payload?.studentName || job.recipientId?.name || job.recipientAddress || 'Recipient'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {job.recipientRole || 'USER'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-700">{job.channel}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{job.type}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            job.status === 'SENT' || job.status === 'DELIVERED'
                              ? 'success'
                              : job.status === 'SIMULATED'
                              ? 'warning'
                              : job.status === 'FAILED'
                              ? 'danger'
                              : 'secondary'
                          }
                          className="text-[10px] font-bold"
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setJobDetailModal(job)}
                          className="text-xs p-1"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRIGGER TEST NOTIFICATION                                          */}
      {/* ========================================================================= */}
      <Modal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Trigger Test Notification (Admin Development Mode)"
      >
        <form onSubmit={handleTriggerTest} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 space-y-1">
            <strong className="block font-bold">Notification Simulation Test</strong>
            <p>
              Triggering WhatsApp will run through the MockWhatsAppProvider and record a SIMULATED job log with zero external calls.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Notification Channel:</label>
            <select
              value={testForm.channel}
              onChange={(e) => setTestForm({ ...testForm, channel: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
            >
              <option value="WHATSAPP">WhatsApp (Simulation Mode)</option>
              <option value="IN_APP">In-App Notification</option>
              <option value="EMAIL">Email (Prepared / Unconfigured)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Event Type:</label>
            <select
              value={testForm.type}
              onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
            >
              <option value="ABSENCE_ALERT">Absence Alert</option>
              <option value="HOD_ATTENDANCE_SUMMARY">HOD Attendance Summary</option>
              <option value="LOW_ATTENDANCE_ALERT">Low Attendance Warning</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Recipient Phone / WhatsApp Number:</label>
            <input
              type="text"
              value={testForm.recipientAddress}
              onChange={(e) => setTestForm({ ...testForm, recipientAddress: e.target.value })}
              placeholder="+919876543210"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setTestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={testSubmitting} className="bg-blue-600 font-bold">
              Dispatch Test Job
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT TEMPLATE & PREVIEW                                            */}
      {/* ========================================================================= */}
      <Modal
        open={!!editTemplateModal}
        onClose={() => setEditTemplateModal(null)}
        title={`Edit Template: ${editTemplateModal?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Template Title / Subject:</label>
            <input
              type="text"
              value={templateForm.title}
              onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Message Body (Supports Placeholders):</label>
            <textarea
              rows={5}
              value={templateForm.body}
              onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs"
              required
            />
          </div>

          {/* Live Preview Button */}
          <div className="flex items-center justify-between pt-1">
            <Button type="button" size="sm" variant="outline" onClick={handlePreviewTemplate} className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" /> Generate Live Preview
            </Button>
          </div>

          {previewResult && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-2 font-mono text-xs border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Live Sample Preview:</span>
              <div className="font-bold text-white text-xs">{previewResult.renderedTitle}</div>
              <div className="whitespace-pre-wrap text-slate-300 text-xs">{previewResult.renderedBody}</div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditTemplateModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">
              Save Template Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN DEPARTMENT HOD                                              */}
      {/* ========================================================================= */}
      <Modal
        open={!!assignHodModal}
        onClose={() => setAssignHodModal(null)}
        title={`Assign HOD for ${assignHodModal?.name || ''}`}
      >
        <form onSubmit={handleAssignHOD} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900">
            Select a faculty member from the department to assign as Head of Department (HOD).
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Select Faculty Member:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
            >
              <option value="">-- Unassigned --</option>
              {hodsData.availableTeachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setAssignHodModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PARENT CONTACT DETAILS                                        */}
      {/* ========================================================================= */}
      <Modal
        open={!!editParentModal}
        onClose={() => setEditParentModal(null)}
        title={`Parent Contact: ${editParentModal?.studentName || ''}`}
      >
        <form onSubmit={handleSaveParent} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Parent / Guardian Name:</label>
            <input
              type="text"
              value={parentForm.parentName}
              onChange={(e) => setParentForm({ ...parentForm, parentName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">WhatsApp Contact Number:</label>
            <input
              type="text"
              value={parentForm.whatsappNumber}
              onChange={(e) => setParentForm({ ...parentForm, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              placeholder="+918300380302"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Parent Email (Optional):</label>
            <input
              type="email"
              value={parentForm.email}
              onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="whatsappOptIn"
              checked={parentForm.whatsappOptIn}
              onChange={(e) => setParentForm({ ...parentForm, whatsappOptIn: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600"
            />
            <label htmlFor="whatsappOptIn" className="font-bold text-slate-800">
              WhatsApp Notifications Opted-In (Simulation Mode)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditParentModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NOTIFICATION JOB DETAIL VIEW                                       */}
      {/* ========================================================================= */}
      <Modal
        open={!!jobDetailModal}
        onClose={() => setJobDetailModal(null)}
        title={`Notification Job: ${jobDetailModal?.jobId || ''}`}
        size="md"
      >
        {jobDetailModal && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                <span className="font-bold text-slate-900">{jobDetailModal.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Channel</span>
                <span className="font-bold text-blue-600">{jobDetailModal.channel}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Type</span>
                <span className="font-bold text-slate-900">{jobDetailModal.type}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient Address</span>
                <span className="font-mono text-slate-700">{jobDetailModal.recipientAddress || '—'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Payload Content:</span>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-48">
                {JSON.stringify(jobDetailModal.payload, null, 2)}
              </pre>
            </div>

            {jobDetailModal.error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-200 font-mono text-[11px]">
                <strong>Error:</strong> {String(jobDetailModal.error)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
