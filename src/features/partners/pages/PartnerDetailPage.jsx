import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPartnerById, fetchPartnerMaterials, fetchPartnerOverview, notifyPartner, blockPartner, activatePartner, fetchPartnerOrders, requestVerificationSelfie, trackPartner, approveDriverVerification, rejectDriverVerification } from '../partnerApi';
import { getMediaUrl } from '../../../config/api';
import OrderDetailModal from '../../orders/components/OrderDetailModal';
import notificationIcon from '../../../assets/partner/notification.png';
import blockIcon from '../../../assets/partner/block.png';

const PARTNER_STATUS_CONFIG = {
    Active: { label: 'ACTIVE', bg: 'bg-green-100', text: 'text-green-700' },
    Pending: { label: 'PENDING', bg: 'bg-purple-100', text: 'text-purple-700' },
    Blocked: { label: 'BLOCKED', bg: 'bg-red-100', text: 'text-red-600' },
    Inactive: { label: 'INACTIVE', bg: 'bg-slate-100', text: 'text-slate-500' },
};

const ORDER_STATUS_CONFIG = {
    requested: { label: 'Order Received', bg: 'bg-amber-50', text: 'text-amber-600' },
    bidding: { label: 'Bidding', bg: 'bg-orange-50', text: 'text-orange-500' },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-600' },
    assigned: { label: 'Assigned', bg: 'bg-sky-50', text: 'text-sky-600' },
    out_for_delivery: { label: 'In Transit', bg: 'bg-sky-50', text: 'text-sky-600' },
    delivered: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-600' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
};

const ORDER_TABLE_COLS = ['ORDER ID', 'PARTNER', 'MATERIAL', 'QUANTITY', 'AMOUNT', 'STATUS', 'ACTION'];
const ORDERS_LIMIT = 9;

const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')} - ${String(d.getMonth() + 1).padStart(2, '0')} - ${d.getFullYear()}`;
};

const formatPhone = (phone) => {
    if (!phone) return '--';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return phone;
};

const maskAadhaar = (num) => {
    if (!num) return '--';
    const str = String(num).replace(/\D/g, '');
    if (str.length < 4) return str;
    return `XXXX-XXXX-${str.slice(-4)}`;
};

const getFileExt = (path) => {
    if (!path) return 'FILE';
    return path.split('.').pop().toUpperCase();
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const getOrderQuantity = (order) => {
    if (order.quantity) return String(order.quantity);
    return '--';
};

const fmtAmount = (amount) =>
    `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InfoRow = ({ label, value }) => (
    <div>
        <p className="text-[11px] text-[#94A3B8] mb-0.5">{label}</p>
        <p className="text-[14px] font-semibold text-[#0F172A]">{value || '--'}</p>
    </div>
);

const DocumentRow = ({ label, path }) => {
    if (!path) return null;
    const ext = getFileExt(path);
    const isPdf = ext === 'PDF';
    return (
        <div className="flex items-center justify-between py-3 border-b border-[#F8FAFC] last:border-0">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center ${isPdf ? 'bg-red-50' : 'bg-blue-50'}`}>
                    {isPdf ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    )}
                </div>
                <div>
                    <p className="text-[13px] font-semibold text-[#0F172A]">{label}</p>
                    <p className="text-[11px] text-[#94A3B8]">{ext}</p>
                </div>
            </div>
            <a
                href={getMediaUrl(path)}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </a>
        </div>
    );
};

const PartnerDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [partner, setPartner] = useState(null);
    const [overview, setOverview] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifying, setNotifying] = useState(false);
    const [notifyError, setNotifyError] = useState('');
    const [notifySuccess, setNotifySuccess] = useState(false);

    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [blockError, setBlockError] = useState('');
    const [blockReason, setBlockReason] = useState('');

    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [activating, setActivating] = useState(false);
    const [activateError, setActivateError] = useState('');

    const [requestingVerification, setRequestingVerification] = useState(false);
    const [verificationRequested, setVerificationRequested] = useState(false);

    const [tracking, setTracking] = useState(false);
    const [verificationError, setVerificationError] = useState('');

    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [data, overviewData, mats] = await Promise.all([
                    fetchPartnerById(id),
                    fetchPartnerOverview(id),
                    fetchPartnerMaterials(id),
                ]);
                setPartner(data);
                setOverview(overviewData);
                setMaterials(mats ?? []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setOrdersLoading(true);
        fetchPartnerOrders(id, { page, limit: ORDERS_LIMIT, search, status: orderStatus, from, to })
            .then((data) => {
                setOrders(data.orders);
                setPagination(data.pagination);
            })
            .catch(() => {})
            .finally(() => setOrdersLoading(false));
    }, [id, page, search, orderStatus, from, to]);

    const handleNotify = async () => {
        setNotifying(true);
        setNotifyError('');
        setNotifySuccess(false);
        try {
            await notifyPartner(id, { title: notifyTitle, message: notifyMessage });
            setNotifySuccess(true);
            setNotifyTitle('');
            setNotifyMessage('');
        } catch (err) {
            setNotifyError(err.message);
        } finally {
            setNotifying(false);
        }
    };

    const handleBlock = async () => {
        setBlocking(true);
        setBlockError('');
        try {
            await blockPartner(id, blockReason);
            setPartner((prev) => ({ ...prev, status: 'Blocked' }));
            setShowBlockConfirm(false);
            setBlockReason('');
        } catch (err) {
            setBlockError(err.message);
        } finally {
            setBlocking(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        setActivateError('');
        try {
            await activatePartner(id);
            setPartner((prev) => ({ ...prev, status: 'Active' }));
            setShowActivateConfirm(false);
        } catch (err) {
            setActivateError(err.message);
        } finally {
            setActivating(false);
        }
    };

    const handleRequestVerification = async () => {
        setRequestingVerification(true);
        setVerificationError('');
        try {
            await requestVerificationSelfie(id);
            setVerificationRequested(true);
        } catch (err) {
            setVerificationError(err.message);
        } finally {
            setRequestingVerification(false);
        }
    };

    const closeNotifyModal = () => {
        setShowNotifyModal(false);
        setNotifyTitle('');
        setNotifyMessage('');
        setNotifyError('');
        setNotifySuccess(false);
    };

    const { totalCount, totalPages, currentPage } = pagination;
    const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * ORDERS_LIMIT + 1;
    const showingTo = Math.min(currentPage * ORDERS_LIMIT, totalCount);

    const renderPageButtons = () => {
        const maxVisible = 3;
        let start = Math.max(1, currentPage - 1);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >‹</button>
                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-[14px] font-semibold transition-colors ${
                            p === currentPage
                                ? 'bg-[#FDC63A] text-[#0F172A]'
                                : 'border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                        }`}
                    >{p}</button>
                ))}
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >›</button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-white rounded-[12px] animate-pulse shadow-sm" />
                ))}
            </div>
        );
    }

    if (error || !partner) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 text-sm">{error || 'Partner not found'}</p>
                <button
                    onClick={() => navigate('/partner-management')}
                    className="mt-4 text-[14px] text-[#FDC63A] font-semibold hover:underline"
                >
                    ← Back to Partner Management
                </button>
            </div>
        );
    }

    const statusCfg = PARTNER_STATUS_CONFIG[partner.status] || {
        label: partner.status?.toUpperCase() ?? 'UNKNOWN',
        bg: 'bg-slate-100',
        text: 'text-slate-500',
    };
    const isBlocked = partner.status === 'Blocked';
    const isPending = partner.status === 'Pending';
    const photoUrl = partner.photo ? getMediaUrl(partner.photo) : null;

    const docs = [
        { label: 'Aadhaar Front', path: partner.documents?.aadharFront },
        { label: 'Aadhaar Back', path: partner.documents?.aadharBack },
        { label: 'Driving License Front', path: partner.documents?.drivingLicenseFront },
        { label: 'Driving License Back', path: partner.documents?.drivingLicenseBack },
        { label: 'Registration Certificate (RC)', path: partner.documents?.vehicleRC },
        { label: 'Purchase Bill', path: partner.documents?.materialPurchaseBill },
    ].filter((d) => d.path);

    return (
        <div>
            {/* Back navigation */}
            <button
                onClick={() => navigate('/partner-management')}
                className="flex items-center gap-1.5 text-[13px] text-[#64748B] font-medium hover:text-[#0F172A] transition-colors mb-5"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Partner Management
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-[12px] shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-[96px] h-[96px] rounded-full overflow-hidden bg-[#FDC63A] flex items-center justify-center flex-shrink-0">
                            {photoUrl ? (
                                <img src={photoUrl} alt={partner.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[22px] font-bold text-[#0F172A]">{getInitials(partner.name)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <h1 className="text-[30px] font-bold text-[#0F172A]">{partner.name}</h1>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusCfg.bg} ${statusCfg.text}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="3" y1="15" x2="21" y2="15" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <line x1="15" y1="3" x2="15" y2="21" />
                                </svg>
                                <p className="text-[16px] text-[#64748B]">Partner ID: {partner.uniqueId}</p>
                            </div>
                            <p className="text-[16px] text-[#64748B]">Last verified : {formatDate(partner.updatedAt)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isPending ? (
                            <>
                                <button
                                    disabled={approving}
                                    onClick={async () => {
                                        setApproving(true);
                                        try {
                                            await approveDriverVerification(id);
                                            setPartner((p) => ({ ...p, status: 'Active' }));
                                        } catch (err) {
                                            alert(err.message || 'Failed to approve partner');
                                        } finally {
                                            setApproving(false);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-[8px] text-[14px] font-semibold text-white hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {approving ? 'Approving...' : 'Approve Partner'}
                                </button>
                                <button
                                    disabled={rejecting}
                                    onClick={async () => {
                                        if (!window.confirm('Are you sure you want to reject this partner?')) return;
                                        setRejecting(true);
                                        try {
                                            await rejectDriverVerification(id);
                                            setPartner((p) => ({ ...p, status: 'Blocked' }));
                                        } catch (err) {
                                            alert(err.message || 'Failed to reject partner');
                                        } finally {
                                            setRejecting(false);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-[#FF5C5C] rounded-[8px] text-[14px] font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    {rejecting ? 'Rejecting...' : 'Reject Partner'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowNotifyModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 border border-[#FDC63A] rounded-[8px] text-[14px] font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <img src={notificationIcon} alt="notification" width="15" height="14" />
                                    Personalized Notification
                                </button>
                                {isBlocked ? (
                                    <button
                                        onClick={() => setShowActivateConfirm(true)}
                                        className="flex items-center gap-2 px-4 py-2 border border-green-200 rounded-[8px] text-[13px] font-semibold text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Activate Partner
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowBlockConfirm(true)}
                                        className="flex items-center gap-2 px-4 py-2 border border-[#FF5C5C] rounded-[8px] text-[13px] font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <img src={blockIcon} alt="block" width="15" height="15" />
                                        Block Partner
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: 'Total Amount Earned',
                        value: overview
                            ? `₹${Number(overview.stats.totalAmountEarned).toLocaleString('en-IN')}`
                            : null,
                    },
                    {
                        label: 'Daily Average Earnings',
                        value: overview
                            ? `₹${Number(overview.stats.dailyAverageEarnings).toLocaleString('en-IN')}`
                            : null,
                    },
                    {
                        label: 'Completed Deliveries',
                        value: overview ? overview.stats.completedDeliveries : null,
                        suffix: 'Orders',
                    },
                    {
                        label: 'Partner Rating',
                        value: overview
                            ? overview.stats.averageRating != null
                                ? Number(overview.stats.averageRating).toFixed(1)
                                : '--'
                            : null,
                        isRating: true,
                        ratingValue: overview?.stats?.averageRating,
                    },
                ].map(({ label, value, suffix, isRating, ratingValue }) => (
                    <div key={label} className="bg-white rounded-[12px] h-[110px] shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[14px] font-medium text-[#64748B]">{label}</p>
                        </div>
                        {value === null ? (
                            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <p className="text-[24px] font-bold text-[#0F172A]">{value}</p>
                                {suffix && <span className="text-[13px] text-[#64748B] font-medium">{suffix}</span>}
                                {isRating && ratingValue != null && (
                                    <div className="flex items-center gap-0.5 ml-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                                                fill={i < Math.round(ratingValue) ? '#F59E0B' : 'none'}
                                                stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Left column */}
                <div className="col-span-2 space-y-6">
                    {/* Partner Information */}
                    <div className="bg-white rounded-[12px] shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-7 h-7 rounded-[6px] bg-amber-50 flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <h2 className="text-[18px] font-bold text-[#0F172A]">Partner Information</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            {/* Personal Details */}
                            <div>
                                <p className="text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase mb-4">Personal Details</p>
                                <div className="space-y-4">
                                    <InfoRow label="Full Name" value={partner.name} />
                                    <InfoRow
                                        label="Partner Type"
                                        value={partner.partnerType
                                            ? partner.partnerType.charAt(0).toUpperCase() + partner.partnerType.slice(1)
                                            : '--'}
                                    />
                                    <InfoRow label="Mobile Number" value={formatPhone(partner.phone)} />
                                    <InfoRow label="Masked Aadhaar" value={maskAadhaar(partner.aadharNumber)} />
                                </div>
                            </div>
                            {/* Vehicle & Documentation */}
                            <div>
                                <p className="text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase mb-4">Vehicle & Documentation</p>
                                <div className="space-y-4">
                                    <InfoRow label="Driving Licence Number" value={partner.drivingLicenseNumber} />
                                    <InfoRow label="Vehicle Number" value={partner.vehicle?.registrationNumber} />
                                    <InfoRow
                                        label="Vehicle Capacity"
                                        value={partner.vehicle?.vehicleType?.maxCapacity
                                            ? `${partner.vehicle.vehicleType.maxCapacity} Feets`
                                            : '--'}
                                    />
                                    <InfoRow label="Vehicle Model" value={partner.vehicle?.model} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Materials Catalog */}
                    {materials.length > 0 && (
                        <div className="bg-white rounded-[12px] shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-7 h-7 rounded-[6px] bg-amber-50 flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    </svg>
                                </div>
                                <h2 className="text-[16px] font-bold text-[#0F172A]">Materials Catalog</h2>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {materials.map((mat) => {
                                    const name = mat.name || mat.materialName || 'Material';
                                    const category = mat.category?.name || mat.categoryName || '';
                                    const imgUrl = mat.image?.startsWith('http') ? mat.image : mat.image ? getMediaUrl(mat.image) : null;
                                    return (
                                        <div key={mat._id} className="rounded-[10px] overflow-hidden border border-[#F1F5F9]">
                                            <div className="h-[100px] bg-slate-100">
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100" />
                                                )}
                                            </div>
                                            <div className="p-2.5">
                                                {category && (
                                                    <span className="text-[10px] font-bold text-amber-600 uppercase">{category}</span>
                                                )}
                                                <p className="text-[13px] font-semibold text-[#0F172A] mt-0.5">{name}</p>
                                                
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="col-span-1 space-y-4">
                    <button
                        onClick={handleRequestVerification}
                        disabled={requestingVerification || verificationRequested}
                        className={`w-full py-3 border rounded-[10px] text-[14px] font-bold transition-colors ${
                            verificationRequested
                                ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                                : requestingVerification
                                ? 'bg-[#FDC63A4D] border-[#FDC63A] text-[#0F172A] opacity-60 cursor-not-allowed'
                                : 'bg-[#FDC63A4D] border-[#FDC63A] text-[#0F172A] hover:bg-amber-100 cursor-pointer'
                        }`}
                    >
                        {verificationRequested
                            ? 'Verification Requested'
                            : requestingVerification
                            ? 'Requesting...'
                            : 'Request Verification Selfie'}
                    </button>
                    {verificationError && (
                        <p className="text-red-500 text-[12px] -mt-2">{verificationError}</p>
                    )}
                    <button
                        disabled={tracking}
                        onClick={async () => {
                            setTracking(true);
                            try {
                                const data = await trackPartner(id);
                                window.open(`https://www.google.com/maps?q=${data.latitude},${data.longitude}`, '_blank');
                            } catch {
                                alert('Unable to fetch partner location. The partner may be offline.');
                            } finally {
                                setTracking(false);
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#FDC63A] hover:bg-[#fabd25] rounded-[10px] text-[14px] font-bold text-[#0F172A] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        {tracking ? 'Locating...' : 'Track Driver Location'}
                    </button>

                    {/* Documents */}
                    {docs.length > 0 && (
                        <div className="bg-white rounded-[12px] shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-[5px] bg-amber-50 flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </div>
                                <h3 className="text-[18px] font-bold text-[#0F172A]">Documents</h3>
                            </div>
                            {docs.map((doc) => (
                                <DocumentRow key={doc.label} label={doc.label} path={doc.path} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#F1F5F9]">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">Customer Order History</h2>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 flex items-center gap-4 border-b border-[#F8FAFC]">
                    <div className="relative flex-1 max-w-[360px]">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by Order ID, Material, or Amount...."
                            className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                            className="pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                        />
                    </div>

                    <span className="text-[#94A3B8] font-medium">–</span>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => { setTo(e.target.value); setPage(1); }}
                            className="pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={orderStatus}
                            onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }}
                            className="appearance-none pl-4 pr-9 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white min-w-[100px] cursor-pointer"
                        >
                            <option value="">All</option>
                            <option value="requested">Order Received</option>
                            <option value="bidding">Bidding</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="assigned">Assigned</option>
                            <option value="out_for_delivery">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#F1F5F9]">
                                {ORDER_TABLE_COLS.map((col) => (
                                    <th key={col} className="px-6 py-3 text-left text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ordersLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#F8FAFC]">
                                        {ORDER_TABLE_COLS.map((col) => (
                                            <td key={col} className="px-6 py-4">
                                                <span className="inline-block w-24 h-4 bg-slate-100 animate-pulse rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[#94A3B8] text-sm">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const orderStatusCfg = ORDER_STATUS_CONFIG[order.status] || {
                                        label: order.status,
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-500',
                                    };
                                    return (
                                        <tr key={order._id} className="border-b border-[#F8FAFC] hover:bg-[#FAFAFA] transition-colors">
                                            <td className="px-6 py-4 text-[14px] font-bold text-[#0F172A]">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569] capitalize">
                                                {order.partnerType || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {order.material?.materialName || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {getOrderQuantity(order)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] font-semibold text-[#0F172A]">
                                                {order.amount ? fmtAmount(order.amount) : '--'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${orderStatusCfg.bg} ${orderStatusCfg.text}`}>
                                                    {orderStatusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedOrderId(order._id)}
                                                    className="px-4 py-1.5 bg-[#FDC63A] text-[#0F172A] text-[12px] font-bold rounded-[6px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!ordersLoading && orders.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-[#F1F5F9]">
                        <p className="text-[14px] text-[#64748B]">
                            Showing {showingFrom} to {showingTo} of {totalCount} orders
                        </p>
                        {renderPageButtons()}
                    </div>
                )}
            </div>

            {/* Notification Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[460px] shadow-xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[18px] font-bold text-[#0F172A]">Personalized Notification</h3>
                            <button onClick={closeNotifyModal} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        {notifySuccess ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <p className="text-[15px] font-semibold text-[#0F172A]">Notification Sent!</p>
                                <button
                                    onClick={closeNotifyModal}
                                    className="mt-4 px-5 py-2 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24]"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Title</label>
                                        <input
                                            type="text"
                                            value={notifyTitle}
                                            onChange={(e) => setNotifyTitle(e.target.value)}
                                            placeholder="Notification title..."
                                            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Message</label>
                                        <textarea
                                            value={notifyMessage}
                                            onChange={(e) => setNotifyMessage(e.target.value)}
                                            placeholder="Write your message here..."
                                            rows={4}
                                            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] resize-none"
                                        />
                                    </div>
                                </div>
                                {notifyError && <p className="text-red-500 text-[13px] mt-3">{notifyError}</p>}
                                <div className="flex items-center justify-end gap-3 mt-5">
                                    <button
                                        onClick={closeNotifyModal}
                                        className="px-5 py-2 text-[14px] font-semibold text-[#475569] border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleNotify}
                                        disabled={notifying || !notifyTitle.trim() || !notifyMessage.trim()}
                                        className="px-5 py-2 text-[14px] font-bold text-[#0F172A] bg-[#FDC63A] rounded-[8px] hover:bg-[#fbbf24] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {notifying ? 'Sending...' : 'Send Notification'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Activate Confirmation */}
            {showActivateConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[400px] shadow-xl p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] text-center mb-2">Activate Partner</h3>
                        <p className="text-[13px] text-[#64748B] text-center mb-5">
                            Are you sure you want to activate <strong>{partner.name}</strong>? They will be able to accept new orders.
                        </p>
                        {activateError && <p className="text-red-500 text-[13px] mb-3 text-center">{activateError}</p>}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setShowActivateConfirm(false)}
                                disabled={activating}
                                className="px-5 py-2 text-[14px] font-semibold text-[#475569] border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleActivate}
                                disabled={activating}
                                className="px-5 py-2 text-[14px] font-bold text-white bg-green-500 rounded-[8px] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {activating ? 'Activating...' : 'Activate Partner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Block Confirmation */}
            {showBlockConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[400px] shadow-xl p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] text-center mb-2">Block Partner</h3>
                        <p className="text-[13px] text-[#64748B] text-center mb-4">
                            Are you sure you want to block <strong>{partner.name}</strong>? They will not be able to accept new orders.
                        </p>
                        <div>
                            <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Reason for blocking</label>
                            <textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="Enter reason for blocking this partner..."
                                rows={3}
                                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
                            />
                        </div>
                        {blockError && <p className="text-red-500 text-[13px] mt-3 text-center">{blockError}</p>}
                        <div className="flex items-center justify-center gap-3 mt-5">
                            <button
                                onClick={() => { setShowBlockConfirm(false); setBlockReason(''); setBlockError(''); }}
                                disabled={blocking}
                                className="px-5 py-2 text-[14px] font-semibold text-[#475569] border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBlock}
                                disabled={blocking || !blockReason.trim()}
                                className="px-5 py-2 text-[14px] font-bold text-white bg-red-500 rounded-[8px] hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {blocking ? 'Blocking...' : 'Block Partner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrderId && (
                <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
            )}
        </div>
    );
};

export default PartnerDetailPage;
