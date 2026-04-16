
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { io } from 'socket.io-client';
import api from '../../api';

/* ── colour palette for donut slices ── */
const DONUT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];

/* ── custom tooltip for the area chart ── */
const GateTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(9,11,16,0.92)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 12,
      padding: '10px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
        {payload[0].value} <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 500 }}>entries</span>
      </p>
    </div>
  );
};

/* ── custom tooltip for donut ── */
const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(9,11,16,0.92)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 12,
      padding: '10px 16px',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11 }}>{payload[0].name}</p>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{payload[0].value}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalGuards: 0,
    entriesToday: 0,
    pendingUsers: 0
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [chartData, setChartData] = useState({ gateActivity: [], complaintBreakdown: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, entriesRes, chartsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/entry?limit=5'),
        api.get('/dashboard/charts'),
      ]);

      if (statsRes?.data?.data)   setStats(statsRes.data.data);
      if (entriesRes?.data?.data) setRecentEntries(entriesRes.data.data);
      if (chartsRes?.data?.data)  setChartData(chartsRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
      : 'http://localhost:5000';
      
    const socket = io(socketUrl, { auth: { token } });

    socket.on('entry:new', fetchDashboard);
    socket.on('entry:updated', fetchDashboard);
    socket.on('complaint:new', fetchDashboard);
    socket.on('user:new', fetchDashboard);

    return () => {
      socket.disconnect();
    };
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="text-center text-slate-400 mt-20 text-lg font-semibold">
        Loading dashboard...
      </div>
    );
  }

  const totalComplaints = chartData.complaintBreakdown.reduce((s, d) => s + d.value, 0);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">

      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400 tracking-tight">
            Systems Overview
          </h2>
          <p className="text-slate-400 mt-2 font-medium">Real-time metrics and operations.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Residents"    value={stats?.totalResidents ?? 0} icon="group"   />
        <StatCard title="On-Duty Guards"     value={stats?.totalGuards    ?? 0} icon="shield"  />
        <StatCard title="Gate Check-ins"     value={stats?.entriesToday   ?? 0} icon="login"   />
        <StatCard title="Pending Approvals"  value={stats?.pendingUsers   ?? 0} icon="warning" highlight />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

        {/* Area Chart – 7-day gate activity */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-7 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Gate Activity</h3>
              <p className="text-slate-500 text-xs mt-0.5">Entries over the last 7 days</p>
            </div>
            <span className="material-symbols-outlined text-indigo-400 text-2xl">trending_up</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData.gateActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<GateTooltip />} />
              <Area
                type="monotone"
                dataKey="entries"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#gateGrad)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart – complaint breakdown */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-7 shadow-2xl backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Complaints</h3>
              <p className="text-slate-500 text-xs mt-0.5">Breakdown by category</p>
            </div>
            <span className="material-symbols-outlined text-rose-400 text-2xl">emergency</span>
          </div>

          {totalComplaints === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
              No complaints on record
            </div>
          ) : (
            <>
              <div className="relative flex-1">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData.complaintBreakdown.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.complaintBreakdown.filter(d => d.value > 0).map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">{totalComplaints}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="mt-2 flex flex-col gap-1.5">
                {chartData.complaintBreakdown.filter(d => d.value > 0).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-slate-300 font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions + Recent Gate Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-7 backdrop-blur-xl shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <ActionCard to="/admin/users"      icon="person_add"  label="New Resident" />
            <ActionCard to="/admin/entries"    icon="qr_code_2"   label="Issue Pass"   />
            <ActionCard to="/admin/notices"    icon="campaign"    label="Broadcast"    />
            <ActionCard to="/admin/complaints" icon="emergency"   label="Emergency"    />
          </div>
        </div>

        {/* Recent Gate Logs */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl">
          <div className="p-7 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Recent Gate Logs</h3>
            <Link to="/admin/entries" className="text-indigo-400 text-sm font-bold">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Gate</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => {
                    const name = entry.visitorName || entry.pass?.visitorName || 'Unknown';
                    const type = entry.visitorType || entry.pass?.visitorType || 'Guest';
                    const time = new Date(entry.entryTime || entry.createdAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 text-white">{name}</td>
                        <td className="px-6 py-4 text-slate-400">{type}</td>
                        <td className="px-6 py-4 text-slate-300">{entry.status || 'Entered'}</td>
                        <td className="px-6 py-4 text-slate-500">{entry.guard?.name || 'Gate 1'}</td>
                        <td className="px-6 py-4 text-right text-slate-400">{time}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">No recent activity</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ title, value, icon, highlight }) {
  return (
    <div className={`p-6 rounded-2xl border ${highlight ? 'border-rose-500/30' : 'border-white/5'} bg-white/[0.02]`}>
      <div className="flex justify-between mb-4">
        <span className="material-symbols-outlined text-indigo-400">{icon}</span>
      </div>
      <h3 className="text-3xl font-bold text-white">{value}</h3>
      <p className="text-slate-400 text-sm mt-1">{title}</p>
    </div>
  );
}

function ActionCard({ to, icon, label }) {
  return (
    <Link to={to} className="p-5 rounded-xl border border-white/5 text-center hover:bg-indigo-500/10 transition">
      <span className="material-symbols-outlined text-2xl text-indigo-400">{icon}</span>
      <p className="text-sm text-slate-300 mt-2 font-semibold">{label}</p>
    </Link>
  );
}
