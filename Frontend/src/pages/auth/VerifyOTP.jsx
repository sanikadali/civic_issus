import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header/Header';
import { CheckCircle2, Mail, RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';

const RESEND_COOLDOWN = 45; // seconds

export default function VerifyOTP() {
    const navigate = useNavigate();
    const location = useLocation();

    // email + devOtp passed from RegisterForm via router state or query param
    const emailFromState = location.state?.email || '';
    const emailFromQuery = new URLSearchParams(location.search).get('email') || '';
    const email = emailFromState || emailFromQuery;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    /* Redirect to register if no email */
    useEffect(() => {
        if (!email) navigate('/register');
    }, [email, navigate]);

    /* Cooldown countdown */
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    /* Auto-focus first input on mount */
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);



    /* ── OTP box handlers ─────────────────────────────── */
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // only digits
        const next = [...otp];
        next[index] = value.slice(-1); // take only last char
        setOtp(next);
        setError('');
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...otp];
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        setOtp(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    /* ── Verify ───────────────────────────────────────── */
    const handleVerify = async (e) => {
        e?.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
        setLoading(true); setError('');
        try {
            const res = await axios.post('http://localhost:8000/api/auth/verify-otp', { email, otp: code });
            // Store user + token
            localStorage.setItem('user', JSON.stringify(res.data));
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally { setLoading(false); }
    };

    /* ── Resend ───────────────────────────────────────── */
    const handleResend = async () => {
        if (cooldown > 0) return;
        setResending(true); setError('');
        try {
            await axios.post('http://localhost:8000/api/auth/resend-otp', { email });
            setOtp(['', '', '', '', '', '']);
            setCooldown(RESEND_COOLDOWN);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not resend OTP. Please try again.');
        } finally { setResending(false); }
    };

    /* ── Success Screen ───────────────────────────────── */
    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center animate-bounce-in max-w-sm w-full">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 shadow-inner">
                            <CheckCircle2 size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Email Verified! 🎉</h2>
                        <p className="text-gray-500 text-sm mb-1">Your account is now active.</p>
                        <p className="text-gray-400 text-xs">Redirecting to dashboard…</p>
                        <div className="mt-5 flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main OTP Page ────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md animate-slide-up">

                    {/* Back link */}
                    <button onClick={() => navigate('/register')}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-primary text-sm mb-5 transition-colors group">
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Register
                    </button>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">



                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-2xl mb-5 shadow-lg shadow-primary/10">
                                <ShieldCheck size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Verify Your Email</h1>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                We sent a 6-digit code to
                            </p>
                            <p className="text-primary font-bold text-sm flex items-center justify-center gap-1.5 mt-1">
                                <Mail size={14} /> {email}
                            </p>
                        </div>

                        <form onSubmit={handleVerify} noValidate>
                            {/* OTP Boxes */}
                            <div className="flex justify-center gap-2.5 sm:gap-3 mb-6" onPaste={handlePaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => (inputRefs.current[i] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        className={`
                      w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-extrabold rounded-xl border-2 outline-none
                      transition-all duration-200 bg-gray-50
                      ${error
                                                ? 'border-red-400 text-red-600 focus:ring-2 focus:ring-red-300 animate-shake'
                                                : digit
                                                    ? 'border-primary/60 text-primary focus:ring-2 focus:ring-primary/40 bg-primary/5'
                                                    : 'border-gray-200 text-gray-900 focus:border-primary/60 focus:ring-2 focus:ring-primary/20'}
                    `}
                                    />
                                ))}
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 animate-fade-in">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Verify Button */}
                            <button type="submit" disabled={loading || otp.join('').length < 6}
                                className="btn-shimmer w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5
                   hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mb-5">
                                {loading
                                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying…</>
                                    : <><ShieldCheck size={17} /> Verify Email</>
                                }
                            </button>

                            {/* Divider */}
                            <div className="relative mb-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3">
                                    Didn't receive the code?
                                </div>
                            </div>

                            {/* Resend button */}
                            <button type="button" onClick={handleResend}
                                disabled={cooldown > 0 || resending}
                                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl border-2 border-gray-200
                   hover:border-primary/40 hover:text-primary hover:bg-primary/5
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200
                   transition-all duration-200 text-gray-600">
                                <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
                                {cooldown > 0
                                    ? `Resend in ${cooldown}s`
                                    : resending ? 'Sending…' : 'Resend OTP'}
                            </button>
                        </form>

                        {/* Info footer */}
                        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
                            The OTP expires in <span className="font-semibold text-gray-500">10 minutes</span>.<br />
                            Check your spam folder if you don't see the email.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
