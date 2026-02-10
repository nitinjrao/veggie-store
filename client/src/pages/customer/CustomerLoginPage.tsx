import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import Header from '../../components/common/Header';

export default function CustomerLoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await authService.customerRegister(phone, name || undefined);
      } else {
        await authService.customerLogin(phone);
      }
      setStep('otp');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Something went wrong';
      if (msg.includes('not registered')) {
        setIsRegister(true);
        setError('Phone not registered. Please enter your name to register.');
      } else if (msg.includes('already registered')) {
        setIsRegister(false);
        setError('Already registered. Logging in...');
        try {
          await authService.customerLogin(phone);
          setStep('otp');
          setError('');
        } catch {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp(phone, otp);
      login(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-heading font-bold text-xl text-center mb-6">
              {step === 'phone' ? 'Welcome!' : 'Enter OTP'}
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-primary-green text-white font-medium hover:bg-primary-green-dark transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : isRegister ? 'Register & Get OTP' : 'Get OTP'}
                </button>

                <p className="text-center text-xs text-text-muted">
                  {isRegister ? (
                    <button type="button" onClick={() => setIsRegister(false)} className="text-primary-green hover:underline">
                      Already have an account? Login
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsRegister(true)} className="text-primary-green hover:underline">
                      New here? Register
                    </button>
                  )}
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <p className="text-sm text-text-muted text-center">
                  OTP sent to <span className="font-medium text-text-dark">{phone}</span>
                </p>
                <p className="text-xs text-text-muted text-center">
                  (Check server console for OTP)
                </p>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-primary-green text-white font-medium hover:bg-primary-green-dark transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  className="w-full text-sm text-text-muted hover:text-text-dark"
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
