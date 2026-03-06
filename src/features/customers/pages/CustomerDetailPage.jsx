import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCustomerById, blockCustomer, activateCustomer, notifyCustomer, fetchCustomerOrders } from '../customerApi';
import { getMediaUrl } from '../../../config/api';
import OrderDetailModal from '../../orders/components/OrderDetailModal';

const CUSTOMER_STATUS_CONFIG = {
    Active: { label: 'ACTIVE', bg: 'bg-green-100', text: 'text-green-700' },
    Blocked: { label: 'BLOCKED', bg: 'bg-red-100', text: 'text-red-600' },
    Deleted: { label: 'DELETED', bg: 'bg-slate-100', text: 'text-slate-500' },
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
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-500' },
};

const ORDER_TABLE_COLS = ['ORDER ID', 'PARTNER', 'MATERIAL', 'QUANTITY', 'AMOUNT', 'STATUS', 'ACTION'];
const ORDERS_LIMIT = 9;

const formatPhone = (phone) => {
    if (!phone) return '--';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    return phone;
};

const formatCustomerType = (type) => {
    if (!type) return '--';
    return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

const getCustomerId = (user) => {
    if (user.uniqueId) return user.uniqueId;
    return `CUST-${user._id.slice(-6).toUpperCase()}`;
};

const getOrderQuantity = (order) => {
    const { vehicle, material } = order;
    if (vehicle?.vehicleCapacity && vehicle?.numberOfLoads) {
        return `${vehicle.vehicleCapacity} X ${vehicle.numberOfLoads}`;
    }
    if (material?.quantity && material?.unit) {
        return `${material.quantity} ${material.unit}`;
    }
    return '--';
};

const fmtAmount = (amount) =>
    `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomerDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [totalOrderCount, setTotalOrderCount] = useState(null);
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
    const [blockReason, setBlockReason] = useState('');
    const [blocking, setBlocking] = useState(false);
    const [blockError, setBlockError] = useState('');

    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [activating, setActivating] = useState(false);
    const [activateError, setActivateError] = useState('');

    useEffect(() => {
        fetchCustomerById(id)
            .then((data) => setCustomer(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch orders
    useEffect(() => {
        setOrdersLoading(true);
        fetchCustomerOrders(id, { page, limit: ORDERS_LIMIT, search, status: orderStatus, from, to })
            .then((data) => {
                setOrders(data.orders);
                setPagination(data.pagination);
                // Store unfiltered total on first load
                if (totalOrderCount === null && !search && !orderStatus && !from && !to && page === 1) {
                    setTotalOrderCount(data.pagination.totalCount);
                }
            })
            .catch(() => {})
            .finally(() => setOrdersLoading(false));
    }, [id, page, search, orderStatus, from, to]);

    const handleNotify = async () => {
        setNotifying(true);
        setNotifyError('');
        setNotifySuccess(false);
        try {
            await notifyCustomer(id, { title: notifyTitle, message: notifyMessage });
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
            await blockCustomer(id, blockReason);
            setCustomer((prev) => ({ ...prev, status: 'Blocked' }));
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
            await activateCustomer(id);
            setCustomer((prev) => ({ ...prev, status: 'Active' }));
            setShowActivateConfirm(false);
        } catch (err) {
            setActivateError(err.message);
        } finally {
            setActivating(false);
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

    if (error || !customer) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 text-sm">{error || 'Customer not found'}</p>
                <button
                    onClick={() => navigate('/customer-management')}
                    className="mt-4 text-[14px] text-[#FDC63A] font-semibold hover:underline"
                >
                    ← Back to Customer Management
                </button>
            </div>
        );
    }

    const statusCfg = CUSTOMER_STATUS_CONFIG[customer.status] || {
        label: customer.status?.toUpperCase() ?? 'UNKNOWN',
        bg: 'bg-slate-100',
        text: 'text-slate-500',
    };
    const isBlocked = customer.status === 'Blocked';
    const photoUrl = customer.profileImage ? getMediaUrl(customer.profileImage) : null;
    const displayName = customer.fullName || customer.email || 'Customer';

    return (
        <div>
            {/* Back navigation */}
            <button
                onClick={() => navigate('/customer-management')}
                className="flex items-center gap-1.5 text-[13px] text-[#64748B] font-medium hover:text-[#0F172A] transition-colors mb-5"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Customer Management
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-[12px] shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-[#FDC63A] flex items-center justify-center flex-shrink-0">
                            {photoUrl ? (
                                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[22px] font-bold text-[#0F172A]">{getInitials(displayName)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <h1 className="text-[22px] font-bold text-[#0F172A]">{displayName}</h1>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusCfg.bg} ${statusCfg.text}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <p className="text-[13px] text-[#64748B]">Customer ID: {getCustomerId(customer)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowNotifyModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-[8px] text-[13px] font-semibold text-[#475569] hover:bg-slate-50 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                            </svg>
                            Personalized Notification
                        </button>
                        {isBlocked ? (
                            <button
                                onClick={() => setShowActivateConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-green-200 rounded-[8px] text-[13px] font-semibold text-green-600 hover:bg-green-50 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Activate Customer
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowBlockConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-[8px] text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                                Block Customer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-[12px] shadow-sm p-6 mb-6">
                <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-5">Personal Details</p>
                <div className="grid grid-cols-4 gap-6">
                    {/* Mobile Number */}
                    <div>
                        <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1.5">Mobile Number</p>
                        <p className="text-[16px] font-bold text-[#0F172A]">{formatPhone(customer.phone)}</p>
                    </div>
                    {/* Email ID */}
                    <div>
                        <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1.5">Email ID</p>
                        <p className="text-[14px] font-semibold text-[#0F172A]">{customer.email || '--'}</p>
                        {customer.email && (
                            <a
                                href={`mailto:${customer.email}`}
                                className="text-[12px] text-amber-500 font-semibold hover:underline mt-0.5 inline-block"
                            >
                                Send email
                            </a>
                        )}
                    </div>
                    {/* Customer Type */}
                    <div>
                        <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1.5">Customer Type</p>
                        <div className="flex items-center gap-1.5">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FDC63A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <p className="text-[14px] font-semibold text-[#0F172A]">{formatCustomerType(customer.customerType)}</p>
                        </div>
                    </div>
                    {/* No. of Orders */}
                    <div>
                        <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase mb-1.5">No. of Orders</p>
                        {ordersLoading && totalOrderCount === null ? (
                            <span className="inline-block w-10 h-6 bg-slate-100 animate-pulse rounded" />
                        ) : (
                            <p className="text-[22px] font-bold text-[#0F172A]">
                                {customer.totalOrders ?? totalOrderCount ?? '--'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Order History */}
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
                            <option value="rejected">Rejected</option>
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
                                                {order.assignedPartner?.partnerType || '--'}
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
                                <button onClick={closeNotifyModal} className="mt-4 px-5 py-2 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24]">
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
                                    <button onClick={closeNotifyModal} className="px-5 py-2 text-[14px] font-semibold text-[#475569] border border-[#E2E8F0] rounded-[8px] hover:bg-slate-50 transition-colors">
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

            {/* Block Confirmation */}
            {showBlockConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[420px] shadow-xl p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] text-center mb-2">Block Customer</h3>
                        <p className="text-[13px] text-[#64748B] text-center mb-4">
                            Are you sure you want to block <strong>{displayName}</strong>?
                        </p>
                        <div>
                            <label className="block text-[13px] font-semibold text-[#475569] mb-1.5">Reason for blocking</label>
                            <textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="Enter reason for blocking this customer..."
                                rows={3}
                                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
                            />
                        </div>
                        {blockError && <p className="text-red-500 text-[13px] mt-3">{blockError}</p>}
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
                                {blocking ? 'Blocking...' : 'Block Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activate Confirmation */}
            {showActivateConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[420px] shadow-xl p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] text-center mb-2">Activate Customer</h3>
                        <p className="text-[13px] text-[#64748B] text-center mb-5">
                            Are you sure you want to activate <strong>{displayName}</strong>?
                        </p>
                        {activateError && <p className="text-red-500 text-[13px] mb-3 text-center">{activateError}</p>}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => { setShowActivateConfirm(false); setActivateError(''); }}
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
                                {activating ? 'Activating...' : 'Activate Customer'}
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

export default CustomerDetailPage;
