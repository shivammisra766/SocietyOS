import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function AdminSettings() {
  const { user } = useAuth();
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [flatId, setFlatId] = useState('');
  const [flats, setFlats] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available flats for the resident dropdown
  useEffect(() => {
    api.get('/flats')
      .then(res => setFlats(res.data.data || []))
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setName(''); setEmail(''); setPhone('');
    setPassword(''); setFlatId('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const societyId = user?.societyId;
    if (!societyId) return toast.error('Admin session missing Society ID. Please re-login.');
    if (!role)      return toast.error('Please select a role first.');
    if (role === 'RESIDENT' && !flatId) {
      return toast.error('Flat number is required for residents.');
    }

    try {
      setSubmitting(true);
      await api.post('/auth/register', {
        name, email, password,
        phone: phone || undefined,
        role,
        societyId,
        flatId: role === 'RESIDENT' ? flatId : undefined,
      });
      toast.success(`${roleLabel(role)} "${name}" created successfully!`);
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.entries(err.response.data.errors).map(([k, v]) => `${k}: ${v}`).join(', ')
        : err.response?.data?.message || 'Registration failed. Check inputs.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = (r) => {
    switch (r) {
      case 'RESIDENT': return 'Resident';
      case 'SECURITY': return 'Guard';
      case 'SERVICE':  return 'Service Staff';
      default: return r;
    }
  };

  const roleConfig = {
    RESIDENT: { icon: 'home', color: 'indigo', desc: 'Can manage visitor passes, file complaints, and view notices.' },
    SECURITY: { icon: 'shield', color: 'emerald', desc: 'Can scan QR codes, log entries, and manage gate access.' },
    SERVICE:  { icon: 'engineering', color: 'amber', desc: 'Can view assigned tasks, update work status, and log hours.' },
  };

  const selectedConfig = role ? roleConfig[role] : null;

  return (
    <div className="pt-8 px-8 pb-12 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Roles & Access</h2>
            <p className="text-gray-400 mt-1">Create new user accounts and manage access levels.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — Role overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-high/30 p-8 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-white">info</span>
                Role Permissions Overview
              </h3>
              <div className="space-y-5">
                {Object.entries(roleConfig).map(([key, cfg]) => (
                  <div key={key} className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border ${role === key ? `border-${cfg.color}-500/30 bg-${cfg.color}-500/5` : 'border-transparent hover:bg-white/[0.02]'}`}
                    onClick={() => setRole(key)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${role === key ? 'bg-white text-black' : 'bg-white/5 text-gray-400'} transition-colors`}>
                      <span className="material-symbols-outlined text-xl">{cfg.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{roleLabel(key)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Create User form */}
          <div className="lg:col-span-3">
            <div className="glass-morphism rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">person_add</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Create New User</h3>
                  <p className="text-xs text-gray-500">
                    {role ? `Adding a new ${roleLabel(role)}` : 'Select a role to get started'}
                  </p>
                </div>
              </div>

              {!role ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-700 mb-4">arrow_back</span>
                  <p className="text-gray-400 font-medium">Select a role from the left panel to begin creating a new user account.</p>
                </div>
              ) : (
                <form className="p-8 space-y-5" onSubmit={handleCreate}>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium appearance-none cursor-pointer"
                      style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center'}}
                    >
                      <option value="RESIDENT">Resident</option>
                      <option value="SECURITY">Guard</option>
                      <option value="SERVICE">Service Staff</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium"
                        placeholder="e.g. Aarav Mehta" type="text" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email (User ID) *</label>
                      <input value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium"
                        placeholder="user@example.com" type="email" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium"
                        placeholder="+91 9876543210" type="text" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password *</label>
                      <input value={password} onChange={e => setPassword(e.target.value)} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium"
                        placeholder="Min. 6 characters" type="password" />
                    </div>
                  </div>

                  {role === 'RESIDENT' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flat Number *</label>
                      <select
                        value={flatId}
                        onChange={e => setFlatId(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium appearance-none cursor-pointer"
                        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center'}}
                      >
                        <option value="">Select a flat...</option>
                        {flats.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.number} (Floor {f.floor})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-600">Assign this resident to a registered flat in the society.</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !name.trim() || !email.trim() || !password.trim() || (role === 'RESIDENT' && !flatId)}
                      className="w-full py-3.5 px-4 rounded-xl font-bold bg-white text-black border-none hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">person_add</span>
                          Create {roleLabel(role)} Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
