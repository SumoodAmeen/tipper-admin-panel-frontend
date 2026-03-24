import { useEffect, useState } from 'react';
import { fetchOrderById, cancelOrder } from '../orderApi';
import { fetchPartnerById } from '../../partners/partnerApi';
import { getMediaUrl } from '../../../config/api';

const STATUS_CONFIG = {
    requested: { label: 'Requested', bg: 'bg-slate-100', text: 'text-slate-600' },
    bidding: { label: 'Order Received', bg: 'bg-amber-50', text: 'text-amber-600' },
    assigned: { label: 'Assigned', bg: 'bg-purple-50', text: 'text-purple-600' },
    confirmed: { label: 'In Transit', bg: 'bg-blue-50', text: 'text-blue-600' },
    delivered: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-600' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
};

const fmt = (amount) =>
    `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const formatPhone = (phone) => {
    if (!phone) return '--';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return phone;
};

const formatAddress = (loc) => {
    if (!loc) return '--';
    return [loc.address, loc.streetOrLandmark, loc.city, loc.pincode].filter(Boolean).join(', ');
};

const formatQuantity = (order) => {
    if (order.quantity) return String(order.quantity);
    return '--';
};

const Avatar = ({ photoUrl, name, size = 'md' }) => {
    const dim = size === 'lg' ? 'w-[56px] h-[56px]' : 'w-[44px] h-[44px]';
    const textSize = size === 'lg' ? 'text-[18px]' : 'text-[14px]';
    return (
        <div className={`${dim} rounded-full bg-[#FDC63A] flex items-center justify-center flex-shrink-0 overflow-hidden`}>
            {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span className={`${textSize} font-bold text-[#0F172A]`}>{getInitials(name)}</span>
            )}
        </div>
    );
};

