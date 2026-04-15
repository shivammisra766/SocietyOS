import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';

export default function AdminServiceStaff() {
  const [modalOpen, setModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [editStaffId, setEditStaffId] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users?role=SERVICE');
      setStaffList(res.data.data.filter(u => u.role === 'SERVICE'));
    } catch(err) {
      console.error("Failed to fetch service staff", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) return;

    try {
      await api.patch(`/users/${editStaffId}`, {
        name: staffName,
        email: staffEmail,
        phone: staffPhone || undefined
      });
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setEditStaffId(null);
      setModalOpen(false);
      toast.success('Staff details updated.');
      fetchStaff();
    } catch(err) {
      console.error("Failed to save service staff", err);
      const errorMsg = err.response?.data?.errors 
        ? Object.entries(err.response.data.errors).map(([k, v]) => `${k}: ${v}`).join(', ')
        : err.response?.data?.message || "Failed to save. Ensure data is valid.";
      toast.error(errorMsg);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-white">Remove Staff Member?</p>
        <p className="text-xs text-gray-400">This action cannot be undone.</p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/users/${id}`);
                toast.success('Staff member removed.');
                fetchStaff();
              } catch (err) {
                console.error("Failed to delete staff", err);
                toast.error('Failed to delete staff.');
              }
            }}
            className="flex-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
          >Confirm</button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
          >Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/users/${id}/approve`);
      toast.success('Staff member approved.');
      fetchStaff();
    } catch (err) {
      console.error("Failed to approve staff", err);
      toast.error(err.response?.data?.message || 'Failed to approve staff.');
    }
  };

  return (
    <div className="p-8 pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface text-white">Service Staff Directory</h1>
          <p className="text-on-surface-variant text-gray-400 mt-1">Manage service personnel, maintenance and housekeepers.</p>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between border border-white/5 bg-white/[0.02] backdrop-blur-xl">
          <span className="text-on-surface-variant text-gray-400 text-sm font-medium">Active Personnel</span>
          <div className="flex items-end justify-between mt-4">
            <span className="text-4xl font-bold text-white">{staffList.filter(g => g.status === 'APPROVED').length}</span>
            <span className="text-emerald-500 text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> Active
            </span>
          </div>
        </div>
      </section>

      {/* Filters and Table Card */}
      <div className="glass-morphism rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="p-5 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl">search</span>
              <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500" placeholder="Search by name..." type="text"/>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-gray-500 font-black border-b border-white/5">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staffList.map(staff => {
                const names = staff.name?.split(' ') || ['?'];
                const initials = names.length > 1 ? names[0][0] + names[1][0] : names[0][0];
                return (
                <tr key={staff.id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-black text-slate-300 shadow-inner transition-colors">{initials.toUpperCase()}</div>
                      <div>
                        <p className="font-bold text-white">{staff.name}</p>
                        <p className="text-[11px] font-bold tracking-wide text-gray-500 mt-0.5">ID: UID-{staff.id.substring(0, 4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-400">{staff.phone || staff.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${staff.status === 'APPROVED' ? 'bg-white text-black border-neutral-200' : 'bg-neutral-700 text-neutral-100 border-neutral-600'}`}>
                      {staff.status === 'APPROVED' ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {staff.status !== 'APPROVED' && (
                        <button 
                          onClick={() => handleApprove(staff.id)} 
                          className="p-1.5 rounded hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                          title="Approve Staff"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditStaffId(staff.id);
                          setStaffName(staff.name || '');
                          setStaffEmail(staff.email || '');
                          setStaffPhone(staff.phone || '');
                          setModalOpen(true);
                        }} 
                        className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center"
                        title="Edit Staff"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDelete(staff.id)} className="p-1.5 rounded hover:bg-error/10 text-gray-500 hover:text-rose-500 transition-colors bg-transparent border-none cursor-pointer flex items-center" title="Delete Staff">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">No service staff tracked on server.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && editStaffId && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-morphism w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl bg-surface-container-low border border-white/10">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight">Edit Staff Details</h3>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setEditStaffId(null);
                }} 
                className="material-symbols-outlined text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full p-2 border-none cursor-pointer"
              >close</button>
            </div>
            <div className="p-8">
              <form className="space-y-4 flex flex-col" onSubmit={handleSave}>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium" 
                    placeholder="e.g. Michael Johnson" 
                    type="text" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium" 
                      placeholder="staff@society.com" 
                      type="email" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number (Optional)</label>
                    <input 
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 font-medium" 
                      placeholder="e.g. 555-0192" 
                      type="text" 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4 mt-6">
                  <button onClick={() => {
                    setModalOpen(false);
                    setEditStaffId(null);
                  }} className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-400 border border-white/10 bg-transparent hover:bg-white/5 transition-all cursor-pointer" type="button">Cancel</button>
                  <button disabled={!staffName.trim() || !staffEmail.trim()} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white text-black border-none hover:bg-neutral-200 transition-all cursor-pointer disabled:opacity-50" type="submit">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
