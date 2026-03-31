import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import { Lock, Shield, Eye, EyeOff, User, Camera, X } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
    const [user, setUser] = useState({ name: '', email: '', location: '', role: '', profilePhoto: '', privacySettings: { profileVisibility: 'public', showEmail: true } });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [privacyData, setPrivacyData] = useState({ profileVisibility: 'public', showEmail: true });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (!storedUser?.token) { window.location.href = '/login'; return; }
                const config = { headers: { Authorization: `Bearer ${storedUser.token}` } };
                const res = await axios.get('http://localhost:8000/api/users/me', config);
                const data = { ...res.data, role: res.data.role || 'user', privacySettings: res.data.privacySettings || { profileVisibility: 'public', showEmail: true } };
                setUser(data);
                setFormData(data);
                setPrivacyData(data.privacySettings);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchUserData();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePrivacyChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPrivacyData({ ...privacyData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${storedUser.token}` } };
            const res = await axios.put('http://localhost:8000/api/users/profile', formData, config);
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...res.data }));
            setUser({ ...res.data, role: res.data.role || user.role });
            setIsEditing(false);
            alert('Profile updated!');
        } catch { alert('Failed to update profile'); }
    };

    const submitPasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('Passwords do not match'); return; }
        if (passwordData.newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            await axios.put('http://localhost:8000/api/users/profile', { currentPassword: passwordData.currentPassword, password: passwordData.newPassword }, { headers: { Authorization: `Bearer ${storedUser.token}` } });
            alert('Password changed!');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (e) { setPasswordError(e.response?.data?.message || 'Failed to change password'); }
    };

    const submitPrivacySettings = async (e) => {
        e.preventDefault();
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const res = await axios.put('http://localhost:8000/api/users/profile', { privacySettings: privacyData }, { headers: { Authorization: `Bearer ${storedUser.token}` } });
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...res.data }));
            setUser({ ...user, privacySettings: res.data.privacySettings });
            alert('Privacy settings updated!');
            setShowPrivacyModal(false);
        } catch { alert('Failed to update privacy settings'); }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setFormData({ ...formData, profilePhoto: reader.result }); setUser({ ...user, profilePhoto: reader.result }); };
            reader.readAsDataURL(file);
        }
    };

    const inputClass = (editing) =>
        `w-full bg-gray-50 border text-gray-800 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none transition-all ${editing ? 'border-primary/60 focus:ring-2 focus:ring-primary/40 bg-white' : 'border-gray-200 text-gray-600 cursor-not-allowed'}`;

    const modalInput = 'w-full bg-white border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all';

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
                <p className="text-gray-500 mb-8">Manage your account information and preferences</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Card */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center h-fit">
                        <div className="relative mb-4 group">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-md">
                                {user.profilePhoto ? <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : (user.name?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-white border border-gray-200 shadow p-1.5 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
                                <Camera size={13} className="text-gray-500" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                        <p className="text-gray-400 text-sm mb-3">{user.email}</p>
                        <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full capitalize">{user.role}</span>
                        <p className="text-gray-300 text-xs mt-4">Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>

                    {/* Forms */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Account Info */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-7">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><User size={17} className="text-primary" /> Account Information</h3>
                                    <p className="text-gray-400 text-sm mt-0.5">Update your personal details</p>
                                </div>
                                <button onClick={() => setIsEditing(!isEditing)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${isEditing ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    {isEditing ? 'Cancel' : '✎ Edit'}
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-600 text-sm font-medium mb-1.5">Full Name</label>
                                        <input type="text" name="name" value={isEditing ? formData.name : user.name} onChange={handleChange} className={inputClass(isEditing)} readOnly={!isEditing} />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 text-sm font-medium mb-1.5">Email Address</label>
                                        <input type="email" name="email" value={isEditing ? formData.email : user.email} onChange={handleChange} className={inputClass(isEditing)} readOnly={!isEditing} />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 text-sm font-medium mb-1.5">Role</label>
                                        {isEditing ? (
                                            <select name="role" value={formData.role?.toLowerCase() || 'user'} onChange={handleChange} className="w-full bg-white border border-primary/40 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40">
                                                <option value="user">User</option>
                                            </select>
                                        ) : (
                                            <input type="text" value={user.role} className={inputClass(false)} readOnly />
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-600 text-sm font-medium mb-1.5">Location</label>
                                        <input type="text" name="location" value={isEditing ? formData.location : (user.location || '')} onChange={handleChange} placeholder={isEditing ? 'Enter your city or area' : 'Not specified'} className={inputClass(isEditing)} readOnly={!isEditing} />
                                    </div>
                                    {isEditing && (
                                        <div className="md:col-span-2 flex justify-end">
                                            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all">Save Changes</button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Security */}
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                                    <Shield size={17} className="text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Security & Privacy</h3>
                                    <p className="text-gray-400 text-sm">Manage your password and visibility settings</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-4 rounded-xl transition-all text-left">
                                    <Lock size={17} className="text-gray-400 flex-shrink-0" />
                                    <div><div className="font-semibold text-sm">Change Password</div><div className="text-xs text-gray-400">Update your login password</div></div>
                                </button>
                                <button onClick={() => setShowPrivacyModal(true)} className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-4 rounded-xl transition-all text-left">
                                    <Eye size={17} className="text-gray-400 flex-shrink-0" />
                                    <div><div className="font-semibold text-sm">Privacy Settings</div><div className="text-xs text-gray-400">Manage profile visibility</div></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={submitPasswordChange} className="p-6 space-y-4">
                            {passwordError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{passwordError}</div>}
                            <div>
                                <label className="block text-gray-600 text-sm font-medium mb-1.5">Current Password</label>
                                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value })} className={modalInput} required />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm font-medium mb-1.5">New Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value })} className={`${modalInput} pr-12`} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm font-medium mb-1.5">Confirm New Password</label>
                                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value })} className={modalInput} required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-all">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Privacy Modal */}
            {showPrivacyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Privacy Settings</h3>
                            <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <form onSubmit={submitPrivacySettings} className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-800">Profile Visibility</div>
                                    <div className="text-xs text-gray-400">Control who can see your profile</div>
                                </div>
                                <select name="profileVisibility" value={privacyData.profileVisibility} onChange={handlePrivacyChange} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between border-t pt-4">
                                <div>
                                    <div className="font-medium text-gray-800">Show Email Address</div>
                                    <div className="text-xs text-gray-400">Display your email on your public profile</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="showEmail" checked={privacyData.showEmail} onChange={handlePrivacyChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPrivacyModal(false)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-xl transition-all">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
