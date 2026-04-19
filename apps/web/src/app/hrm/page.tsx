'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, RefreshCw, Edit2, Trash2, X, Check,
  UserCheck, Clock, Calendar, Banknote, Building2, Phone, Mail,
  AlertCircle, ChevronRight, Award
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  employeeCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  employmentType: string;
  status: string;
  joiningDate: string | null;
  salary: number | null;
  manager?: { id: string; name: string } | null;
  _count?: { attendances: number; leaves: number };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number | null;
  notes: string | null;
  employee: { id: string; name: string; designation: string | null; department: string | null };
}

interface LeaveRecord {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  employee: { id: string; name: string; designation: string | null; department: string | null };
  approvedBy: { id: string; name: string } | null;
}

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  tax: number;
  pfEmployee: number;
  netPay: number;
  status: string;
  paidAt: string | null;
  employee: { id: string; name: string; designation: string | null };
}

interface HRMStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  presentToday: number;
  totalPayroll: number;
  departments: { name: string | null; count: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const EMPLOYEE_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID'];
const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE', 'HOLIDAY'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  TERMINATED: 'bg-red-100 text-red-700',
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT: 'bg-red-100 text-red-700',
  HALF_DAY: 'bg-amber-100 text-amber-700',
  LATE: 'bg-orange-100 text-orange-700',
  HOLIDAY: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-gray-100 text-gray-600',
  PROCESSED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
};

// ─── Employee Form Modal ──────────────────────────────────────────────────────

