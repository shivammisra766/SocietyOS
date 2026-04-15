import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';

const PRIORITY_MAP = {
  HIGH:   { dot: 'bg-error',        text: 'text-error' },
  MEDIUM: { dot: 'bg-yellow-500',   text: 'text-yellow-500' },
  LOW:    { dot: 'bg-gray-400',     text: 'text-gray-400' },
};

const STATUS_STYLE = {
  OPEN:        'bg-gray-500/10 text-gray-400',
  ASSIGNED:    'bg-indigo-500/10 text-indigo-400',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-500',
  RESOLVED:    'bg-emerald-500/10 text-emerald-500',
  CLOSED:      'bg-slate-500/10 text-slate-500',
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [serviceStaff, setServiceStaff] = useState([]);
  const [assigningTicketId, setAssigningTicketId] = useState(null);

  const fetchComplaints = () => {
    api.get('/complaints')
      .then(res => setComplaints(res.data.data || []))
      .catch(err => console.error('Failed to fetch complaints:', err));
  };
  
  const fetchServiceStaff = () => {
    api.get('/users?role=SERVICE')
      .then(res => setServiceStaff(res.data.data || []))
      .catch(err => console.error('Failed to fetch service staff:', err));
  };

  useEffect(() => { 
    fetchComplaints(); 
    fetchServiceStaff();
  }, []);

  const handleClose = async (id) => {
    try {
      await api.patch(`/complaints/${id}/close`);
      toast.success('Ticket closed successfully.');
      fetchComplaints();
    } catch (err) {
      console.error('Failed to close ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to close ticket.');
    }
  };

  const handleAssign = async (complaintId, staffId) => {
    if (!staffId) {
      setAssigningTicketId(null);
      return;
    }
    try {
      await api.patch(`/complaints/${complaintId}/assign`, { staffId });
      toast.success('Ticket assigned.');
      fetchComplaints();
    } catch (err) {
      console.error('Failed to assign ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to assign ticket.');
    } finally {
      setAssigningTicketId(null);
    }
  };

  const open       = complaints.filter(c => c.status === 'OPEN').length;
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolved   = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="pt-8 px-8 pb-12 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Complaints &amp; Tickets</h2>
            <p className="text-gray-400 mt-1">Track and resolve resident issues and facility maintenance requests.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Open Tickets</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-white">{open}</span>
              <span className="material-symbols-outlined text-white/50 text-4xl flex items-center">report</span>
            </div>
          </div>
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">In Progress</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-amber-500">{inProgress}</span>
              <span className="text-amber-500 text-sm flex items-center gap-1 font-bold">Under Review</span>
            </div>
          </div>
          <div className="glass-morphism p-6 rounded-xl flex flex-col justify-between">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Resolved</span>
            <div className="flex items-end justify-between mt-4">
              <span className="text-4xl font-bold text-emerald-500">{resolved}</span>
              <span className="text-emerald-500 text-sm flex items-center gap-1">Tickets Closed</span>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 text-xs uppercase tracking-wider text-gray-400 font-bold border-b border-white/10">
                  <th className="px-6 py-4">Ticket details</th>
                  <th className="px-6 py-4">Requester</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {complaints.map(complaint => {
                  const priority = complaint.priority || 'LOW';
                  const status   = complaint.status   || 'OPEN';
                  const pStyle = PRIORITY_MAP[priority] || PRIORITY_MAP.LOW;
                  const sStyle = STATUS_STYLE[status]   || STATUS_STYLE.OPEN;
                  return (
                    <tr key={complaint.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{complaint.title || complaint.description?.substring(0, 50)}</span>
                          <span className="text-[10px] text-gray-500 font-mono">TKT-{complaint.id.substring(0, 4).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300">{complaint.user?.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{complaint.flat?.unitNumber || complaint.user?.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${pStyle.dot}`}></div>
                          <span className={`text-xs ${pStyle.text} font-bold uppercase tracking-widest`}>{priority}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded ${sStyle} text-[10px] font-bold uppercase tracking-tight`}>
                          {status.replace('_', ' ')}
                        </span>
                        {complaint.assignedTo && (
                          <div className="mt-1 text-xs text-indigo-400">
                            Assigned: {complaint.assignedTo.name}
                          </div>
                        )}
                        {status === 'OPEN' && assigningTicketId === complaint.id && (
                          <div className="mt-2 text-xs">
                            <select 
                              className="bg-[#090b10] text-gray-300 border border-white/20 rounded p-1 w-full"
                              onChange={(e) => handleAssign(complaint.id, e.target.value)}
                              onBlur={() => setAssigningTicketId(null)}
                              autoFocus
                            >
                              <option value="">Select Staff...</option>
                              {serviceStaff.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status === 'OPEN' && assigningTicketId !== complaint.id && (
                            <button
                              onClick={() => setAssigningTicketId(complaint.id)}
                              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                              title="Assign Staff"
                            >
                              <span className="material-symbols-outlined text-sm">person_add</span>
                            </button>
                          )}
                          {(status === 'RESOLVED' || status === 'IN_PROGRESS') && (
                            <button
                              onClick={() => handleClose(complaint.id)}
                              className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer flex items-center"
                              title="Close Ticket"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 font-medium">No complaints submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/5">
            <p className="text-xs text-gray-500 italic">Showing all active and historical tickets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
