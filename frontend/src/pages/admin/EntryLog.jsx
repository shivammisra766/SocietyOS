import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../api';

const STATUS_CONFIG = {
  PENDING:  { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Pending',  ring: 'border-amber-400/20' },
  APPROVED: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Inside',   ring: 'border-emerald-400/20' },
  SCANNED:  { dot: 'bg-blue-400',    text: 'text-blue-400',    label: 'Scanned',  ring: 'border-blue-400/20' },
  REJECTED: { dot: 'bg-rose-400',    text: 'text-rose-400',    label: 'Denied',   ring: 'border-rose-400/20' },
  EXPIRED:  { dot: 'bg-slate-500',   text: 'text-slate-500',   label: 'Expired',  ring: 'border-slate-500/20' },
  EXITED:   { dot: 'bg-slate-500',   text: 'text-slate-500',   label: 'Exited',   ring: 'border-slate-500/20' },
};

const TYPE_CONFIG = {
  DELIVERY:            { icon: 'local_shipping', color: 'text-blue-400 bg-blue-400/10',     label: 'Delivery' },
  GUEST:               { icon: 'person',          color: 'text-purple-400 bg-purple-400/10', label: 'Guest' },
  CAB:                 { icon: 'local_taxi',       color: 'text-amber-400 bg-amber-400/10',  label: 'Cab' },
  HOUSEHOLD_WORKER:    { icon: 'cleaning_services',color: 'text-teal-400 bg-teal-400/10',   label: 'Staff' },
  SERVICE_PROFESSIONAL:{ icon: 'handyman',         color: 'text-orange-400 bg-orange-400/10',label: 'Service' },
};

const METHOD_LABELS = {
  QR_SCAN:       'QR Scan',
  MANUAL_LOOKUP: 'Manual',
  LIVE_APPROVAL: 'Walk-in',
};

const FILTER_STATUSES = ['ALL', 'PENDING', 'APPROVED', 'SCANNED', 'REJECTED', 'EXITED'];
const FILTER_TYPES    = ['ALL', 'DELIVERY', 'GUEST', 'CAB', 'HOUSEHOLD_WORKER', 'SERVICE_PROFESSIONAL'];

export default function AdminEntries() {
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [exitingId,   setExitingId]   = useState(null);
  const initialLoadDone = useRef(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter,   setTypeFilter]   = useState('ALL');
  const [dateFilter,   setDateFilter]   = useState('');

  /* ── fetch with current filters ── */
  const fetchEntries = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status      = statusFilter;
      if (typeFilter   !== 'ALL') params.visitorType = typeFilter;
      if (dateFilter)              params.dateFrom    = dateFilter;

      const res  = await api.get('/entry', { params });
      const data = res.data.data || [];
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [statusFilter, typeFilter, dateFilter]);

  /* ── initial load + polling + Socket.IO for real-time ── */
  useEffect(() => {
    // Only show loading spinner on very first load, not on filter changes after init
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    fetchEntries();
    const interval = setInterval(fetchEntries, 8000); // poll every 8s as fallback

    // Connect to Socket.IO for real-time updates
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:5000';

    const socket = io(socketUrl, { auth: { token } });

    socket.on('entry:new', () => {
      fetchEntries();
    });
    socket.on('entry:updated', () => {
      fetchEntries();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [fetchEntries]);

  /* ── log exit ── */
  const handleLogExit = async (entryId) => {
    setExitingId(entryId);
    try {
      await api.patch(`/entry/${entryId}/exit`);
      // Update local state immediately for responsive UI
      setEntries(prev =>
        prev.map(e => e.id === entryId ? { ...e, exitTime: new Date().toISOString(), status: 'EXITED' } : e)
      );
      // Also refetch to get the authoritative server state
      fetchEntries();
    } catch (err) {
      console.error('Failed to log exit:', err);
    } finally {
      setExitingId(null);
    }
  };

  /* ── computed stats ── */
  const total   = entries.length;
  const active  = entries.filter(e => (e.status === 'APPROVED' || e.status === 'SCANNED') && !e.exitTime).length;
  const denied  = entries.filter(e => e.status === 'REJECTED').length;
  const pending = entries.filter(e => e.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400 tracking-tight">
            Gate Activity
          </h2>
          <p className="text-slate-400 mt-2">Real-time monitoring of all visitor movements.</p>
        </div>
        <button
          onClick={fetchEntries}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition text-sm font-medium"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Today',    value: total,   color: 'text-white',        icon: 'login' },
          { label: 'Active Inside',  value: active,  color: 'text-emerald-400',  icon: 'person_check' },
          { label: 'Pending Auth',   value: pending, color: 'text-amber-400',    icon: 'pending' },
          { label: 'Denied',         value: denied,  color: 'text-rose-400',     icon: 'block' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <span className={`material-symbols-outlined ${s.color} text-xl`}>{s.icon}</span>
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Status:</span>
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>

        <div className="w-px bg-white/10 self-stretch mx-1" />

        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Type:</span>
          {FILTER_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                typeFilter === t
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'ALL' ? 'All Types' : TYPE_CONFIG[t]?.label || t}
            </button>
          ))}
        </div>

        <div className="w-px bg-white/10 self-stretch mx-1" />

        {/* Date filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">From:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-transparent text-slate-300 text-xs border border-white/10 rounded-lg px-3 py-1 focus:outline-none focus:border-indigo-500/50"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-slate-500 hover:text-white text-xs">✕</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-white/5 font-bold">
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Entry</th>
                <th className="px-6 py-4">Exit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-600">
                    <span className="material-symbols-outlined animate-spin text-2xl block mb-2">progress_activity</span>
                    Loading entries…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-600 font-medium">
                    No gate activity matching filters.
                  </td>
                </tr>
              ) : entries.map(entry => {
                const visitorName = entry.visitorName || entry.pass?.visitorName || 'Unknown';
                const visitorType = entry.visitorType || 'GUEST';
                const typeInfo    = TYPE_CONFIG[visitorType] || TYPE_CONFIG.GUEST;
                const flatNum     = entry.flat?.number || '—';
                const entryTime   = new Date(entry.entryTime);
                const exitTime    = entry.exitTime ? new Date(entry.exitTime) : null;

                // Determine display status
                const displayStatus = exitTime ? 'EXITED' : entry.status;
                const statusInfo    = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.PENDING;

                const canExit = (entry.status === 'APPROVED' || entry.status === 'SCANNED') && !exitTime;

                return (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Visitor */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-black flex-shrink-0">
                          {visitorName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{visitorName}</p>
                          <p className="text-slate-600 text-xs">{entry.visitorPhone || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="px-6 py-4 text-slate-300 text-sm">Flat {flatNum}</td>

                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${typeInfo.color}`}>
                        <span className="material-symbols-outlined text-[13px]">{typeInfo.icon}</span>
                        {typeInfo.label}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {METHOD_LABELS[entry.method] || entry.method}
                    </td>

                    {/* Entry time */}
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                      {entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Exit time */}
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                      {exitTime ? exitTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusInfo.ring}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} ${displayStatus === 'APPROVED' ? 'animate-pulse' : ''}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4">
                      {canExit ? (
                        <button
                          disabled={exitingId === entry.id}
                          onClick={() => handleLogExit(entry.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition text-xs font-bold disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[13px]">logout</span>
                          {exitingId === entry.id ? 'Logging…' : 'Log Exit'}
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            {entries.length} record{entries.length !== 1 ? 's' : ''} — auto-refreshes every 8s
          </p>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
