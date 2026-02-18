import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Plus, Pencil, Trash2, Star, X, Phone, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/common/Header';
import { useAuthStore } from '../../stores/authStore';
import { addressService } from '../../services/addressService';
import api from '../../services/api';
import type { Address } from '../../types';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formText, setFormText] = useState('');
  const [formDefault, setFormDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappSaved, setWhatsappSaved] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAddresses();
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setWhatsapp(data.whatsapp || '');
      setWhatsappSaved(data.whatsapp || '');
    } catch {}
  };

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true);
    try {
      await api.patch('/auth/profile', { whatsapp: whatsapp.trim() });
      setWhatsappSaved(whatsapp.trim());
      toast.success('WhatsApp number saved');
    } catch {
      toast.error('Failed to save WhatsApp number');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAll();
      setAddresses(data);
    } catch {
      // Silently fail — empty state guides user to add addresses
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormLabel('');
    setFormText('');
    setFormDefault(false);
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setFormLabel(addr.label);
    setFormText(addr.text);
    setFormDefault(addr.isDefault);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim() || !formText.trim()) {
      toast.error('Label and address are required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await addressService.update(editingId, {
          label: formLabel.trim(),
          text: formText.trim(),
          isDefault: formDefault,
        });
        toast.success('Address updated');
      } else {
        await addressService.create({
          label: formLabel.trim(),
          text: formText.trim(),
          isDefault: formDefault,
        });
        toast.success('Address added');
      }
      resetForm();
      await loadAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await addressService.delete(id);
      toast.success('Address deleted');
      await loadAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.update(id, { isDefault: true });
      toast.success('Default address updated');
      await loadAddresses();
    } catch {
      toast.error('Failed to update default');
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-xl hover:bg-gray-100 text-text-muted transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-green" />
            </div>
            <h1 className="font-heading font-bold text-xl">My Profile</h1>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-green flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-text-dark text-lg">
                {user?.name || 'Customer'}
              </h2>
              <p className="text-sm text-text-muted">
                {user?.phone || user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Number */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-text-dark">WhatsApp Number</h2>
          </div>
          <p className="text-xs text-text-muted mb-3">We'll send order updates on WhatsApp</p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
            />
            <button
              onClick={handleSaveWhatsapp}
              disabled={savingWhatsapp || whatsapp.trim() === whatsappSaved}
              className="px-5 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              {savingWhatsapp ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-green" />
              <h2 className="font-bold text-text-dark text-lg">Saved Addresses</h2>
            </div>
            {!showForm && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            )}
          </div>

          {/* Inline Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-primary-green/30 shadow-card p-5 mb-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-dark">
                  {editingId ? 'Edit Address' : 'New Address'}
                </h3>
                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Label</label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. Home, Work, Office"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Address</label>
                  <textarea
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Enter full delivery address..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formDefault}
                    onChange={(e) => setFormDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-green focus:ring-primary-green/40"
                  />
                  <span className="text-sm text-text-muted">Set as default address</span>
                </label>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all disabled:opacity-50 active:scale-95"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-text-muted hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Address List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 && !showForm ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-1">No saved addresses</h3>
              <p className="text-text-muted text-sm">Add an address to speed up checkout</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 group hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-green-50 text-primary-green text-xs font-semibold">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-50 text-yellow-600 text-xs font-medium">
                            <Star className="w-3 h-3 fill-yellow-500" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-dark leading-relaxed">{addr.text}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="p-2 rounded-lg hover:bg-yellow-50 text-gray-300 hover:text-yellow-500 transition-colors"
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(addr)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
