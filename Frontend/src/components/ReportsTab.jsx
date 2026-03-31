import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement,
    PointElement, LineElement, Filler
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Download, FileText, TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart2, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── Register Chart.js components ─────────────────────── */
ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement,
    PointElement, LineElement, Filler
);

/* ── Color palette ─────────────────────────────────────── */
const PALETTE = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
    '#14b8a6', '#84cc16',
];

/* ── Helpers ───────────────────────────────────────────── */
const fmt = (n) => String(n).padStart(2, '0');

function getMonthLabel(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${fmt(d.getMonth() + 1)}`;
}

function downloadCSV(rows, filename) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(','),
        ...rows.map(r =>
            headers.map(h => {
                const val = r[h] === null || r[h] === undefined ? '' : String(r[h]);
                return `"${val.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── Summary Card ──────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, sub, color }) {
    return (
        <div className={`bg-white rounded-2xl border ${color.border} shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
            <div className={`w-12 h-12 ${color.bg} ${color.text} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

/* ── Chart Card wrapper ────────────────────────────────── */
function ChartCard({ title, children, onExportCSV, onExportPDF }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                <div className="flex gap-2">
                    {onExportCSV && (
                        <button
                            onClick={onExportCSV}
                            title="Export CSV"
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors"
                        >
                            <Download size={12} /> CSV
                        </button>
                    )}
                    {onExportPDF && (
                        <button
                            onClick={onExportPDF}
                            title="Export PDF"
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                        >
                            <FileText size={12} /> PDF
                        </button>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function ReportsTab({ complaints, users = [] }) {
    /* ── Filters ─────────────────────────────────────────── */
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [locFilter, setLocFilter] = useState('all');

    /* ── Category & location lists ────────────────────────── */
    const allCategories = useMemo(() => {
        const s = new Set(complaints.map(c => c.issueType || c.category || 'Uncategorized').filter(Boolean));
        return ['all', ...Array.from(s).sort()];
    }, [complaints]);

    const allLocations = useMemo(() => {
        const s = new Set(complaints.map(c => {
            if (!c.address) return null;
            return c.address.split(',')[0].trim();
        }).filter(Boolean));
        return ['all', ...Array.from(s).sort()];
    }, [complaints]);

    /* ── Apply filters ────────────────────────────────────── */
    const filtered = useMemo(() => {
        return complaints.filter(c => {
            const d = new Date(c.createdAt);
            if (dateFrom && d < new Date(dateFrom)) return false;
            if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
            const cat = c.issueType || c.category || 'Uncategorized';
            if (catFilter !== 'all' && cat !== catFilter) return false;
            const loc = c.address ? c.address.split(',')[0].trim() : '';
            if (locFilter !== 'all' && loc !== locFilter) return false;
            return true;
        });
    }, [complaints, dateFrom, dateTo, catFilter, locFilter]);

    // ── Summary stats ──────────────────────────────────────
    const total = filtered.length;
    const resolved = filtered.filter(c => c.status === 'resolved').length;
    const pending = filtered.filter(c => ['pending', 'received'].includes(c.status)).length;
    const inReview = filtered.filter(c => ['in_progress', 'in_review'].includes(c.status)).length;
    const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    /* ── Category distribution (Pie) ─────────────────────── */
    const categoryData = useMemo(() => {
        const counts = {};
        filtered.forEach(c => {
            const k = c.issueType || c.category || 'Uncategorized';
            counts[k] = (counts[k] || 0) + 1;
        });
        const labels = Object.keys(counts);
        return {
            rows: labels.map(l => ({ Category: l, Count: counts[l] })),
            chartData: {
                labels,
                datasets: [{
                    data: labels.map(l => counts[l]),
                    backgroundColor: PALETTE.slice(0, labels.length),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }]
            }
        };
    }, [filtered]);

    /* ── Area-wise distribution (Bar) ────────────────────── */
    const areaData = useMemo(() => {
        const counts = {};
        filtered.forEach(c => {
            const key = c.address ? c.address.split(',')[0].trim() : 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = sorted.map(e => e[0]);
        const data = sorted.map(e => e[1]);
        return {
            rows: sorted.map(([Area, Count]) => ({ Area, Count })),
            chartData: {
                labels,
                datasets: [{
                    label: 'Complaints',
                    data,
                    backgroundColor: '#6366f1cc',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    borderRadius: 6,
                }]
            }
        };
    }, [filtered]);

    /* ── Monthly trend (Line) ─────────────────────────────── */
    const trendData = useMemo(() => {
        const counts = {};
        filtered.forEach(c => {
            const m = getMonthLabel(c.createdAt);
            counts[m] = (counts[m] || 0) + 1;
        });
        const labels = Object.keys(counts).sort();
        const data = labels.map(l => counts[l]);
        return {
            rows: labels.map((Month, i) => ({ Month, Complaints: data[i] })),
            chartData: {
                labels,
                datasets: [{
                    label: 'Complaints per Month',
                    data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                }]
            }
        };
    }, [filtered]);

    /* ── Status breakdown ─────────────────────────────────── */
    const statusData = useMemo(() => {
        const counts = {};
        filtered.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
        const labels = Object.keys(counts);
        return {
            rows: labels.map(l => ({ Status: l, Count: counts[l] })),
            chartData: {
                labels,
                datasets: [{
                    data: labels.map(l => counts[l]),
                    backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6'],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }]
            }
        };
    }, [filtered]);

    /* ── Volunteer breakdown ──────────────────────────────── */
    const volunteerData = useMemo(() => {
        const counts = {};
        filtered.forEach(c => {
            if (c.assigned_to) {
                const u = users.find(user => user._id === c.assigned_to || user.id === c.assigned_to);
                const name = u ? u.name : 'Unknown User';
                counts[name] = (counts[name] || 0) + 1;
            } else {
                counts['Unassigned'] = (counts['Unassigned'] || 0) + 1;
            }
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(e => e[0]);
        const data = sorted.map(e => e[1]);
        return {
            rows: sorted.map(([Volunteer, Count]) => ({ Volunteer, Count })),
            chartData: {
                labels,
                datasets: [{
                    label: 'Assigned Cases',
                    data,
                    backgroundColor: '#8b5cf6cc',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    borderRadius: 6,
                }]
            }
        };
    }, [filtered, users]);

    /* ── Shared chart options ─────────────────────────────── */
    const pieOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 } } }, tooltip: { enabled: true } }
    };

    const barOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            x: { ticks: { font: { size: 11 }, maxRotation: 40 }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }
        }
    };

    const lineOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            x: { ticks: { font: { size: 11 } }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } }
        }
    };

    /* ── Export Helpers ───────────────────────────────────── */
    const exportFullCSV = () => {
        const rows = filtered.map(c => {
            const u = users.find(user => user._id === c.assigned_to || user.id === c.assigned_to);
            return {
                ID: c._id,
                Title: c.title || '',
                Category: c.issueType || c.category || 'Uncategorized',
                Status: c.status,
                Address: c.address || '',
                'Assigned To': u ? u.name : (c.assigned_to || 'Unassigned'),
                'Created At': new Date(c.createdAt).toLocaleString(),
            };
        });
        downloadCSV(rows, `complaints_report_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportPDF = (title, rows, headers) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(99, 102, 241);
        doc.text('Clean Street — ' + title, 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}  |  Total records: ${rows.length}`, 14, 26);
        autoTable(doc, {
            startY: 32,
            head: [headers],
            body: rows.map(r => headers.map(h => r[h] ?? '')),
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 255] },
        });
        doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    };

    const hasData = filtered.length > 0;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* ── Toolbar ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-wrap gap-3 items-end">

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 min-w-[140px]">
                            {allCategories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                        <select value={locFilter} onChange={e => setLocFilter(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 min-w-[160px]">
                            {allLocations.map(l => <option key={l} value={l}>{l === 'all' ? 'All Locations' : l}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); setCatFilter('all'); setLocFilter('all'); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors mt-auto"
                    >
                        <RefreshCw size={13} /> Reset
                    </button>

                    <button
                        onClick={exportFullCSV}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm mt-auto"
                    >
                        <Download size={13} /> Export All CSV
                    </button>

                    <button
                        onClick={() => exportPDF('Full Complaints Report',
                            filtered.map(c => ({
                                Title: c.title || 'N/A',
                                Category: c.issueType || c.category || 'Uncategorized',
                                Status: c.status,
                                Address: c.address || 'N/A',
                                Date: new Date(c.createdAt).toLocaleDateString(),
                            })),
                            ['Title', 'Category', 'Status', 'Address', 'Date']
                        )}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm mt-auto"
                    >
                        <FileText size={13} /> Export PDF
                    </button>
                </div>
            </div>

            {/* ── Summary Cards ────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={BarChart2} label="Total Complaints" value={total}
                    color={{ bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' }} />
                <SummaryCard icon={CheckCircle2} label="Resolved" value={resolved}
                    sub={`${resRate}% resolution rate`}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' }} />
                <SummaryCard icon={Clock} label="Pending / Received" value={pending}
                    color={{ bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' }} />
                <SummaryCard icon={AlertCircle} label="In Progress" value={inReview}
                    color={{ bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' }} />
            </div>

            {/* ── Resolution Rate Bar ──────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <TrendingUp size={15} className="text-indigo-500" /> Overall Resolution Rate
                    </span>
                    <span className="text-indigo-600 font-extrabold text-lg">{resRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                        className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${resRate}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span><span>100%</span>
                </div>
            </div>

            {!hasData && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
                    <BarChart2 size={40} className="mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold">No data for selected filters</p>
                    <p className="text-sm mt-1">Try adjusting the date range or clearing filters.</p>
                </div>
            )}

            {hasData && (
                <>
                    {/* ── Row 1: Pie charts ──────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Category Pie */}
                        <ChartCard
                            title="Category-wise Distribution"
                            onExportCSV={() => downloadCSV(categoryData.rows, 'category_distribution.csv')}
                            onExportPDF={() => exportPDF('Category Distribution', categoryData.rows, ['Category', 'Count'])}
                        >
                            <div style={{ height: 280 }}>
                                <Pie data={categoryData.chartData} options={pieOpts} />
                            </div>
                        </ChartCard>

                        {/* Status Pie */}
                        <ChartCard
                            title="Status Breakdown"
                            onExportCSV={() => downloadCSV(statusData.rows, 'status_breakdown.csv')}
                            onExportPDF={() => exportPDF('Status Breakdown', statusData.rows, ['Status', 'Count'])}
                        >
                            <div style={{ height: 280 }}>
                                <Pie data={statusData.chartData} options={pieOpts} />
                            </div>
                        </ChartCard>
                    </div>

                    {/* ── Row 2: Bar chart ───────────────────── */}
                    <ChartCard
                        title="Area-wise Complaint Count (Top 10)"
                        onExportCSV={() => downloadCSV(areaData.rows, 'area_analysis.csv')}
                        onExportPDF={() => exportPDF('Area Analysis', areaData.rows, ['Area', 'Count'])}
                    >
                        <div style={{ height: 280 }}>
                            {areaData.chartData.labels.length > 0
                                ? <Bar data={areaData.chartData} options={barOpts} />
                                : <p className="text-center text-gray-400 text-sm pt-20">No address data available</p>}
                        </div>
                    </ChartCard>

                    {/* ── Row 3: Bar & Line chart ──────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        

                        
                    </div>

                    {/* ── Raw data table ─────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 text-sm">Filtered Complaints ({filtered.length})</h3>
                            <button
                                onClick={exportFullCSV}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors"
                            >
                                <Download size={12} /> CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <th className="text-left px-5 py-3 font-semibold">Title</th>
                                        <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Category</th>
                                        <th className="text-left px-5 py-3 font-semibold">Status</th>
                                        <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Address</th>
                                        <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.slice(0, 50).map(c => (
                                        <tr key={c._id} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-[180px]">{c.title || '—'}</td>
                                            <td className="px-5 py-3 hidden sm:table-cell">
                                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                                                    {c.issueType || c.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell truncate max-w-[160px]">{c.address || '—'}</td>
                                            <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length > 50 && (
                                <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-50">
                                    Showing first 50 of {filtered.length} — export CSV/PDF for full data
                                </p>
                            )}
                            {filtered.length === 0 && (
                                <div className="text-center py-10 text-gray-400">No records match the filters</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ── Inline status badge ───────────────────────────────── */
function StatusBadge({ status }) {
    const map = {
        resolved: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        received: 'bg-amber-100 text-amber-700',
        in_progress: 'bg-blue-100 text-blue-700',
        in_review: 'bg-blue-100 text-blue-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status?.replace('_', ' ') || '—'}
        </span>
    );
}