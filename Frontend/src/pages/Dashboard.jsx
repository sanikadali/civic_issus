import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header/Header';
import {
    FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp,
    MapPin, Calendar, ChevronRight, Plus
} from 'lucide-react';

/* ── Animated Counter ──────────────────────────────────── */
function AnimCounter({ target, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const steps = 50;
                let cur = 0;
                const timer = setInterval(() => {
                    cur += target / steps;
                    if (cur >= target) { setCount(target); clearInterval(timer); }
                    else setCount(Math.floor(cur));
                }, 30);
            } else if (entry.isIntersecting && started.current) {
                // If target changes while already intersecting, just update count immediately or re-animate
                setCount(target);
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [target]);
    return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Status Badge ──────────────────────────────────────── */
function StatusBadge({ status }) {
    const map = {
        received: 'bg-blue-100 text-blue-700',
        pending: 'bg-amber-100 text-amber-700',
        in_review: 'bg-violet-100 text-violet-700',
        in_progress: 'bg-violet-100 text-violet-700',
        resolved: 'bg-primary/10 text-primary',
        rejected: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status?.replace('_', ' ') || 'Unknown'}
        </span>
    );
}

export default function Dashboard() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : {};

    useEffect(() => {
        if (!user?.token) { navigate('/login'); return; }
        axios.get('http://localhost:8000/api/complaints/my', { headers: { Authorization: `Bearer ${user.token}` } })
            .then(res => setComplaints(res.data || []))
            .catch(() => setComplaints([]))
            .finally(() => setLoading(false));
    }, []);

    const myComplaints = complaints.filter(c => c.user === user?._id || c.userId === user?._id);
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => ['received', 'pending'].includes(c.status)).length;
    const inProg = complaints.filter(c => ['in_review', 'in_progress'].includes(c.status)).length;
    const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;


    const statCards = [
        { label: 'Total Reports', value: total, icon: FileText, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        { label: 'Resolved', value: resolved, icon: CheckCircle2, bg: 'bg-primary/5', text: 'text-primary', border: 'border-primary/20' },
        { label: 'Pending', value: pending, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
        { label: 'In Progress', value: inProg, icon: TrendingUp, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            Welcome back, <span className="text-primary">{user?.name ? user.name.split(' ')[0] : 'Guest'}</span> 👋
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Here's what's happening in your community</p>
                    </div>
                    <Link to="/report-issue">
                        <button className="btn-shimmer flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-transform text-sm">
                            <Plus size={16} /> New Report
                        </button>
                    </Link>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {statCards.map(({ label, value, icon: Icon, bg, text, border }) => (
                        <div key={label}
                            className={`bg-white rounded-2xl border ${border} p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-slide-up`}>
                            <div className={`inline-flex w-11 h-11 ${bg} ${text} rounded-xl items-center justify-center mb-4 shadow-sm`}>
                                <Icon size={20} />
                            </div>
                            <div className="text-3xl font-black text-gray-900 mb-0.5">
                                <AnimCounter target={value} />
                            </div>
                            <div className="text-sm text-gray-500">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Resolution Bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 animate-slide-up delay-200">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-700 text-sm">Community Resolution Rate</span>
                        <span className="text-primary font-extrabold text-lg">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-primary to-primary-hover h-3 rounded-full transition-all duration-1000 shadow-sm"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <p className="text-gray-400 text-xs mt-2">{resolved} of {total} issues resolved</p>
                </div>

                {/* Complaints Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up delay-300">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Recent Community Reports</h2>
                        <Link to="/view-complaints" className="text-primary hover:text-primary-hover text-sm font-semibold flex items-center gap-1 transition-colors">
                            View all <ChevronRight size={15} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No reports yet</p>
                            <Link to="/report-issue" className="text-primary text-sm hover:text-primary-hover font-semibold mt-2 inline-block">Submit the first one →</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="text-left px-6 py-3 font-semibold">Title</th>
                                        <th className="text-left px-6 py-3 font-semibold hidden sm:table-cell">Category</th>
                                        <th className="text-left px-6 py-3 font-semibold hidden md:table-cell">Location</th>
                                        <th className="text-left px-6 py-3 font-semibold">Status</th>
                                        <th className="text-left px-6 py-3 font-semibold hidden lg:table-cell">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {complaints.slice(0, 10).map((c) => (
                                        <tr key={c._id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigate('/view-complaints')}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 truncate max-w-[180px]">{c.title || 'Untitled'}</div>
                                                {c.description && <div className="text-gray-400 text-xs truncate max-w-[180px] mt-0.5">{c.description}</div>}
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full capitalize">{c.issueType || 'General'}</span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="flex items-center gap-1 text-gray-500 text-xs text-wrap"><MapPin size={11} className="shrink-0" />{c.address || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                                            <td className="px-6 py-4 text-gray-400 text-xs hidden lg:table-cell">
                                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
