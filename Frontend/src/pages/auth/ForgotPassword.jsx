import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header/Header';
import { Mail, ArrowLeft, CheckCircle2, Send, Loader2, AlertCircle, Lock } from 'lucide-react';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (!email) { setError('Please enter your email address.'); return; }
        if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/api/users/forgot-password', { email });
            setPreviewUrl(res.data?.previewUrl || '');
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md animate-slide-up">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        {!submitted ? (
                            <>
                                <div className="text-center mb-7">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl mb-4 shadow-lg shadow-primary/10">
                                        <Mail size={22} className="text-white" />
                                    </div>
                                    <h1 className="text-2xl font-extrabold text-gray-900">Forgot password?</h1>
                                    <p className="text-gray-400 text-sm mt-1">Enter your email to receive a reset link</p>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-2.5 mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 animate-slide-down animate-shake">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate>
                                    <label className="block text-gray-600 text-sm font-semibold mb-1.5">Email Address</label>
                                    <div className="relative group mb-5">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input type="email" value={email}
                                            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                                            placeholder="you@example.com"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400
                                  outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:bg-white transition-all duration-300 hover:border-primary/40"
                                            autoComplete="email" />
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full btn-shimmer text-white font-bold py-3.5 rounded-xl shadow-md shadow-primary/20
                               flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]
                               transition-transform duration-200 disabled:opacity-60">
                                        {loading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send Reset Link</>}
                                    </button>
                                </form>

                                <p className="text-center mt-5">
                                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors font-medium">
                                        <ArrowLeft size={14} /> Back to Login
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="animate-bounce-in inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-5 shadow-md shadow-primary/10">
                                    <CheckCircle2 size={38} className="text-primary" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-gray-900 mb-2 animate-slide-up">Email sent!</h2>
                                <p className="text-gray-500 mb-1 animate-slide-up delay-100">We've sent a reset link to:</p>
                                <p className="text-primary font-bold mb-5 animate-slide-up delay-200">{email}</p>

                                {previewUrl && (
                                    <div className="mb-5 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm animate-slide-up delay-200">
                                        <p className="text-primary font-semibold mb-1">📧 Dev Preview (Ethereal):</p>
                                        <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-primary underline break-all text-xs hover:text-primary-hover">{previewUrl}</a>
                                    </div>
                                )}

                                <p className="text-gray-400 text-sm mb-6 animate-slide-up delay-300">
                                    Didn't receive it?{' '}
                                    <button onClick={() => { setSubmitted(false); setEmail(''); }} className="text-primary hover:text-primary-hover font-semibold">try again</button>
                                </p>
                                <Link to="/login">
                                    <button className="btn-shimmer text-white font-semibold py-3 px-8 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
                                        Back to Login
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
