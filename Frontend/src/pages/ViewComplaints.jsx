import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import { ThumbsUp, ThumbsDown, MessageSquare, MapPin, Clock, Send, Trash2, Edit3 } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ViewComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedComments, setExpandedComments] = useState({});
    const [newComments, setNewComments] = useState({});
    const [user, setUser] = useState(null);
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', address: '' });

    // ✅ FILTER STATE
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/complaints');
                setComplaints(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);
        fetchComplaints();
    }, []);

    // ✅ FILTER MAP
    const filterMap = {
        'All Status': 'all',
        'Pending': 'received',
        'In Review': 'in_review',
        'Resolved': 'resolved'
    };

    // ✅ FILTER LOGIC
    const filteredComplaints = complaints.filter(c => {
        if (statusFilter === 'all') return true;
        return c.status === statusFilter;
    });

    const handleVote = async (id, voteType) => {
        if (!user?.token) { alert('Please login to vote'); return; }
        try {
            const res = await axios.put(`http://localhost:8000/api/complaints/${id}/vote`, { voteType }, { headers: { Authorization: `Bearer ${user.token}` } });
            setComplaints(complaints.map(c => c._id === id ? res.data : c));
        } catch { alert('Failed to vote'); }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!user?.token) return;
        try {
            await axios.put(`http://localhost:8000/api/complaints/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${user.token}` } });
            setComplaints(complaints.map(c => c._id === id ? { ...c, status: newStatus } : c));
        } catch { alert('Failed to update status'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this complaint?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/complaints/${id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setComplaints(complaints.filter(c => c._id !== id));
        } catch { alert('Failed to delete complaint'); }
    };

    const startEditing = (c) => { setEditingComplaint(c._id); setEditForm({ title: c.title, description: c.description, address: c.address }); };
    const cancelEditing = () => { setEditingComplaint(null); setEditForm({ title: '', description: '', address: '' }); };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8000/api/complaints/${editingComplaint}`, editForm, { headers: { Authorization: `Bearer ${user.token}` } });
            setComplaints(complaints.map(c => c._id === editingComplaint ? { ...c, ...editForm } : c));
            cancelEditing();
        } catch { alert('Failed to update'); }
    };

    const toggleComments = (id) => setExpandedComments(prev => ({ ...prev, [id]: !prev[id] }));

    const submitComment = async (id) => {
        if (!user?.token) { alert('Please login to comment'); return; }
        const text = newComments[id];
        if (!text) return;
        try {
            const res = await axios.post(`http://localhost:8000/api/complaints/${id}/comment`, { text }, { headers: { Authorization: `Bearer ${user.token}` } });
            setComplaints(complaints.map(c => c._id === id ? res.data : c));
            setNewComments(prev => ({ ...prev, [id]: '' }));
        } catch { alert('Failed to post comment'); }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'resolved': return 'bg-primary/10 text-primary';
            case 'in_review': return 'bg-violet-100 text-violet-700';
            case 'in_progress': return 'bg-violet-100 text-violet-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'received': return 'bg-blue-100 text-blue-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    const timeAgo = (d) => {
        if (!d) return '';
        const s = Math.floor((new Date() - new Date(d)) / 1000);
        if (s < 60) return 'Just now';
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const issueEmoji = (type) => ({ pothole: '🕳️', street_light: '💡', water_leakage: '💧', garbage: '🗑️' }[type] || '📢');

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-7">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Reports</h1>
                    <p className="text-gray-500">Browse, vote, and comment on civic issues in your community</p>
                </div>

                {/* ✅ FILTERS */}
                <div className="flex gap-3 mb-7 flex-wrap">
                    {Object.keys(filterMap).map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(filterMap[f])}
                            className={`px-4 py-2 text-sm rounded-lg border transition-all 
                            ${statusFilter === filterMap[f]
                                ? 'bg-primary text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <p className="text-gray-400 text-lg font-medium">No reports found for this filter.</p>
                        <Link to="/report-issue">
                            <button className="mt-4 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm">Be the first to report!</button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {filteredComplaints.map((complaint) => (
                            // ✅ YOUR FULL ORIGINAL CARD (UNCHANGED)
                            <div key={complaint._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col p-6">
                                {/* Card Header */}
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl mt-0.5">{issueEmoji(complaint.issueType)}</span>
                                        <h3 className="font-bold text-gray-800 leading-snug">{complaint.title}</h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${getStatusBadge(complaint.status)}`}>
                                            {complaint.status?.replace('_', ' ')}
                                        </span>
                                        {complaint.assigned_to && complaint.assigned_to !== 'Unassigned' && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{complaint.assigned_to}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Admin Status Update */}
                                {user && (user.role === 'admin' || user.role === 'volunteer') && (
                                    <select value={complaint.status} onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                                        className="mb-3 text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 w-fit">
                                        <option value="received">Received</option>
                                        <option value="in_review">In Review</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                )}

                                {/* Edit / Delete */}
                                {user && (String(user._id) === String(complaint.user?._id || complaint.user_id) || user.role === 'admin') && (
                                    <div className="flex gap-2 mb-3">
                                        <button onClick={() => handleDelete(complaint._id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors">
                                            <Trash2 size={12} /> Delete
                                        </button>
                                        <button onClick={() => startEditing(complaint)} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                                            <Edit3 size={12} /> Edit
                                        </button>
                                    </div>
                                )}

                                {editingComplaint === complaint._id ? (
                                    <form onSubmit={handleEditSubmit} className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                        <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className="w-full text-sm bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" required />
                                        <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full text-sm bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" rows="3" required />
                                        <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="Address" className="w-full text-sm bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" required />
                                        <div className="flex gap-2 justify-end">
                                            <button type="button" onClick={cancelEditing} className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 bg-white rounded-lg hover:bg-gray-50">Cancel</button>
                                            <button type="submit" className="px-3 py-1.5 text-xs bg-primary hover:bg-primary-hover text-white rounded-lg transition-all">Save</button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-3 ml-8">{complaint.description}</p>
                                )}

                                {complaint.photo && (
                                    <img src={complaint.photo} alt={complaint.title} className="w-full h-44 object-cover rounded-xl border border-gray-100 mb-4" />
                                )}

                                <div className="mt-auto ml-8">
                                    <div className="flex gap-4 mb-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><MapPin size={11} /> {complaint.address}</span>
                                        <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(complaint.createdAt)}</span>
                                    </div>

                                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleVote(complaint._id, 'upvote')}
                                                className={`flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg transition-all ${complaint.upvotes?.includes(user?._id) ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                                                <ThumbsUp size={14} fill={complaint.upvotes?.includes(user?._id) ? 'currentColor' : 'none'} />
                                                <span>{complaint.upvotes?.length || 0}</span>
                                            </button>
                                            <button onClick={() => handleVote(complaint._id, 'downvote')}
                                                className={`flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg transition-all ${complaint.downvotes?.includes(user?._id) ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                                                <ThumbsDown size={14} fill={complaint.downvotes?.includes(user?._id) ? 'currentColor' : 'none'} />
                                                <span>{complaint.downvotes?.length || 0}</span>
                                            </button>
                                        </div>
                                        <button onClick={() => toggleComments(complaint._id)}
                                            className={`flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg transition-all ${expandedComments[complaint._id] ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}>
                                            <MessageSquare size={14} />
                                            <span>Comments ({complaint.comments?.length || 0})</span>
                                        </button>
                                    </div>

                                    {expandedComments[complaint._id] && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                                                {complaint.comments?.length > 0 ? complaint.comments.map((c, i) => (
                                                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm">
                                                        <p className="text-gray-700">{c.text}</p>
                                                        <span className="text-xs text-gray-400 mt-1 block">{timeAgo(c.createdAt)}</span>
                                                    </div>
                                                )) : (
                                                    <p className="text-center text-gray-400 text-sm italic py-3">No comments yet.</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={newComments[complaint._id] || ''} onChange={(e) => setNewComments(prev => ({ ...prev, [complaint._id]: e.target.value }))}
                                                    placeholder="Add a comment..." onKeyDown={(e) => e.key === 'Enter' && submitComment(complaint._id)}
                                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent" />
                                                <button onClick={() => submitComment(complaint._id)} disabled={!newComments[complaint._id]}
                                                    className="bg-primary hover:bg-primary-hover text-white px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                                    <Send size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ViewComplaints;