function EmployeeModal({ initial, onClose, onSaved }: { initial?: Partial<Employee>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    employeeCode: initial?.employeeCode || '',
    designation: initial?.designation || '',
    department: initial?.department || '',
    employmentType: initial?.employmentType || 'FULL_TIME',
    status: initial?.status || 'ACTIVE',
    joiningDate: initial?.joiningDate ? initial.joiningDate.split('T')[0] : '',
    salary: initial?.salary ? String(initial.salary) : '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setErr('Name is required'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        name: form.name, email: form.email || undefined, phone: form.phone || undefined,
        employeeCode: form.employeeCode || undefined, designation: form.designation || undefined,
        department: form.department || undefined, employmentType: form.employmentType,
        status: form.status, joiningDate: form.joiningDate || undefined,
        salary: form.salary ? parseFloat(form.salary) : undefined,
      };
      if (initial?.id) {
        await apiFetch(`/hrm/employees/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/hrm/employees', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{initial?.id ? 'Edit Employee' : 'Add Employee'}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Employee name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employee Code</label>
              <input value={form.employeeCode} onChange={e => set('employeeCode', e.target.value)} placeholder="e.g. EMP001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
              <input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Software Engineer"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employment Type</label>
              <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {EMPLOYEE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Salary (₹)</label>
              <input type="number" value={form.salary} onChange={e => set('salary', e.target.value)} min="0" step="100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            {initial?.id ? 'Update' : 'Add Employee'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Attendance Modal ─────────────────────────────────────────────────────────

function AttendanceModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.employeeId || !form.date) { setErr('Employee and date are required'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/hrm/attendance', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: form.employeeId,
          date: form.date,
          checkIn: form.checkIn ? `${form.date}T${form.checkIn}:00` : undefined,
          checkOut: form.checkOut ? `${form.date}T${form.checkOut}:00` : undefined,
          status: form.status,
          notes: form.notes || undefined,
        }),
      });
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Mark Attendance</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee *</label>
            <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="">Select employee</option>
              {employees.filter(e => e.status === 'ACTIVE').map(e => (
                <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check In</label>
              <input type="time" value={form.checkIn} onChange={e => set('checkIn', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check Out</label>
              <input type="time" value={form.checkOut} onChange={e => set('checkOut', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            Save Attendance
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Leave Modal ──────────────────────────────────────────────────────────────

function LeaveModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ employeeId: '', type: 'CASUAL', startDate: '', endDate: '', days: '1', reason: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate) { setErr('Employee, start and end dates are required'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/hrm/leaves', {
        method: 'POST',
        body: JSON.stringify({ employeeId: form.employeeId, type: form.type, startDate: form.startDate, endDate: form.endDate, days: parseFloat(form.days), reason: form.reason || undefined }),
      });
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Apply Leave</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee *</label>
            <select value={form.employeeId} onChange={e => set('employeeId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="">Select employee</option>
              {employees.filter(e => e.status === 'ACTIVE').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Days</label>
              <input type="number" value={form.days} onChange={e => set('days', e.target.value)} min="0.5" step="0.5"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2} placeholder="Reason for leave"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            Apply Leave
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Payroll Modal ────────────────────────────────────────────────────────────

function PayrollModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const [form, setForm] = useState({
    employeeId: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()),
    basic: '', hra: '', allowances: '', deductions: '', tax: '', pfEmployee: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const netPay = (parseFloat(form.basic) || 0) + (parseFloat(form.hra) || 0) + (parseFloat(form.allowances) || 0)
    - (parseFloat(form.deductions) || 0) - (parseFloat(form.tax) || 0) - (parseFloat(form.pfEmployee) || 0);

  const handleEmpChange = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (emp?.salary) {
      const basic = emp.salary * 0.5;
      const hra = emp.salary * 0.2;
      const allowances = emp.salary * 0.3;
      setForm(p => ({ ...p, employeeId: id, basic: String(basic), hra: String(hra), allowances: String(allowances) }));
    } else {
      setForm(p => ({ ...p, employeeId: id }));
    }
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.basic) { setErr('Employee and basic salary are required'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/hrm/payroll', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: form.employeeId, month: parseInt(form.month), year: parseInt(form.year),
          basic: parseFloat(form.basic), hra: parseFloat(form.hra) || 0, allowances: parseFloat(form.allowances) || 0,
          deductions: parseFloat(form.deductions) || 0, tax: parseFloat(form.tax) || 0, pfEmployee: parseFloat(form.pfEmployee) || 0,
        }),
      });
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Process Payroll</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee *</label>
            <select value={form.employeeId} onChange={e => handleEmpChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="">Select employee</option>
              {employees.filter(e => e.status === 'ACTIVE').map(e => <option key={e.id} value={e.id}>{e.name}{e.designation ? ` — ${e.designation}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select value={form.month} onChange={e => set('month', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="2020" max="2030"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            {[['basic', 'Basic Salary *'], ['hra', 'HRA'], ['allowances', 'Allowances']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label} (₹)</label>
                <input type="number" value={(form as any)[k]} onChange={e => set(k, e.target.value)} min="0" step="100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            ))}
            {[['deductions', 'Deductions'], ['tax', 'Tax (TDS)'], ['pfEmployee', 'PF (Employee)']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label} (₹)</label>
                <input type="number" value={(form as any)[k]} onChange={e => set(k, e.target.value)} min="0" step="100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 p-3">
            <p className="text-xs text-green-700">Net Pay: <span className="font-bold text-lg">₹{netPay.toLocaleString('en-IN')}</span></p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            Process Payroll
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main HRM Page ────────────────────────────────────────────────────────────

type Tab = 'employees' | 'attendance' | 'leaves' | 'payroll';

export default function HRMPage() {
  const [activeTab, setActiveTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<HRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [empRes, attRes, leaveRes, payRes, statsRes] = await Promise.all([
        apiFetch<{ data: Employee[] }>('/hrm/employees'),
        apiFetch<{ data: AttendanceRecord[] }>(`/hrm/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
        apiFetch<{ data: LeaveRecord[] }>('/hrm/leaves'),
        apiFetch<{ data: PayrollRecord[] }>(`/hrm/payroll?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
        apiFetch<{ data: HRMStats }>('/hrm/stats'),
      ]);
      setEmployees(empRes.data || []);
      setAttendance(attRes.data || []);
      setLeaves(leaveRes.data || []);
      setPayroll(payRes.data || []);
      setStats(statsRes.data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiFetch(`/hrm/leaves/${leaveId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      fetchData();
    } catch { }
  };

  const handlePayrollStatus = async (recordId: string, status: 'PROCESSED' | 'PAID') => {
    try {
      await apiFetch(`/hrm/payroll/${recordId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      fetchData();
    } catch { }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    try { await apiFetch(`/hrm/employees/${id}`, { method: 'DELETE' }); fetchData(); } catch { }
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.designation || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key: 'employees' as Tab, label: 'Employees', icon: Users },
    { key: 'attendance' as Tab, label: 'Attendance', icon: UserCheck },
    { key: 'leaves' as Tab, label: 'Leaves', icon: Calendar },
    { key: 'payroll' as Tab, label: 'Payroll', icon: Banknote },
  ];

  return (
    <>
      <AnimatePresence>
        {(showEmployeeModal || editEmployee) && (
          <EmployeeModal
            initial={editEmployee || undefined}
            onClose={() => { setShowEmployeeModal(false); setEditEmployee(null); }}
            onSaved={fetchData}
          />
        )}
        {showAttendanceModal && <AttendanceModal employees={employees} onClose={() => setShowAttendanceModal(false)} onSaved={fetchData} />}
        {showLeaveModal && <LeaveModal employees={employees} onClose={() => setShowLeaveModal(false)} onSaved={fetchData} />}
        {showPayrollModal && <PayrollModal employees={employees} onClose={() => setShowPayrollModal(false)} onSaved={fetchData} />}
      </AnimatePresence>

      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Human Resources</h1>
            <p className="text-gray-500 mt-1">Manage your team, attendance, leaves & payroll</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
            </button>
            {activeTab === 'employees' && (
              <button onClick={() => setShowEmployeeModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            )}
            {activeTab === 'attendance' && (
              <button onClick={() => setShowAttendanceModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Mark Attendance
              </button>
            )}
            {activeTab === 'leaves' && (
              <button onClick={() => setShowLeaveModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Apply Leave
              </button>
            )}
            {activeTab === 'payroll' && (
              <button onClick={() => setShowPayrollModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Process Payroll
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Staff', value: stats.totalEmployees, icon: Users, color: 'text-gray-900', bg: 'bg-gray-50' },
              { label: 'Active', value: stats.activeEmployees, icon: UserCheck, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Present Today', value: stats.presentToday, icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Pending Leaves', value: stats.pendingLeaves, icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Payroll (This Month)', value: `₹${stats.totalPayroll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: Banknote, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border border-gray-100 p-4 shadow-sm ${card.bg}`}>
                <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <>
            <div className="mb-4 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none" />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                    <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Salary</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                    ))
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No employees found</p>
                        <button onClick={() => setShowEmployeeModal(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                          <Plus className="h-4 w-4" /> Add your first employee
                        </button>
                      </td>
                    </tr>
                  ) : filteredEmployees.map((emp, idx) => (
                    <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">{emp.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.designation || '—'}</p>
                            {emp.employeeCode && <p className="text-xs font-mono text-gray-400">{emp.employeeCode}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        {emp.department ? (
                          <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1 flex items-center gap-1 w-fit">
                            <Building2 className="h-3 w-3" /> {emp.department}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-600">{emp.employmentType.replace('_', ' ')}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {emp.salary ? `₹${emp.salary.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_COLORS[emp.status] || 'bg-gray-100 text-gray-600'}`}>
                          {emp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditEmployee(emp)} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">This Month&apos;s Attendance</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                  <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No attendance records this month</p>
                      <button onClick={() => setShowAttendanceModal(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                        <Plus className="h-4 w-4" /> Mark attendance
                      </button>
                    </td>
                  </tr>
                ) : attendance.map((rec, idx) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{rec.employee.name}</p>
                      <p className="text-xs text-gray-400">{rec.employee.department || rec.employee.designation || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_COLORS[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                        {rec.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center text-sm text-gray-600">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center text-sm text-gray-600">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {rec.hoursWorked ? `${rec.hoursWorked}h` : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Days</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No leave requests found</p>
                    </td>
                  </tr>
                ) : leaves.map((leave, idx) => (
                  <motion.tr key={leave.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{leave.employee.name}</p>
                      <p className="text-xs text-gray-400">{leave.employee.department || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-1 font-medium">{leave.type}</span>
                      {leave.reason && <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{leave.reason}</p>}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center text-sm font-semibold text-gray-900">{leave.days}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_COLORS[leave.status] || 'bg-gray-100 text-gray-600'}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                            className="rounded-lg px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                            className="rounded-lg px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center">{leave.approvedBy?.name || '—'}</p>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Period</th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Basic</th>
                  <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Deductions</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Net Pay</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : payroll.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No payroll records this month</p>
                      <button onClick={() => setShowPayrollModal(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                        <Plus className="h-4 w-4" /> Process payroll
                      </button>
                    </td>
                  </tr>
                ) : payroll.map((rec, idx) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{rec.employee.name}</p>
                      <p className="text-xs text-gray-400">{rec.employee.designation || ''}</p>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-center text-sm text-gray-600">
                      {MONTHS[rec.month - 1]} {rec.year}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right text-sm text-gray-700">
                      ₹{rec.basic.toLocaleString('en-IN')}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right text-sm text-red-600">
                      ₹{(rec.deductions + rec.tax + rec.pfEmployee).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      ₹{rec.netPay.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_COLORS[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rec.status === 'DRAFT' && (
                        <button onClick={() => handlePayrollStatus(rec.id, 'PROCESSED')}
                          className="rounded-lg px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100">
                          Process
                        </button>
                      )}
                      {rec.status === 'PROCESSED' && (
                        <button onClick={() => handlePayrollStatus(rec.id, 'PAID')}
                          className="rounded-lg px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1 mx-auto">
                          <Award className="h-3.5 w-3.5" /> Mark Paid
                        </button>
                      )}
                      {rec.status === 'PAID' && (
                        <span className="text-xs text-gray-400">
                          {rec.paidAt ? new Date(rec.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Paid'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
