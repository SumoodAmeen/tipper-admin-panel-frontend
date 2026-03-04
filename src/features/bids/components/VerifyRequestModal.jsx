import { useEffect, useState } from 'react';
import { fetchVehicles, approveOrder, rejectOrder, changeOrderVehicle } from '../bidApi';
import { getMediaUrl } from '../../../config/api';

const formatSchedule = (dateStr, timeStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const today = new Date();
    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    const dateLabel = isToday
        ? 'Today'
        : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    return timeStr ? `${dateLabel}, ${timeStr}` : dateLabel;
};

const VerifyRequestModal = ({ order, onClose, onActionComplete }) => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState(order.vehicle?.vehicleId ?? '');
    const [vehiclesLoading, setVehiclesLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVehicles()
            .then((data) => setVehicles(data.vehicles ?? []))
            .catch(() => {})
            .finally(() => setVehiclesLoading(false));
    }, []);

    const { material, vehicle, deliveryLocation, scheduledDate, scheduledTime, userId } = order;
    const imgUrl = getMediaUrl(material?.image);
    const { lat, lng } = deliveryLocation?.coordinates ?? {};
    const address = [
        deliveryLocation?.address,
        deliveryLocation?.streetOrLandmark,
        deliveryLocation?.city,
        deliveryLocation?.pincode,
    ].filter(Boolean).join(', ');

    const handleSendToBid = async () => {
        setLoading(true);
        setError('');
        try {
            if (selectedVehicleId && selectedVehicleId !== order.vehicle?.vehicleId) {
                await changeOrderVehicle(order._id, selectedVehicleId);
            }
            await approveOrder(order._id);
            onActionComplete(order._id);
            onClose();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        setLoading(true);
        setError('');
        try {
            await rejectOrder(order._id);
            onActionComplete(order._id);
            onClose();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[16px] w-[90%] max-w-[560px] shadow-xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">Verify Request</h2>
                    <button
                        onClick={onClose}
                        className="text-[#94A3B8] hover:text-[#475569] transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">

                    {/* ORDER DETAILS */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-bold text-[#94A3B8] tracking-widest uppercase">Order Details</p>
                            {lat && lng && (
                                <a
                                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#475569] hover:bg-slate-50 transition-colors"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
                                    Direction
                                </a>
                            )}
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Material image */}
                            <div className="w-[68px] h-[68px] rounded-[10px] overflow-hidden flex-shrink-0 bg-slate-100">
                                {imgUrl ? (
                                    <img src={imgUrl} alt={material?.materialName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-bold text-[#0F172A]">{material?.materialName ?? '--'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-block bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                                        {material?.materialName ?? ''}
                                    </span>
                                    <span className="text-[#CBD5E1]">·</span>
                                    <span className="text-[13px] text-[#64748B]">
                                        Selected Vehicle : {vehicle?.vehicleName ?? '--'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className="text-[12px] text-[#94A3B8]">
                                        {formatSchedule(scheduledDate, scheduledTime)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Vehicle Type */}
                    <div>
                        <p className="text-[13px] text-[#475569] font-medium mb-2">Change Vehicle Type</p>
                        <div className="relative">
                            <select
                                value={selectedVehicleId}
                                onChange={(e) => setSelectedVehicleId(e.target.value)}
                                disabled={vehiclesLoading || loading}
                                className="w-full appearance-none pl-4 pr-9 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white cursor-pointer disabled:opacity-60"
                            >
                                {vehiclesLoading ? (
                                    <option>Loading vehicles...</option>
                                ) : (
                                    vehicles.map((v) => (
                                        <option key={v._id} value={v._id}>{v.name}</option>
                                    ))
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* CUSTOMER DETAILS */}
                    <div>
                        <p className="text-[11px] font-bold text-[#94A3B8] tracking-widest uppercase mb-3">Customer Details</p>
                        <div className="bg-[#F8FAFC] rounded-[10px] p-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Customer Name</p>
                                <p className="text-[14px] font-semibold text-[#0F172A]">{userId?.fullName ?? '--'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Customer ID</p>
                                <p className="text-[14px] font-semibold text-[#0F172A]">
                                    #{userId?._id?.slice(-8).toUpperCase() ?? '--'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Email</p>
                                <p className="text-[14px] font-semibold text-[#0F172A] break-all">{userId?.email ?? '--'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Delivery Address</p>
                                <div className="flex items-start gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <p className="text-[13px] text-[#475569] leading-snug">{address || '--'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-[13px] text-center">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={handleCancelRequest}
                            disabled={loading}
                            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] font-semibold text-[#475569] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel Request
                        </button>
                        <button
                            onClick={handleSendToBid}
                            disabled={loading || vehiclesLoading}
                            className="flex-1 py-2.5 bg-[#FDC63A] rounded-[8px] text-[14px] font-bold text-[#0F172A] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Send to Bid'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyRequestModal;
