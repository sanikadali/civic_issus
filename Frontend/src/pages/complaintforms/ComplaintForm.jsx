import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { FileText, AlertCircle, Flag, MapPin, Landmark, AlignLeft, Image, Send, CheckCircle2 } from 'lucide-react';

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

function inputCls(err, valid) {
    const base = 'w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm outline-none transition-all duration-300 ';
    if (err) return base + 'border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400';
    if (valid) return base + 'border-primary/60 focus:ring-2 focus:ring-primary/40 focus:border-primary/60';
    return base + 'border-gray-200 focus:ring-2 focus:ring-primary/40 focus:border-transparent';
}

function iconInputCls(err, valid) {
    return `${inputCls(err, valid)} pl-9`;
}

const REQUIRED_FIELDS = ['title', 'issueType', 'priority', 'address', 'description'];

const ComplaintForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '', issueType: '', priority: '', address: '', landmark: '',
        description: '', location: null, photo: '',
    });
    const [errors, setErrors] = useState({});
    const [position, setPosition] = useState(null);
    const [user, setUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);
        else { alert('Please login to report an issue.'); navigate('/login'); }
    }, [navigate]);

    function LocationHandler() {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());

      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );

        const address = res.data.display_name;

        setFormData(prev => ({
          ...prev,
          address: address,
          location: { lat, lng }
        }));
        setErrors(prev => ({
  ...prev,
  address: ''
}));
      } catch (err) {
        console.error(err);
      }
    }
  });

  return position ? <Marker position={position} /> : null;
}

    const validateField = (name, value) => {
        if (!REQUIRED_FIELDS.includes(name)) return '';
        if (!value || !String(value).trim()) {
            const labels = {
                title: 'Issue Title', issueType: 'Issue Type', priority: 'Priority Level',
                address: 'Address', description: 'Description',
            };
            return `${labels[name]} is required`;
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        if (REQUIRED_FIELDS.includes(name))
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        REQUIRED_FIELDS.forEach(k => {
            const msg = validateField(k, formData[k]);
            if (msg) newErrors[k] = msg;
        });
        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            const el = document.querySelector('.border-red-400');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSubmitting(true);
        try {
            await axios.post('http://localhost:8000/api/complaints', formData, user?.token
        ? { headers: { Authorization: `Bearer ${user.token}` } }
        : {}
    );
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1800);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit complaint');
        } finally { setSubmitting(false); }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center animate-bounce-in max-w-sm w-full">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-5">
                            <CheckCircle2 size={32} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Report Submitted!</h2>
                        <p className="text-gray-500 text-sm">Redirecting to your dashboard…</p>
                    </div>
                </div>
            </div>
        );
    }

    const isValid = (name) => REQUIRED_FIELDS.includes(name) && formData[name] && !errors[name];
    const hasError = (name) => !!errors[name];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-6 py-10">
                <div className="max-w-4xl mx-auto">

                    {/* Page Header */}
                    <div className="text-center mb-8 animate-slide-up">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-hover rounded-2xl mb-4 shadow-lg shadow-primary/10">
                            <AlertCircle size={26} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Report a Civic Issue</h1>
                        <p className="text-gray-500 mt-2">Help your community by reporting problems you see around you</p>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-center gap-1">
                            <span className="text-red-500 font-bold">*</span> indicates required fields
                        </p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl shadow-md p-8 animate-slide-up">
                        {/* Section header */}
                        <div className="flex items-center gap-3 mb-7 pb-6 border-b border-gray-100">
                            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                                <FileText size={17} className="text-violet-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800">Issue Details</h2>
                                <p className="text-gray-400 text-sm">Fill in the details about the issue you observed</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="space-y-6">

                            {/* Row 1: Title + Issue Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Issue Title — REQUIRED */}
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                        Issue Title <Req />
                                    </label>
                                    <div className="relative">
                                        <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" name="title"
                                            placeholder="Brief description of the issue"
                                            value={formData.title}
                                            onChange={handleChange} onBlur={handleBlur}
                                            className={iconInputCls(hasError('title'), isValid('title'))}
                                        />
                                    </div>
                                    <FieldError msg={errors.title} />
                                </div>

                                {/* Issue Type (Category) — REQUIRED */}
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                        Category <Req />
                                    </label>
                                    <div className="relative">
                                        <AlertCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select name="issueType"
                                            value={formData.issueType}
                                            onChange={handleChange} onBlur={handleBlur}
                                            className={iconInputCls(hasError('issueType'), isValid('issueType'))}>
                                            <option value="">Select category</option>
                                            <option value="garbage">🗑️ Garbage</option>
                                            <option value="pothole">🕳️ Pothole</option>
                                            <option value="street_light">💡 Street Light</option>
                                            <option value="water_leakage">💧 Water Leakage</option>
                                            <option value="other">📢 Other</option>
                                        </select>
                                    </div>
                                    <FieldError msg={errors.issueType} />
                                </div>

                                {/* Priority — REQUIRED */}                               
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                        Priority Level <Req />
                                    </label>
                                    <div className="relative">
                                        <Flag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select name="priority"
                                            value={formData.priority}
                                            onChange={handleChange} onBlur={handleBlur}
                                            className={iconInputCls(hasError('priority'), isValid('priority'))}>
                                            <option value="">Select priority</option>
                                            <option value="low">🟢 Low</option>
                                            <option value="medium">🟡 Medium</option>
                                            <option value="high">🟠 High</option>
                                            <option value="critical">🔴 Critical</option>
                                        </select>
                                    </div>
                                    <FieldError msg={errors.priority} />
                                </div>

                                {/* Address — REQUIRED */}
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                        Street Address <Req />
                                    </label>
                                    <div className="relative">
                                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" name="address"
                                            placeholder="Enter street address"
                                            value={formData.address}
                                            onChange={handleChange} onBlur={handleBlur}
                                            className={iconInputCls(hasError('address'), isValid('address'))}
                                        />
                                    </div>
                                    <FieldError msg={errors.address} />
                                </div>
                            </div>

                            {/* Nearby Landmark — OPTIONAL */}
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                    Nearby Landmark
                                    <span className="text-gray-400 font-normal text-xs ml-1.5">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <Landmark size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" name="landmark"
                                        placeholder="e.g., Near City Hall"
                                        value={formData.landmark} onChange={handleChange}
                                        className={`${inputCls(false, false)} pl-9`}
                                    />
                                </div>
                            </div>

                            {/* Description — REQUIRED */}
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                    Description <Req />
                                </label>
                                <div className="relative">
                                    <AlignLeft size={15} className="absolute left-3 top-3.5 text-gray-400" />
                                    <textarea name="description" rows="4"
                                        placeholder="Describe the issue in detail…"
                                        value={formData.description}
                                        onChange={handleChange} onBlur={handleBlur}
                                        className={`${hasError('description')
                                            ? 'w-full bg-gray-50 border border-red-400 rounded-xl px-4 py-3 pl-9 text-gray-800 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-red-300 transition-all duration-300'
                                            : isValid('description')
                                                ? 'w-full bg-gray-50 border border-primary/60 rounded-xl px-4 py-3 pl-9 text-gray-800 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300'
                                                : 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-9 text-gray-800 placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all duration-300'
                                            }`}
                                    />
                                </div>
                                <FieldError msg={errors.description} />
                            </div>

                            {/* Upload Photo — OPTIONAL */}
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                    Upload Photo
                                    <span className="text-gray-400 font-normal text-xs ml-1.5">(Optional)</span>
                                </label>
                                <label className="flex flex-col items-center justify-center w-full h-28 bg-gray-50 border-2 border-dashed border-gray-200 hover:border-primary/40 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all">
                                    <Image size={24} className="text-gray-300 mb-2" />
                                    <p className="text-gray-400 text-sm">Click to upload a photo</p>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                                {formData.photo && (
                                    <img src={formData.photo} alt="Preview"
                                        className="mt-3 h-32 w-auto object-cover rounded-xl border border-gray-200" />
                                )}
                            </div>

                            {/* Location Map */}
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-1.5">
                                    Pin Location on Map
                                    <span className="text-gray-400 font-normal text-xs ml-1.5">(Optional)</span>
                                </label>
                                <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200 relative z-0">
                                    <MapContainer center={[19.053032, 72.870598]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                    
                                        <LocationHandler/>
                                    </MapContainer>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <MapPin size={11} /> Click on the map to mark the exact location
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-center pt-2">
                                <button type="submit" disabled={submitting}
                                    className="btn-shimmer w-full md:w-auto text-white font-bold py-4 px-12 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5
                    hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {submitting
                                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                                        : <><Send size={17} /> Submit Issue</>
                                    }
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintForm;
