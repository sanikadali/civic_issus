import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────── */
const Req = () => <span className="text-red-500 text-sm ml-0.5">*</span>;

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-red-500 text-xs font-medium animate-fade-in flex items-center gap-1">
      <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
      {msg}
    </p>
  );
}

function inputCls(err, val) {
  const base = 'w-full bg-gray-50 border rounded-xl px-4 py-3 pr-10 text-gray-800 placeholder-gray-400 text-sm outline-none transition-all duration-300 ';
  if (err) return base + 'border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400';
  if (val) return base + 'border-primary/60 focus:ring-2 focus:ring-primary/40 focus:border-primary/60';
  return base + 'border-gray-200 focus:ring-2 focus:ring-primary/40 focus:border-transparent';
}

const strengthLevel = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-primary'];

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);

  const strength = strengthLevel(form.password);

  const validate = (name, value, all = form) => {
    let msg = '';
    if (name === 'name' && !value.trim()) msg = 'Full Name is required';
    if (name === 'email') {
      if (!value.trim()) msg = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(value)) msg = 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) msg = 'Password is required';
      else if (value.length < 6) msg = 'Password must be at least 6 characters';
    }
    if (name === 'confirmPassword') {
      if (!value) msg = 'Please confirm your password';
      else if (value !== all.password) msg = 'Passwords do not match';
    }
    return msg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value, updated) }));
    if (name === 'password' && errors.confirmPassword)
      setErrors(prev => ({ ...prev, confirmPassword: validate('confirmPassword', updated.confirmPassword, updated) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    console.log("Submit clicked");
    e.preventDefault();
    setApiError('');
    const newErrors = {};
    ['name', 'email', 'password', 'confirmPassword'].forEach(k => {
      const msg = validate(k, form[k]);
      if (msg) newErrors[k] = msg;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      document.querySelector('.border-red-400')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/auth/register', {
        name: form.name, email: form.email, password: form.password,
      });
      // Redirect to OTP page, pass email (and devOtp if dev mode) via router state
      navigate('/verify-otp', { state: { email: form.email, devOtp: res.data.devOtp } });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const pwMatch = form.confirmPassword && form.password === form.confirmPassword;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl mb-4 shadow-lg shadow-primary/10">
          <UserPlus size={24} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Create Account</h2>
        <p className="text-gray-400 text-sm mt-1">Join CleanStreet — verify by email OTP</p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 animate-shake animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Full Name — REQUIRED */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1.5">
            Full Name <Req />
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" name="name" autoComplete="name"
              placeholder="Your full name"
              value={form.name} onChange={handleChange} onBlur={handleBlur}
              className={`${inputCls(errors.name, form.name && !errors.name)} pl-10`}
            />
          </div>
          <FieldError msg={errors.name} />
        </div>

        {/* Email — REQUIRED */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1.5">
            Email <Req />
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" name="email" autoComplete="email"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange} onBlur={handleBlur}
              className={`${inputCls(errors.email, form.email && !errors.email)} pl-10`}
            />
          </div>
          <FieldError msg={errors.email} />
        </div>

        {/* Password — REQUIRED */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1.5">
            Password <Req />
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} name="password" autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange} onBlur={handleBlur}
              className={`${inputCls(errors.password, form.password && !errors.password && strength >= 3)} pl-10`}
            />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FieldError msg={errors.password} />
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor[strength] : 'bg-gray-100'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400">Strength: <span className="font-semibold text-gray-600">{strengthLabel[strength]}</span></p>
            </div>
          )}
        </div>

        {/* Confirm Password — REQUIRED */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1.5">
            Confirm Password <Req />
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showCp ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
              className={`${inputCls(errors.confirmPassword, pwMatch)} pl-10`}
            />
            <button type="button" onClick={() => setShowCp(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
              {showCp ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FieldError msg={errors.confirmPassword} />
          {pwMatch && (
            <p className="mt-1.5 text-primary text-xs font-medium animate-fade-in flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-primary rounded-full" /> Passwords match ✓
            </p>
          )}
        </div>

        {/* Optional info note */}
        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          📧 After registering, we'll send a <strong className="text-gray-600">6-digit OTP</strong> to your email to verify your account.
        </p>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="btn-shimmer w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5
            hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-1">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending OTP…</>
            : <><UserPlus size={16} /> Create Account & Verify</>
          }
        </button>

        <p className="text-center text-sm text-gray-400 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}