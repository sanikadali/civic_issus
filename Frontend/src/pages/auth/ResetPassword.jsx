import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header/Header';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const calcStrength = (p) => {
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };
    const strength = calcStrength(password);
    const strengthBars = [
        'bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-blue-500', 'bg-primary'
    ];

    const passwordsMatch = confirmPassword !== '' && password === confirmPassword;
    const passwordsMismatch = confirmPassword !== '' && password !== confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await axios.post(`http://localhost:8000/api/users/reset-password/${token}`, { password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
        } finally { setLoading(false); }
    };

    const inputBase = 'w-full bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:bg-white transition-all duration-300 hover:border-primary/40';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        {success ? (
                            <div className="text-center py-4">
                                <div className="animate-bounce-in inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-5 shadow-md shadow-primary/10">
                                    <CheckCircle2 size={38} className="text-primary" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Password reset!</h2>
                                <p className="text-gray-500 mb-6">Your password has been reset. Redirecting to login…</p>
                                <Link to="/login">
                                    <button className="btn-shimmer text-white font-semibold py-3 px-8 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
                                        Go to Login
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-7">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl mb-4 shadow-lg shadow-primary/10">
                                        <Lock size={22} className="text-white" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold text-gray-900">Set new password</h1>
                                    <p className="text-gray-400 text-sm mt-1">Enter and confirm your new password</p>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-2.5 mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 animate-slide-down animate-shake">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                    <div>
                                        <label className="block text-gray-600 text-sm font-semibold mb-1.5">New Password</label>
                                        <div className="relative group">
                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }} placeholder="Create a strong password" className={`${inputBase} pl-10 pr-12`} />
                                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {password && (
                                            <div className="mt-2">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength ? strengthBars[strength] : 'bg-gray-100'}`} />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 text-sm font-semibold mb-1.5">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }} placeholder="Repeat your password"
                                                className={`${inputBase} pl-10 pr-12 ${passwordsMismatch ? 'border-red-300 focus:ring-red-400' : ''} ${passwordsMatch ? 'border-primary/40 focus:ring-primary/40' : ''}`} />
                                            <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {confirmPassword && (
                                            <p className={`text-xs mt-1.5 font-semibold flex items-center gap-1 animate-fade-in ${passwordsMatch ? 'text-primary' : 'text-red-500'}`}>
                                                {passwordsMatch ? <><CheckCircle2 size={12} /> Passwords match!</> : <><AlertCircle size={12} /> Passwords do not match</>}
                                            </p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full btn-shimmer text-white font-bold py-3.5 rounded-xl shadow-md shadow-primary/20
                               flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]
                               transition-transform duration-200 disabled:opacity-60 mt-1">
                                        {loading ? <><Loader2 size={18} className="animate-spin" /> Updating…</> : <><Lock size={17} /> Reset Password</>}
                                    </button>
                                </form>

                                <p className="text-center mt-5">
                                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors font-medium">
                                        <ArrowLeft size={14} /> Back to Login
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
