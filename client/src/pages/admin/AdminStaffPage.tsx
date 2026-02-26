import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, UserX, X, Check, Search, KeyRound, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/error';
import { adminService } from '../../services/adminService';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  staffRole: string | null;
  active: boolean;
  createdAt: string;
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
}

const emptyForm: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  role: 'producer',
};

const ROLES = ['producer', 'supplier', 'transporter'] as const;

const roleColors: Record<string, string> = {
  producer: 'bg-blue-100 text-blue-700',
  supplier: 'bg-orange-100 text-orange-700',
  transporter: 'bg-purple-100 text-purple-700',
  admin: 'bg-green-100 text-green-700',
};

const roleAvatarColors: Record<string, string> = {
  producer: 'bg-blue-500',
  supplier: 'bg-orange-500',
  transporter: 'bg-purple-500',
  admin: 'bg-green-500',
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Set password
  const [passwordTarget, setPasswordTarget] = useState<StaffMember | null>(null);
  const [password, setPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      const params: { role?: string; search?: string } = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const data = await adminService.listStaff(params);
      setStaff(Array.isArray(data) ? data : data.staff || []);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (member: StaffMember) => {
    setForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.staffRole || member.role || 'producer',
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updateStaff(editingId, form);
        toast.success('Staff member updated');
      } else {
        await adminService.createStaff({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
        });
        toast.success('Staff member created');
      }
      setShowForm(false);
      setEditingId(null);
      loadStaff();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this staff member? They will no longer be able to log in.')) return;
    setDeactivating(id);
    try {
      await adminService.deactivateStaff(id);
      toast.success('Staff member deactivated');
      loadStaff();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeactivating(null);
    }
  };

  const handleSetPassword = async () => {
    if (!passwordTarget) return;
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSettingPassword(true);
    try {
      await adminService.setStaffPassword(passwordTarget.id, password);
      toast.success(`Password set for ${passwordTarget.name}. They can now login at /staff/login`);
      setPasswordTarget(null);
      setPassword('');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">Staff Members</h1>
          <p className="text-sm text-text-muted mt-1">
            {staff.length} {staff.length === 1 ? 'member' : 'members'} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-green text-white rounded-xl hover:bg-primary-green-dark transition shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition bg-gray-50/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition bg-gray-50/50 min-w-[140px]"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 animate-fade-in">
          <h2 className="font-heading font-bold text-lg text-text-dark mb-5">
            {editingId ? 'Edit Staff Member' : 'New Staff Member'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition"
                placeholder="e.g. Ravi Kumar"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition"
                placeholder="e.g. ravi@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff Card Grid */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 px-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text-dark mb-1">
            No staff members found
          </h3>
          <p className="text-sm text-text-muted mb-5">
            {search || roleFilter
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first staff member.'}
          </p>
          {!search && !roleFilter && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-green text-white rounded-xl hover:bg-primary-green-dark transition shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const role = member.staffRole || member.role || '';
            const roleName = role.charAt(0).toUpperCase() + role.slice(1);
            const avatarColor = roleAvatarColors[role] || 'bg-gray-500';
            const badgeColor = roleColors[role] || 'bg-gray-100 text-gray-700';
            const isActive = member.active !== false;

            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in overflow-hidden"
              >
                {/* Card Body */}
                <div className="p-5">
                  {/* Avatar + Status Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isActive ? 'bg-green-500' : 'bg-red-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isActive ? 'text-green-700' : 'text-red-500'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-heading font-bold text-base text-text-dark leading-tight mb-1">
                    {member.name || 'Unnamed'}
                  </h3>

                  {/* Email */}
                  <p className="text-sm text-text-muted truncate mb-0.5" title={member.email}>
                    {member.email || '-'}
                  </p>

                  {/* Phone */}
                  <p className="text-sm text-text-muted mb-3">{member.phone || 'No phone'}</p>

                  {/* Role Badge */}
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
                  >
                    {roleName}
                  </span>
                </div>

                {/* Actions Footer */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-1 bg-gray-50/50">
                  <button
                    onClick={() => {
                      setPasswordTarget(member);
                      setPassword('');
                    }}
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                    title="Set login password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(member)}
                    className="p-2 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-text-dark transition"
                    title="Edit staff member"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeactivate(member.id)}
                    disabled={deactivating === member.id || member.active === false}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      member.active === false ? 'Already deactivated' : 'Deactivate staff member'
                    }
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Password Modal */}
      {passwordTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <h2 className="font-heading font-bold text-lg text-text-dark mb-1">Set Password</h2>
            <p className="text-sm text-text-muted mb-4">
              {passwordTarget.name} ({passwordTarget.email})
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-dark mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="Min 6 characters"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSetPassword}
                disabled={settingPassword || password.length < 6}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {settingPassword ? 'Setting...' : 'Set Password'}
              </button>
              <button
                onClick={() => setPasswordTarget(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-text-muted mt-3">
              After setting the password, the staff member can login at{' '}
              <span className="font-medium">/staff/login</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
