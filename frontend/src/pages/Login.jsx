import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const ROLE_ROUTES = {
    ADMIN: '/admin',
    RESIDENT: '/resident',
    SECURITY: '/security',
    SERVICE: '/service',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Dev bypass completely removed in Phase 6

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.data.token, rememberMe);
      navigate(ROLE_ROUTES[res.data.data.user.role] || '/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
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
            <span className="material-symbols-outlined text-4xl text-white" style={{fontVariationSettings: "'FILL' 1"}}>admin_panel_settings</span>
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white uppercase">SocietyOS</h1>
          <p className="text-on-surface-variant font-medium text-sm tracking-tight">Administrative Access Portal</p>
        </div>
        
        {/* Glassmorphic Login Card */}
        <div className="glass-morphism rounded-3xl p-8 md:p-10 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-sm mb-5">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin ID/Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Admin ID or Email</label>
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
                  placeholder="admin@societyos.cloud" 
                  required 
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">Forgot?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl transition-colors group-focus-within:text-white">lock</span>
                </div>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/10 transition-all duration-300" 
                  placeholder="••••••••••••" 
                  required 
                />
              </div>
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center px-1">
              <input 
                type="checkbox" 
                id="remember-me" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 rounded border-white/10 bg-white/5 text-surface-variant focus:ring-white/20 focus:ring-offset-0 transition-all cursor-pointer" 
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm text-on-surface-variant font-medium cursor-pointer">
                Keep me logged in
              </label>
            </div>
            
            {/* Sign In Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className=" cursor-pointer relative group w-full flex justify-center items-center py-4 px-6 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                </span>
                {/* Subtle Glow Effect */}
                {!loading && <div className="absolute inset-0 bg-gradient-to-r from-white via-primary-container to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
              </button>
            </div>
          </form>
          
          {/* Footer Links */}
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center space-y-4">
            <p className="text-xs text-on-surface-variant/60 font-medium">Secured by SocietyOS Identity Node</p>
            <div className="flex gap-6">
              <a href="#" className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors">Security Audit</a>
            </div>
          </div>
        </div>
        
        {/* System Status Indicator */}
        <div className="mt-12 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 w-fit mx-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Global Systems Online</span>
        </div>
      </main>
      
      {/* Decorative Background — radial glow meshes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div style={{position:'absolute',width:'70vw',height:'70vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',top:'-20vw',left:'-15vw'}} />
        <div style={{position:'absolute',width:'60vw',height:'60vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',bottom:'-15vw',right:'-10vw'}} />
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'60px 60px',opacity:0.5}} />
      </div>
    </div>
  );
}