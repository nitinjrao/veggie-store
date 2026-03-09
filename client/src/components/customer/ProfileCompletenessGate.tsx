import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Phone, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface ProfileCompletenessGateProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  missingWhatsapp: boolean;
  missingAddress: boolean;
}

export default function ProfileCompletenessGate({
  isOpen,
  onClose,
  onComplete,
  missingWhatsapp,
  missingAddress,
}: ProfileCompletenessGateProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveWhatsapp = async () => {
    if (!whatsapp.trim()) {
      toast.error('Please enter your WhatsApp number');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/profile', { whatsapp: whatsapp.trim() });
      toast.success('WhatsApp number saved');
      // If address is also complete, proceed
      if (!missingAddress) {
        onComplete();
      }
    } catch {
      toast.error('Failed to save WhatsApp number');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-text-dark">Complete Your Profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-5">
          Please complete your profile to place an order. We need your WhatsApp number for order
          updates and a delivery address.
        </p>

        {missingWhatsapp && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-text-dark mb-2">
              <Phone className="w-4 h-4 text-green-600" />
              WhatsApp Number
            </label>
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
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
        )}

        {missingAddress && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-text-dark mb-2">
              <MapPin className="w-4 h-4 text-primary-green" />
              Delivery Address
            </label>
            <p className="text-sm text-text-muted mb-2">
              You need at least one saved address to place an order.
            </p>
            <Link
              to="/profile"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-text-dark text-sm font-medium hover:bg-gray-200 transition-all"
            >
              <MapPin className="w-4 h-4" />
              Add Address in Profile
            </Link>
          </div>
        )}

        {!missingWhatsapp && !missingAddress && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-primary-green" />
            </div>
            <p className="text-sm font-medium text-text-dark">Profile is complete!</p>
            <button
              onClick={onComplete}
              className="mt-3 px-6 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all active:scale-95"
            >
              Continue to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
