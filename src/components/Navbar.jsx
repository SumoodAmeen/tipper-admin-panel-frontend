import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { adminLogout, updateProfilePhoto } from '../features/auth/authApi';
import { getMediaUrl } from '../config/api';
import calendar from '../assets/dashboard/calendar.png';
import bell from '../assets/dashboard/bell.png';

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const getFormattedDate = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    return `${date} (${day})`;
};

const Navbar = () => {
    const { user, logout: authLogout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [saving, setSaving] = useState(false);
    const [photoError, setPhotoError] = useState('');

    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    const displayName = user?.fullName || user?.username || 'Admin';
    const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' User' : 'Admin User';
    const initials = getInitials(displayName);
    const photoUrl = user?.photo ? getMediaUrl(user.photo) : null;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileSelect = (file) => {
        if (!file) return;
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setPhotoError('');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleSavePhoto = async () => {
        if (!selectedFile) return;
        setSaving(true);
        setPhotoError('');
        try {
            const data = await updateProfilePhoto(selectedFile);
            updateUser(data.data);
            closeModal();
        } catch (err) {
            setPhotoError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        setPhotoModalOpen(false);
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPhotoError('');
    };

    const handleLogout = async () => {
        setDropdownOpen(false);
        const refreshToken = localStorage.getItem('admin_refresh_token');
        try {
            if (refreshToken) await adminLogout(refreshToken);
        } catch {
            // Proceed with local logout even if API call fails
        }
        authLogout();
        navigate('/login', { replace: true });
    };

    return (
        <header className="h-[64px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 flex-shrink-0">

            {/* Date */}
            <div className="flex items-center gap-2 text-[#64748B]">
                <img src={calendar} alt="Calendar" className="w-[9.99px] h-[11.1px] object-contain" />
                <span className="text-[14px] text-[#64748B] font-medium">{getFormattedDate()}</span>
            </div>

            {/* Right — Bell + User */}
            <div className="flex items-center gap-5">

                {/* Notification bell */}
                <button className="relative p-1">
                    <img src={bell} alt="Bell" className="w-[15.55px] h-[19.44px] object-contain" />
                    <span className="absolute -top-0.5 -right-0.5 w-[15px] h-[15px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        3
                    </span>
                </button>

                {/* Divider */}
                <div className="w-px h-7 bg-[#E2E8F0]" />

                {/* User info + avatar + dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen((o) => !o)}
                        className="flex items-center gap-3 cursor-pointer"
                    >
                        <div className="text-right">
                            <p className="text-[14px] font-bold text-[#1C180C] leading-tight">{displayName}</p>
                            <p className="text-[12px] text-[#64748B] font-medium">{role}</p>
                        </div>
                        <div className="w-[38px] h-[38px] rounded-full bg-[#FDC63A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {photoUrl ? (
                                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[13px] font-bold text-[#0F172A]">{initials}</span>
                            )}
                        </div>
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-[200px] bg-white rounded-[10px] shadow-lg border border-[#E2E8F0] py-1.5 z-50">
                            <button
                                onClick={() => { setDropdownOpen(false); setPhotoModalOpen(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                Update Photo
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-red-500 hover:bg-[#F8FAFC] transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Photo Modal */}
            {photoModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-[16px] w-[90%] max-w-[440px] p-8 shadow-xl">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[18px] font-bold text-[#0F172A]">Update Profile Photo</h2>
                            <button onClick={closeModal} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Current / preview photo */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-[90px] h-[90px] rounded-full border-[3px] border-[#FDC63A] overflow-hidden flex items-center justify-center bg-[#FDC63A] mb-3">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                                ) : photoUrl ? (
                                    <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[22px] font-bold text-[#0F172A]">{initials}</span>
                                )}
                            </div>
                            <p className="text-[15px] font-semibold text-[#0F172A]">{displayName}</p>
                        </div>

                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-[10px] p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors mb-5 ${
                                isDragging ? 'border-[#FDC63A] bg-amber-50' : 'border-[#CBD5E1] hover:border-[#FDC63A] hover:bg-amber-50/30'
                            }`}
                        >
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FDC63A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 16 12 12 8 16" />
                                <line x1="12" y1="12" x2="12" y2="21" />
                                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                            </svg>
                            <p className="text-[13px] text-[#475569] font-medium">Click to upload or drag and drop</p>
                            <p className="text-[12px] text-[#94A3B8]">PNG, JPG or GIF (max. 800×800px)</p>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="mt-1 px-4 py-1.5 border border-[#CBD5E1] rounded-[6px] text-[13px] text-[#475569] hover:bg-slate-50 transition-colors"
                            >
                                Choose File
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/gif"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files[0])}
                            />
                        </div>

                        {photoError && <p className="text-red-500 text-[13px] mb-4 text-center">{photoError}</p>}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] font-semibold text-[#475569] hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePhoto}
                                disabled={!selectedFile || saving}
                                className="flex-1 py-2.5 bg-[#FDC63A] rounded-[8px] text-[14px] font-bold text-[#0F172A] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
