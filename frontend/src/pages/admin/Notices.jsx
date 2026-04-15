import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';

export default function AdminNotices() {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [notices, setNotices] = useState([]);
  const [editNoticeId, setEditNoticeId] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data.data);
    } catch(err) {
      console.error("Could not fetch notices", err);
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const payload = {
      title,
      body: body || 'No description provided.',
      category,
      priority
    };

    try {
      if (editNoticeId) {
        await api.patch(`/notices/${editNoticeId}`, payload);
      } else {
        await api.post('/notices', payload);
      }
      
      setTitle('');
      setBody('');
      setCategory('GENERAL');
      setPriority('NORMAL');
      setEditNoticeId(null);
      setModalOpen(false);
      toast.success(editNoticeId ? 'Notice updated.' : 'Notice broadcasted!');
      fetchNotices();
    } catch(err) {
      console.error("Failed to save notice", err);
      toast.error('Failed to save notice.');
    }
  };

  const deleteNotice = async (id) => {
    try {
      await api.delete(`/notices/${id}`);
      toast.success('Notice removed.');
      fetchNotices();
    } catch(err) {
      console.error("Failed to delete notice", err);
      toast.error('Failed to delete notice.');
    }
  };

  return (
    <div className="pt-8 px-8 pb-12 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Broadcast Notices</h2>
            <p className="text-gray-400 mt-1">Publish important announcements and community guidelines to all residents.</p>
          </div>
          <button 
            onClick={() => {
              setTitle('');
              setBody('');
              setCategory('GENERAL');
              setPriority('NORMAL');
              setEditNoticeId(null);
              setModalOpen(true);
            }}
            className="bg-white text-black px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-colors active:scale-95 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">campaign</span>
            Create Notice
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Active Broadcasts</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-white">{notices.length}</span>
              <span className="material-symbols-outlined text-white/50 text-4xl flex items-center">notifications_active</span>
            </div>
          </div>
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Delivered</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-emerald-500">{(notices.length * 154).toLocaleString()}</span>
              <span className="text-emerald-500 text-sm flex items-center gap-1 font-bold">
                Users Reached
              </span>
            </div>
          </div>
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Read Rate</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-blue-400">86%</span>
              <span className="text-blue-400 text-sm flex items-center gap-1">
                Engagement
              </span>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 text-xs uppercase tracking-wider text-gray-400 font-bold border-b border-white/10">
                  <th className="px-6 py-4">Notice Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date Published</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {notices.map(notice => (
                  <tr key={notice.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white text-sm">{notice.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-tight text-blue-400 bg-blue-400/10`}>
                        <span className="material-symbols-outlined text-[10px] flex items-center">info</span> {notice.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-400">{new Date(notice.createdAt).toISOString().split('T')[0]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${notice.priority === 'URGENT' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${notice.priority === 'URGENT' ? 'text-rose-500' : 'text-emerald-500'}`}>{notice.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditNoticeId(notice.id);
                            setTitle(notice.title);
                            setBody(notice.body || '');
                            setCategory(notice.category);
                            setPriority(notice.priority);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button 
                          onClick={() => deleteNotice(notice.id)}
                          className="p-1.5 rounded hover:bg-error/10 text-gray-400 hover:text-error transition-colors bg-transparent border-none cursor-pointer flex items-center"
                        >
                          <span className="material-symbols-outlined text-sm text-rose-500">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notices.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium">No active notices.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-morphism w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl bg-surface-container-low">
            <div className="p-6 border-b border-white/10 flex items-center justify-between font-headline">
              <h3 className="text-xl font-black text-white">{editNoticeId ? 'Edit Notice' : 'Create Notice'}</h3>
              <button 
                onClick={() => {
                  setModalOpen(false);
                  setEditNoticeId(null);
                }} 
                className="material-symbols-outlined text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >close</button>
            </div>
            <div className="p-8">
              <form className="space-y-6 flex flex-col" onSubmit={handleSave}>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notice Title</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600" 
                    placeholder="e.g. Pool Maintenance" 
                    type="text" 
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message Content</label>
                  <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600" 
                    placeholder="Type notice details here..." 
                    rows="3"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none outline-none cursor-pointer"
                    >
                      <option value="GENERAL" className="bg-neutral-900">General Information</option>
                      <option value="MAINTENANCE" className="bg-neutral-900">Maintenance & Operations</option>
                      <option value="EVENT" className="bg-neutral-900">Community Event</option>
                      <option value="EMERGENCY" className="bg-neutral-900">Emergency & Alerts</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority Segment</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none outline-none cursor-pointer"
                    >
                      <option value="NORMAL" className="bg-neutral-900">Normal Priority</option>
                      <option value="HIGH" className="bg-neutral-900">High Priority</option>
                      <option value="URGENT" className="bg-neutral-900">Urgent Delivery</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-4 mt-8">
                  <button onClick={() => {
                    setModalOpen(false);
                    setEditNoticeId(null);
                  }} className="flex-1 py-3 px-4 rounded-lg font-bold text-gray-400 border border-white/10 bg-transparent hover:bg-white/5 transition-all cursor-pointer" type="button">Cancel</button>
                  <button disabled={!title.trim()} className="flex-1 py-3 px-4 rounded-lg font-bold bg-white text-black border-none hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50" type="submit">
                    {editNoticeId ? 'Save Changes' : 'Broadcast'}
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
