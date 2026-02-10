import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
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
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 bg-gradient-hero">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-dark mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to shop
          </Link>

          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-7">
            {/* Branding */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-green-50 flex items-center justify-center">
                <span className="text-3xl">🥬</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-text-dark">
                {step === 'phone' ? 'Welcome!' : 'Verify OTP'}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {step === 'phone' ? 'Login to order fresh vegetables' : 'Enter the code sent to your phone'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm animate-fade-in">{error}</div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-text-dark mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    isRegister ? 'Register & Get OTP' : 'Get OTP'
                  )}
                </button>

                <p className="text-center text-xs text-text-muted">
                  {isRegister ? (
                    <button type="button" onClick={() => setIsRegister(false)} className="text-primary-green hover:underline font-medium">
                      Already have an account? Login
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsRegister(true)} className="text-primary-green hover:underline font-medium">
                      New here? Register
                    </button>
                  )}
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-sm text-text-muted">
                    OTP sent to <span className="font-semibold text-text-dark">{phone}</span>
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    (Check server console for OTP)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                  className="w-full text-sm text-text-muted hover:text-text-dark transition-colors"
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
