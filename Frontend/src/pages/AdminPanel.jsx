import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header/Header';
import ReportsTab from '../components/ReportsTab';
import {
    Users, FileText, CheckCircle2, Clock, TrendingUp,
    Shield, Trash2, Eye, Search, Filter, AlertTriangle, BarChart2, Download
} from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js
ChartJS.register(
    CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
);

/* ── Stat Card ─────────────────────────────────────────── */
function AdminStat({ icon: Icon, label, value, bg, text }) {
    return (
        <div className={`bg-white rounded-2xl border ${text.replace('text', 'border').replace('600', '100')} shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
            <div className={`inline-flex w-11 h-11 ${bg} ${text} rounded-xl items-center justify-center mb-4 shadow-sm`}>
                <Icon size={20} />
            </div>
            <div className="text-3xl font-black text-gray-900 mb-0.5">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    );
}

/* ── Status Badge ──────────────────────────────────────── */
function Badge({ status }) {
    const map = {
        pending: 'bg-amber-100 text-amber-700',
        in_progress: 'bg-blue-100 text-blue-700',
        resolved: 'bg-primary/10 text-primary',
        rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status?.replace('_', ' ')}</span>;
}

export default function AdminPanel() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const pollingRef = useRef(null);

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const fetchComplaints = async (cfg) => {
        try {
            const cRes = await axios.get('http://localhost:8000/api/complaints', cfg);
            setComplaints(cRes.data || []);
        } catch (e) { /* silent */ }
    };

    useEffect(() => {
        if (!user?.token) { navigate('/login'); return; }
        if (user.role !== 'admin') { navigate('/dashboard'); return; }

        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        Promise.all([
            axios.get('http://localhost:8000/api/complaints', cfg),
            axios.get('http://localhost:8000/api/users/all-users', cfg),
            axios.get('http://localhost:8000/api/admin/logs', cfg),
        ]).then(([cRes, uRes, lRes]) => {
            setComplaints(cRes.data || []);
            setUsers(uRes.data || []);
            setLogs(lRes.data || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    /* ── Polling: only active when Reports tab is open ── */
    useEffect(() => {
        if (!user?.token) return;
        const cfg = { headers: { Authorization: `Bearer ${user.token}` } };
        if (tab === 'reports' || tab === 'overview' || tab === 'logs') {
            pollingRef.current = setInterval(() => {
                fetchComplaints(cfg);
                if (tab === 'logs' || tab === 'overview') {
                    axios.get('http://localhost:8000/api/admin/logs', cfg)
                        .then(res => setLogs(res.data || []))
                        .catch(() => {});
                }
            }, 10000);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [tab]);

    const stats = {
        total: complaints.length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        pending: complaints.filter(c => c.status === 'pending').length,
        users: users.length,
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.put(`http://localhost:8000/api/complaints/${id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this complaint?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/complaints/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setComplaints(prev => prev.filter(c => c._id !== id));
        } catch (e) { alert('Could not delete.'); }
    };

    const filtered = complaints.filter(c => {
        const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setUsers(prev => prev.filter(u => u._id !== id));
        } catch (e) { alert('Could not delete user.'); }
    };

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'complaints', label: `Complaints (${complaints.length})` },
        { id: 'users', label: `Users (${users.length})` },
        { id: 'reports', label: 'Reports & Analytics' },
        { id: 'logs', label: 'System Logs' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md shadow-primary/10">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900">Admin Panel</h1>
                            <p className="text-gray-400 text-sm">Manage reports and users</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setTab('reports')} 
                        className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download size={15} className="text-primary" /> Full Export Report
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 mb-6 w-fit animate-slide-up delay-100">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:text-primary hover:bg-primary/5'
                                }`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ── Overview Tab ── */}
                        {tab === 'overview' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                    <AdminStat icon={FileText} label="Total Reports" value={stats.total} bg="bg-blue-50" text="text-blue-600" />
                                    <AdminStat icon={CheckCircle2} label="Resolved" value={stats.resolved} bg="bg-emerald-50" text="text-emerald-600" />
                                    <AdminStat icon={Clock} label="Pending" value={stats.pending} bg="bg-amber-50" text="text-amber-600" />
                                    <AdminStat icon={Users} label="Registered Users" value={stats.users} bg="bg-violet-50" text="text-violet-600" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Resolution bar & Quick Stats */}
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                            <div className="flex justify-between mb-3">
                                                <span className="font-semibold text-gray-700 text-sm">Resolution Rate</span>
                                                <span className="text-primary font-extrabold text-lg">
                                                    {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
                                                <div className="bg-gradient-to-r from-primary to-primary-hover h-3 rounded-full transition-all duration-1000 shadow-sm shadow-primary/20"
                                                    style={{ width: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%` }} />
                                            </div>
                                            <p className="text-xs text-gray-400">Resolution performance across all categories.</p>
                                        </div>

                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                            <h3 className="font-bold text-gray-900 text-sm mb-4">Status Distribution</h3>
                                            <div className="h-[180px] flex items-center justify-center">
                                                <Pie
                                                    data={{
                                                        labels: ['Resolved', 'Pending', 'In Progress', 'Rejected'],
                                                        datasets: [{
                                                            data: [
                                                                stats.resolved,
                                                                stats.pending,
                                                                complaints.filter(c => ['in_progress', 'in_review'].includes(c.status)).length,
                                                                complaints.filter(c => c.status === 'rejected').length
                                                            ],
                                                            backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'],
                                                            borderWidth: 0,
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Trend Snapshot */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-gray-900 text-sm">Complaint Volume Trend</h3>
                                            <button onClick={() => setTab('reports')} className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                                                Full Analytics <TrendingUp size={12} />
                                            </button>
                                        </div>
                                        <div className="h-[280px]">
                                            <Bar
                                                data={{
                                                    labels: Object.keys(complaints.reduce((acc, c) => {
                                                        const m = new Date(c.createdAt).toLocaleString('default', { month: 'short' });
                                                        acc[m] = (acc[m] || 0) + 1;
                                                        return acc;
                                                    }, {})),
                                                    datasets: [{
                                                        label: 'New Reports',
                                                        data: Object.values(complaints.reduce((acc, c) => {
                                                            const m = new Date(c.createdAt).toLocaleString('default', { month: 'short' });
                                                            acc[m] = (acc[m] || 0) + 1;
                                                            return acc;
                                                        }, {})),
                                                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                                        borderRadius: 8,
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                                                        x: { grid: { display: false } }
                                                    },
                                                    plugins: { legend: { display: false } }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Recent complaints */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">Recent Reports</h3>
                                        <button onClick={() => setTab('complaints')} className="text-gray-400 hover:text-primary text-xs font-semibold">View All</button>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {complaints.slice(0, 5).map(c => (
                                            <div key={c._id} className="flex items-center justify-between px-6 py-4 hover:bg-indigo-50/30 transition-colors">
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{c.title || 'Untitled'}</p>
                                                    <p className="text-gray-400 text-xs">{c.address || c.location || 'No location'}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge status={c.status} />
                                                    <select value={c.status} onChange={e => handleStatusChange(c._id, e.target.value)}
                                                        className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Complaints Tab ── */}
                        {tab === 'complaints' && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                            placeholder="Search by title or location…"
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent" />
                                    </div>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 text-gray-600">
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="text-left px-6 py-3 font-semibold">Report</th>
                                                    <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Category</th>
                                                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                                                    <th className="text-left px-6 py-3 font-semibold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filtered.map(c => (
                                                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{c.title || 'Untitled'}</p>
                                                            <p className="text-gray-400 text-xs">{c.location || '—'}</p>
                                                        </td>
                                                        <td className="px-6 py-4 hidden md:table-cell">
                                                            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full capitalize">{c.category || 'General'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <select value={c.status} onChange={e => handleStatusChange(c._id, e.target.value)}
                                                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:ring-2 focus:ring-primary/40 outline-none font-medium">
                                                                <option value="pending">Pending</option>
                                                                <option value="in_progress">In Progress</option>
                                                                <option value="resolved">Resolved</option>
                                                                <option value="rejected">Rejected</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button onClick={() => handleDelete(c._id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filtered.length === 0 && (
                                            <div className="text-center py-12 text-gray-400">
                                                <AlertTriangle size={32} className="mx-auto mb-2 text-gray-200" />
                                                No complaints found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Users Tab ── */}
                        {tab === 'users' && (
                            <div className="animate-fade-in">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="text-left px-6 py-3 font-semibold">User</th>
                                                    <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Email</th>
                                                    <th className="text-left px-6 py-3 font-semibold">Role</th>
                                                    <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {users.map(u => (
                                                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                                                                    {u.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-gray-900">{u.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{u.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${u.role === 'admin' ? 'bg-primary/10 text-primary' : u.role === 'volunteer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-400 text-xs hidden md:table-cell">
                                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {u.role !== 'admin' && (
                                                                <button onClick={() => deleteUser(u._id)}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {users.length === 0 && (
                                            <div className="text-center py-12 text-gray-400">
                                                <Users size={32} className="mx-auto mb-2 text-gray-200" />
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ── Reports Tab ── */}
                        {tab === 'reports' && (
                            <ReportsTab complaints={complaints} users={users} />
                        )}

                        {/* ── Logs Tab ── */}
                        {tab === 'logs' && (
                            <div className="animate-fade-in space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900">System Activity Logs</h3>
                                        <p className="text-xs text-gray-400">Tracking administrative actions and system events</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                    <th className="text-left px-6 py-3 font-semibold">Time</th>
                                                    <th className="text-left px-6 py-3 font-semibold">Admin</th>
                                                    <th className="text-left px-6 py-3 font-semibold">Action</th>
                                                    <th className="text-left px-6 py-3 font-semibold">Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {logs.length > 0 ? logs.map(log => (
                                                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{log.user_id ? log.user_id.name : 'System'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500">{log.details}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center py-12 text-gray-400">No logs available</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}