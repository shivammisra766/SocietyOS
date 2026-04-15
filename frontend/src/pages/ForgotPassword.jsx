import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg(`OTP sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setSuccessMsg('Password reset successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center particle-bg selection:bg-primary/20">
      <main className="relative z-10 w-full max-w-[440px] px-6 py-12">
        {/* SocietyOS Logo Area */}
        <div className="flex flex-col items-center mb-10 space-y-2">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/20 shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-white" style={{fontVariationSettings: "'FILL' 1"}}>lock_reset</span>
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white uppercase">SocietyOS</h1>
          <p className="text-on-surface-variant font-medium text-sm tracking-tight">Identity Recovery</p>
        </div>
        
        {/* Glassmorphic Form Card */}
        <div className="glass-morphism rounded-3xl p-8 md:p-10 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-sm mb-5">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-500 text-sm mb-5">
              {successMsg}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Registered Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl transition-colors group-focus-within:text-white">alternate_email</span>
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all duration-300" 
                    placeholder="user@societyos.cloud" 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-2 gap-4 flex flex-col">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="cursor-pointer relative group w-full flex justify-center items-center py-4 px-6 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? 'Sending OTP...' : 'Continue'}
                    {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                  </span>
                  {!loading && <div className="absolute inset-0 bg-gradient-to-r from-white via-primary-container to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
                </button>
  
                <Link to="/login" className="text-center text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest mt-2">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="otp">6-Digit OTP</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl transition-colors group-focus-within:text-white">pin</span>
                  </div>
                  <input 
                    type="text" 
                    id="otp" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all duration-300 tracking-widest font-mono" 
                    placeholder="123456" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="newPassword">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl transition-colors group-focus-within:text-white">lock</span>
                  </div>
                  <input 
                    type="password" 
                    id="newPassword" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all duration-300" 
                    placeholder="••••••••••••" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant text-xl transition-colors group-focus-within:text-white">lock_clock</span>
                  </div>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all duration-300" 
                    placeholder="••••••••••••" 
                    required 
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="cursor-pointer relative group w-full flex justify-center items-center py-4 px-6 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? 'Processing...' : 'Reset Password'}
                    {!loading && <span className="material-symbols-outlined text-lg">check_circle</span>}
                  </span>
                  {!loading && <div className="absolute inset-0 bg-gradient-to-r from-white via-primary-container to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center space-y-4">
            <p className="text-xs text-on-surface-variant/60 font-medium">Secured by SocietyOS Identity Node</p>
          </div>
        </div>
      </main>
      
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div style={{position:'absolute',width:'70vw',height:'70vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',top:'-20vw',left:'-15vw'}} />
        <div style={{position:'absolute',width:'60vw',height:'60vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',bottom:'-15vw',right:'-10vw'}} />
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'60px 60px',opacity:0.5}} />
      </div>
    </div>
  );
}