const OrderDetailModal = ({ orderId, onClose }) => {
    const [order, setOrder] = useState(null);
    const [partner, setPartner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchOrderById(orderId);
                setOrder(data.order);
                if (data.order.assignedPartner?.partnerId) {
                    try {
                        const partnerData = await fetchPartnerById(data.order.assignedPartner.partnerId);
                        setPartner(partnerData);
                    } catch {
                        // Partner fetch failed silently — section will be hidden
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId]);

    const handleCancel = async () => {
        setCancelling(true);
        setCancelError('');
        try {
            await cancelOrder(orderId, cancelReason);
            setOrder((prev) => ({ ...prev, status: 'cancelled' }));
            setShowCancelDialog(false);
            setCancelReason('');
        } catch (err) {
            setCancelError(err.message);
        } finally {
            setCancelling(false);
        }
    };

    const canCancel = order && !['cancelled', 'delivered', 'rejected'].includes(order.status);

    const statusCfg = order
        ? STATUS_CONFIG[order.status] ?? { label: order.status, bg: 'bg-slate-100', text: 'text-slate-600' }
        : null;

    const { lat, lng } = order?.deliveryLocation?.coordinates ?? {};
    const hasCoords = lat && lng;

    const totalAmount = order?.finalAmount > 0 ? order.finalAmount : order?.estimatedAmount;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[16px] w-[90%] max-w-[620px] shadow-xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[6px] bg-amber-50 flex items-center justify-center">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="15" height="13" rx="1" />
                                <path d="M16 8h4l3 5v3h-7V8z" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                        </div>
                        <span className="text-[16px] font-bold text-[#0F172A]">
                            Order Details #{order?.orderNumber ?? '...'}
                        </span>
                        {statusCfg && (
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusCfg.bg} ${statusCfg.text}`}>
                                {statusCfg.label}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-5 bg-slate-100 animate-pulse rounded w-full" />
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <p className="text-red-500 text-sm text-center py-8">{error}</p>
                    )}

                    {/* Content */}
                    {!loading && order && (
                        <>
                            {/* Material + Order Info */}
                            <div className="flex items-start gap-4">
                                {/* Material image */}
                                <div className="w-[80px] h-[80px] rounded-[10px] overflow-hidden flex-shrink-0 bg-slate-100">
                                    {order.material?.image ? (
                                        <img
                                            src={getMediaUrl(order.material.image)}
                                            alt={order.material.materialName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[18px] font-bold text-[#0F172A]">
                                                {order.material?.materialName ?? '--'}
                                            </p>
                                            <span className="inline-block mt-1 bg-amber-50 text-amber-600 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                                {order.material?.materialName ?? ''}
                                            </span>
                                        </div>
                                        {hasCoords && (
                                            <a
                                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#475569] hover:bg-slate-50 transition-colors flex-shrink-0"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                                </svg>
                                                Direction
                                            </a>
                                        )}
                                    </div>

                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-2 text-[13px]">
                                            <span className="text-[#94A3B8] w-[130px] flex-shrink-0">Ordered Quantity:</span>
                                            <span className="font-semibold text-[#0F172A]">
                                                {formatQuantity(order)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[13px]">
                                            <span className="text-[#94A3B8] w-[130px] flex-shrink-0">Delivery Time:</span>
                                            <span className="font-semibold text-[#0F172A]">{order.scheduledTime ?? '--'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[13px]">
                                            <span className="text-[#94A3B8] w-[130px] flex-shrink-0">Estimate Amount:</span>
                                            <span className="font-semibold text-amber-500">
                                                {order.material?.priceRange?.min && order.material?.unit
                                                    ? `₹${order.material.priceRange.min} / ${order.material.unit}`
                                                    : fmt(order.estimatedAmount)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[13px]">
                                            <span className="text-[#94A3B8] w-[130px] flex-shrink-0">Total Amount:</span>
                                            <span className="font-bold text-[#0F172A]">{fmt(totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Partner + Customer */}
                            <div className={`grid gap-5 ${partner ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Partner Details */}
                                {partner && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-3">Partner Details</p>
                                        <div className="flex items-start gap-3">
                                            <Avatar photoUrl={getMediaUrl(partner.photo)} name={partner.name} size="lg" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-[14px] font-bold text-[#0F172A]">{partner.name}</p>
                                                    {partner.averageRating > 0 && (
                                                        <span className="bg-amber-50 text-amber-600 text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                            {partner.averageRating.toFixed(1)} ★
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] text-[#64748B] mt-0.5">
                                                    {partner.partnerType
                                                        ? partner.partnerType.charAt(0).toUpperCase() + partner.partnerType.slice(1)
                                                        : '--'}
                                                    {' | Partner ID: '}{partner.uniqueId ?? '--'}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.19a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                    </svg>
                                                    <span className="text-[12px] text-[#475569]">{formatPhone(partner.phone)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Customer Details */}
                                <div>
                                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-3">Customer Details</p>
                                    <div className="flex items-start gap-3">
                                        <Avatar
                                            photoUrl={order.userId?.profileImage ? getMediaUrl(order.userId.profileImage) : null}
                                            name={order.userId?.fullName ?? order.userId?.email ?? 'User'}
                                            size="lg"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-[#0F172A]">
                                                {order.userId?.fullName ?? '--'}
                                            </p>
                                            {order.userId?.customerType && (
                                                <p className="text-[12px] text-[#64748B] mt-0.5">
                                                    {order.userId.customerType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                    {order.userId?._id && ` | ID: #${order.userId._id.slice(-8).toUpperCase()}`}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                                <span className="text-[12px] text-[#475569] break-all">{order.userId?.email ?? '--'}</span>
                                            </div>
                                            <div className="flex items-start gap-1.5 mt-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                                                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                                <span className="text-[12px] text-[#475569] leading-snug">
                                                    {formatAddress(order.deliveryLocation)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div>
                                <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-3">Payment Summary</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-[#64748B]">Estimated Amount</span>
                                        <span className="font-semibold text-[#475569]">{fmt(order.estimatedAmount)}</span>
                                    </div>
                                    {order.finalAmount > 0 && (
                                        <div className="flex items-center justify-between text-[13px]">
                                            <span className="text-[#64748B]">Final Amount</span>
                                            <span className="font-semibold text-[#475569]">{fmt(order.finalAmount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-[#F1F5F9] pt-2 mt-2">
                                        <div className="flex items-center justify-between bg-amber-50 rounded-[8px] px-4 py-3">
                                            <span className="text-[14px] font-bold text-[#0F172A]">Total Amount Due</span>
                                            <span className="text-[16px] font-bold text-[#0F172A]">{fmt(totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cancel Order */}
                            {canCancel && (
                                <div>
                                    <button
                                        onClick={() => setShowCancelDialog(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-100 text-red-500 text-[14px] font-bold rounded-[10px] hover:bg-red-100 transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                        Cancel Order
                                    </button>
                                    <p className="text-[12px] text-[#94A3B8] text-center mt-2">
                                        This action cannot be undone once the driver has started the trip.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Cancel Confirmation Dialog */}
            {showCancelDialog && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[420px] shadow-xl p-6">
                        <h3 className="text-[18px] font-bold text-[#0F172A] mb-5">Cancel order</h3>

                        <label className="block text-[13px] font-semibold text-[#475569] mb-2">
                            Reason for Cancellation
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter detailed reason for cancelling the order..."
                            rows={4}
                            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] resize-none"
                        />
                        <p className="text-[12px] text-[#94A3B8] mt-2">
                            Note: Order cancellations are only permitted in exceptional cases.
                        </p>

                        {cancelError && (
                            <p className="text-red-500 text-[13px] mt-3">{cancelError}</p>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-5">
                            <button
                                onClick={() => {
                                    setShowCancelDialog(false);
                                    setCancelReason('');
                                    setCancelError('');
                                }}
                                disabled={cancelling}
                                className="px-5 py-2 text-[14px] font-semibold text-[#475569] border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling || !cancelReason.trim()}
                                className="px-5 py-2 text-[14px] font-bold text-[#0F172A] bg-[#FDC63A] rounded-[8px] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailModal;
