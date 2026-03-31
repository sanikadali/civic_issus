import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Mail, Lock, LogIn, Star } from 'lucide-react';

/* ── tiny helpers ─────────────────────────────────────── */
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

export default function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [starSpin, setStarSpin] = useState(false);

  /* real-time validation on blur / change */
  const validate = (name, value) => {
    let msg = '';
    if (name === 'email') {
      if (!value.trim()) msg = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(value)) msg = 'Enter a valid email address';
    }
    if (name === 'password' && !value) msg = 'Password is required';
    return msg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const newErrors = {};
    Object.keys(form).forEach(k => {
      const msg = validate(k, form[k]);
      if (msg) newErrors[k] = msg;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      // scroll to first error
      document.querySelector('.border-red-400')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/auth/login', form);
      localStorage.setItem('user', JSON.stringify(res.data));
      res.data.role === 'admin' ? navigate('/admin') : navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl mb-4 shadow-lg shadow-primary/10">
          <LogIn size={24} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Welcome back</h2>
        <p className="text-gray-400 text-sm mt-1">Sign in to your CleanStreet account</p>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 animate-shake animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1.5">
            Email <Req />
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email" name="email" autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputCls(errors.email, form.email)} pl-10`}
            />
          </div>
          <FieldError msg={errors.email} />
        </div>

        {/* Password */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-1.5">
            Password <Req />
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPw ? 'text' : 'password'} name="password" autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputCls(errors.password, form.password)} pl-10`}
            />
            <button type="button" onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FieldError msg={errors.password} />
          <div className="flex justify-end mt-1.5">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          onMouseEnter={() => setStarSpin(true)}
          onMouseLeave={() => setStarSpin(false)}
          className="btn-shimmer w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5
            hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-1">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
            : <><Star size={16} className={starSpin ? 'animate-spin-once' : ''} /> Sign In</>
          }
        </button>

        <p className="text-center text-sm text-gray-400 pt-1">
          No account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </form>
    </div>
  );
}
