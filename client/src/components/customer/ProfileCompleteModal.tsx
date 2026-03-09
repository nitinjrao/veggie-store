import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ProfileCompleteness {
  whatsappSet: boolean;
  hasAddress: boolean;
  canOrder: boolean;
}

interface ProfileCompleteModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function ProfileCompleteModal({
  open,
  onClose,
  onComplete,
}: ProfileCompleteModalProps) {
  const navigate = useNavigate();
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get<ProfileCompleteness>('/customers/profile/completeness')
      .then(({ data }) => {
        setCompleteness(data);
        if (data.canOrder) {
          onComplete?.();
        }
      })
      .catch(() => {
        // If endpoint fails, let the user proceed
        onComplete?.();
      })
      .finally(() => setLoading(false));
  }, [open, onComplete]);

  const handleSaveWhatsapp = async () => {
    if (!whatsapp.trim()) {
      toast.error('Please enter a WhatsApp number');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/profile', { whatsapp: whatsapp.trim() });
      toast.success('WhatsApp number saved');
      setCompleteness((prev) => (prev ? { ...prev, whatsappSet: true } : prev));
      // Check if now complete
      if (completeness?.hasAddress) {
        onComplete?.();
      }
    } catch {
      toast.error('Failed to save WhatsApp number');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToProfile = () => {
    onClose();
    navigate('/profile');
  };

  if (!open) return null;

  const canNowOrder = completeness?.whatsappSet && completeness?.hasAddress;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-text-dark">
              Complete Your Profile
            </h2>
            <p className="text-xs text-text-muted">
              Required before placing an order
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* WhatsApp */}
            {!completeness?.whatsappSet && (
              <div className="bg-green-50/50 rounded-xl border border-green-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-text-dark">WhatsApp Number</span>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  We send order updates via WhatsApp
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
                  />
                  <button
                    onClick={handleSaveWhatsapp}
                    disabled={saving || !whatsapp.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all disabled:opacity-50 active:scale-95 shrink-0"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            {completeness?.whatsappSet && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">
                  WhatsApp number added
                </span>
              </div>
            )}

            {/* Address */}
            {!completeness?.hasAddress && (
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-text-dark">Delivery Address</span>
                </div>
                <p className="text-xs text-text-muted mb-3">
                  Add at least one delivery address
                </p>
                <button
                  onClick={handleGoToProfile}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all active:scale-95"
                >
                  Go to Profile to Add Address
                </button>
              </div>
            )}
            {completeness?.hasAddress && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">
                  Delivery address added
                </span>
              </div>
            )}

            {/* All complete */}
            {canNowOrder && (
              <button
                onClick={() => onComplete?.()}
                className="w-full px-4 py-3 rounded-xl bg-gradient-green text-white text-sm font-semibold hover:shadow-glow-green transition-all active:scale-95"
              >
                Continue to Place Order
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
