import { useCallback, useEffect, useState } from 'react';
import {
    searchOrderByNumber,
    fetchTickets,
    fetchTicketById,
    createTicket,
    fetchCategories,
    addSummary,
    updateSummary,
    fetchRatings,
} from '../supportApi';
import { getMediaUrl } from '../../../config/api';
import OrderDetailModal from '../../orders/components/OrderDetailModal';

const LIMIT = 10;

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// ── Add New Support Modal ────────────────────────────────────────────────────

const AddSupportModal = ({ onClose, onCreated }) => {
    const [orderInput, setOrderInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [foundOrder, setFoundOrder] = useState(null);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    const handleSearch = async () => {
        if (!orderInput.trim()) return;
        setSearching(true);
        setSearchError('');
        setFoundOrder(null);
        try {
            const data = await searchOrderByNumber(orderInput.trim());
            setFoundOrder(data);
        } catch (err) {
            setSearchError(err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectOrder = async () => {
        if (!foundOrder) return;
        setCreating(true);
        setCreateError('');
        try {
            await createTicket(foundOrder._id);
            onCreated();
        } catch (err) {
            setCreateError(err.message);
            setCreating(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[20px] w-full max-w-[440px] shadow-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#FDC63A] rounded-[8px] flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 className="text-[17px] font-bold text-[#0F172A]">Add New Support Ticket</h2>
                    </div>
                    <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer">
                        <CloseIcon />
                    </button>
                </div>

                {/* Order ID input */}
                <p className="text-[13px] font-semibold text-[#475569] mb-2">Order ID</p>
                <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        value={orderInput}
                        onChange={(e) => setOrderInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="#ORD-12345"
                        className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#FDC63A] bg-[#F8FAFC]"
                    />
                </div>

                {/* Search button */}
                <button
                    onClick={handleSearch}
                    disabled={searching || !orderInput.trim()}
                    className="w-full py-3 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[10px] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mb-3"
                >
                    <SearchIcon />
                    {searching ? 'Searching...' : 'Search Order'}
                </button>

                {searchError && <p className="text-red-500 text-[13px] mb-3">{searchError}</p>}

                {/* Found order card */}
                {foundOrder && (
                    <button
                        onClick={handleSelectOrder}
                        disabled={creating}
                        className="w-full flex items-center gap-1 p-3 border border-[#E2E8F0] rounded-[12px] hover:border-[#FDC63A] hover:bg-amber-50/40 transition-all cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {foundOrder.material?.image ? (
                            <img
                                src={getMediaUrl(foundOrder.material.image)}
                                alt={foundOrder.material.materialName}
                                className="w-14 h-14 object-cover rounded-[8px] flex-shrink-0"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-slate-100 rounded-[8px] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-[#0F172A] truncate">{foundOrder.material?.materialName || '--'}</p>
                            {foundOrder.customer?.fullName && (
                                <p className="text-[12px] text-[#64748B] flex items-center gap-1 mt-0.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    {foundOrder.customer.fullName}
                                </p>
                            )}
                            {foundOrder.scheduledDate && (
                                <p className="text-[12px] text-[#64748B] flex items-center gap-1 mt-0.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    {formatDate(foundOrder.scheduledDate)}
                                </p>
                            )}
                            <p className="text-[12px] text-[#94A3B8] mt-0.5 capitalize">Status: {foundOrder.status}</p>
                        </div>
                        <p className="text-[14px] font-bold text-[#0F172A] flex-shrink-0">₹{Number(foundOrder.estimatedAmount).toLocaleString('en-IN')}</p>
                    </button>
                )}

                {createError && <p className="text-red-500 text-[13px] mt-2">{createError}</p>}
                {creating && <p className="text-[#64748B] text-[13px] mt-2 text-center">Creating ticket...</p>}

                {/* Cancel */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2.5 text-[#475569] text-[14px] font-semibold hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

// ── Support Summary Modal ────────────────────────────────────────────────────

const SupportSummaryModal = ({ ticketId, hasSummary, onClose, onSaved }) => {
    const [ticket, setTicket] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(!hasSummary);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [complaint, setComplaint] = useState('');
    const [solution, setSolution] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        Promise.all([fetchTicketById(ticketId), fetchCategories()])
            .then(([ticketData, cats]) => {
                setTicket(ticketData);
                setCategories(cats);
                if (ticketData.hasSummary && ticketData.summary) {
                    setSelectedCategory(ticketData.summary.supportCategory?._id || '');
                    setComplaint(ticketData.summary.customerComplaint || '');
                    setSolution(ticketData.summary.solution || '');
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [ticketId]);

    const handleSubmit = async () => {
        if (!selectedCategory || !complaint.trim() || !solution.trim()) {
            setSubmitError('Please fill in all fields.');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            if (hasSummary) {
                await updateSummary(ticketId, { supportCategory: selectedCategory, customerComplaint: complaint, solution });
            } else {
                await addSummary(ticketId, { supportCategory: selectedCategory, customerComplaint: complaint, solution });
            }
            onSaved();
        } catch (err) {
            setSubmitError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[20px] w-full max-w-[500px] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#FDC63A] rounded-[8px] flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        <h2 className="text-[17px] font-bold text-[#0F172A]">Support Summary</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasSummary && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[13px] font-semibold text-[#FDC63A] hover:text-[#fbbf24] transition-colors cursor-pointer"
                            >
                                Edit
                            </button>
                        )}
                        <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <div className="h-10 bg-slate-100 animate-pulse rounded-[8px]" />
                        <div className="h-24 bg-slate-100 animate-pulse rounded-[8px]" />
                        <div className="h-24 bg-slate-100 animate-pulse rounded-[8px]" />
                    </div>
                ) : error ? (
                    <p className="text-red-500 text-[13px]">{error}</p>
                ) : (
                    <>
                        {/* Support Category */}
                        <div className="mb-4">
                            <p className="text-[11px] font-bold text-[#94A3B8] tracking-widest uppercase mb-2">Support Category</p>
                            {isEditing ? (
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] focus:outline-none focus:border-[#FDC63A] bg-white appearance-none cursor-pointer"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="px-3 py-2.5 bg-[#F8FAFC] rounded-[10px] text-[14px] text-[#0F172A] capitalize">
                                    {ticket?.summary?.supportCategory?.name || '--'}
                                </div>
                            )}
                        </div>

                        {/* Customer Complaint */}
                        <div className="mb-4">
                            <p className="text-[11px] font-bold text-[#94A3B8] tracking-widest uppercase mb-2">Customer Complaint</p>
                            {isEditing ? (
                                <textarea
                                    value={complaint}
                                    onChange={(e) => setComplaint(e.target.value)}
                                    placeholder="Describe the issue reported by the customer..."
                                    rows={4}
                                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#FDC63A] resize-none"
                                />
                            ) : (
                                <div className="px-3 py-2.5 bg-[#F8FAFC] rounded-[10px] text-[14px] text-[#0F172A] min-h-[80px]">
                                    {ticket?.summary?.customerComplaint || '--'}
                                </div>
                            )}
                        </div>

                        {/* Solution */}
                        <div className="mb-5">
                            <p className="text-[11px] font-bold text-[#94A3B8] tracking-widest uppercase mb-2">Solution</p>
                            {isEditing ? (
                                <textarea
                                    value={solution}
                                    onChange={(e) => setSolution(e.target.value)}
                                    placeholder="Detail the steps taken to resolve this ticket..."
                                    rows={4}
                                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-[10px] text-[14px] text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#FDC63A] resize-none"
                                />
                            ) : (
                                <div className="px-3 py-2.5 bg-[#F8FAFC] rounded-[10px] text-[14px] text-[#0F172A] min-h-[80px]">
                                    {ticket?.summary?.solution || '--'}
                                </div>
                            )}
                        </div>

                        {submitError && <p className="text-red-500 text-[13px] mb-3">{submitError}</p>}

                        {/* Actions */}
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        if (hasSummary) {
                                            setIsEditing(false);
                                            setSubmitError('');
                                        } else {
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 py-3 border border-[#E2E8F0] text-[#475569] text-[14px] font-semibold rounded-[10px] hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[10px] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {submitting ? 'Saving...' : 'Submit Summary'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full py-3 border border-[#E2E8F0] text-[#475569] text-[14px] font-semibold rounded-[10px] hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ── Category badge ───────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
    { bg: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'bg-red-50', text: 'text-red-500' },
    { bg: 'bg-green-50', text: 'text-green-600' },
    { bg: 'bg-purple-50', text: 'text-purple-600' },
    { bg: 'bg-amber-50', text: 'text-amber-600' },
];

const categoryColorMap = {};
let colorIndex = 0;

const getCategoryColor = (name) => {
    if (!name) return CATEGORY_COLORS[0];
    if (!categoryColorMap[name]) {
        categoryColorMap[name] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
        colorIndex++;
    }
    return categoryColorMap[name];
};

// ── Main Page ────────────────────────────────────────────────────────────────

const SupportPage = () => {
    const [activeTab, setActiveTab] = useState('support');
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);
    const [summaryModal, setSummaryModal] = useState(null); // { ticketId, hasSummary }
    const [orderDetailId, setOrderDetailId] = useState(null);

    // Shared search & date filter
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    // Reviews tab state
    const [reviews, setReviews] = useState([]);
    const [reviewsPagination, setReviewsPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState('');
    const [reviewsPage, setReviewsPage] = useState(1);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
            setReviewsPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const loadTickets = useCallback(async (p, s, f, t) => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchTickets({ page: p, limit: LIMIT, search: s, from: f, to: t });
            const list = data.tickets;
            setPagination(data.pagination);

            // Fetch individual details for tickets that have a summary to get the category
            const withDetails = await Promise.all(
                list.map(async (ticket) => {
                    if (!ticket.hasSummary) return ticket;
                    try {
                        const detail = await fetchTicketById(ticket._id);
                        return { ...ticket, supportCategory: detail.summary?.supportCategory || null };
                    } catch {
                        return ticket;
                    }
                })
            );
            setTickets(withDetails);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets(page, search, from, to);
    }, [page, search, from, to, loadTickets]);

    useEffect(() => {
        if (activeTab !== 'reviews') return;
        setReviewsLoading(true);
        setReviewsError('');
        fetchRatings({ page: reviewsPage, limit: LIMIT, search, from, to })
            .then((data) => {
                setReviews(data.ratings);
                setReviewsPagination(data.pagination);
            })
            .catch((err) => setReviewsError(err.message))
            .finally(() => setReviewsLoading(false));
    }, [activeTab, reviewsPage, search, from, to]);

    const handleCreated = () => {
        setShowAddModal(false);
        setPage(1);
        loadTickets(1, search, from, to);
    };

    const handleSummarySaved = () => {
        setSummaryModal(null);
        loadTickets(page, search, from, to);
    };

    const { totalCount, totalPages, currentPage } = pagination;
    const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
    const showingTo = Math.min(currentPage * LIMIT, totalCount);

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
                >
                    ‹
                </button>
                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-[14px] font-semibold transition-colors ${
                            p === currentPage
                                ? 'bg-[#FDC63A] text-[#0F172A]'
                                : 'border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ›
                </button>
            </div>
        );
    };

    return (
        <div>
            {/* Search & Date Filters */}
            <div className="flex items-center justify-between mb-5">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by Order ID, Customer, or Partner..."
                        className="pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white w-[340px]"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => { setFrom(e.target.value); setPage(1); setReviewsPage(1); }}
                            className={`pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white ${from ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                        />
                    </div>
                    <span className="text-[#94A3B8] font-medium">–</span>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => { setTo(e.target.value); setPage(1); setReviewsPage(1); }}
                            className={`pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white ${to ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs + Add button row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 border-b border-[#E2E8F0] w-full">
                    <div className="flex items-center gap-1 flex-1">
                        {['support', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 text-[14px] font-semibold capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                                    activeTab === tab
                                        ? 'border-[#FDC63A] text-[#0F172A]'
                                        : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'reviews' ? (
                <>
                    {reviewsError && <p className="text-red-500 text-sm mb-4">{reviewsError}</p>}

                    {/* Reviews list */}
                    <div className="space-y-4">
                        {reviewsLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-[16px] border border-[#F1F5F9] p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="w-32 h-4 bg-slate-100 animate-pulse rounded" />
                                            <div className="w-full h-3 bg-slate-100 animate-pulse rounded" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <div className="flex-1 h-9 bg-slate-100 animate-pulse rounded-[8px]" />
                                        <div className="flex-1 h-9 bg-slate-100 animate-pulse rounded-[8px]" />
                                        <div className="flex-1 h-9 bg-slate-100 animate-pulse rounded-[8px]" />
                                    </div>
                                </div>
                            ))
                        ) : reviews.length === 0 ? (
                            <div className="py-16 text-center text-[#94A3B8] text-sm">No reviews found</div>
                        ) : (
                            reviews.map((review) => {
                                const name = review.userId?.fullName || review.userId?.email || 'User';
                                const initials = (() => {
                                    const parts = name.trim().split(' ');
                                    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                                    return name.slice(0, 2).toUpperCase();
                                })();
                                const photoPath = review.userId?.profileImage;
                                const photoUrl = photoPath
                                    ? photoPath.startsWith('http')
                                        ? photoPath
                                        : getMediaUrl(photoPath)
                                    : null;
                                const star = review.star || 0;

                                return (
                                    <div key={review._id} className="bg-white rounded-[16px] border border-[#F1F5F9] p-5">
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="flex items-start gap-1 flex-1 min-w-0">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-[#FDC63A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {photoUrl ? (
                                                        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[13px] font-bold text-[#0F172A]">{initials}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[15px] font-bold text-[#0F172A]">{name}</p>
                                                    <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">{review.comment || '--'}</p>
                                                </div>
                                            </div>
                                            {/* Stars */}
                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                                                        fill={i < star ? '#F59E0B' : 'none'}
                                                        stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Buttons */}
                                        <div className="flex items-center gap-3 mt-4">
                                            <button className="flex-1 py-2 border border-[#E2E8F0] text-[#475569] text-[13px] font-semibold rounded-[8px] hover:bg-slate-50 transition-colors cursor-pointer">
                                                Reply
                                            </button>
                                            <button className="flex-1 py-2 border border-[#E2E8F0] text-[#475569] text-[13px] font-semibold rounded-[8px] hover:bg-slate-50 transition-colors cursor-pointer">
                                                View Partner Reply
                                            </button>
                                            <button
                                                onClick={() => setOrderDetailId(review.orderId?._id)}
                                                className="flex-1 py-2 bg-[#FDC63A] text-[#0F172A] text-[13px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                                            >
                                                Order Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Reviews pagination */}
                    {!reviewsLoading && reviews.length > 0 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-[14px] text-[#64748B]">
                                Showing {reviewsPagination.totalCount === 0 ? 0 : (reviewsPagination.currentPage - 1) * LIMIT + 1} to{' '}
                                {Math.min(reviewsPagination.currentPage * LIMIT, reviewsPagination.totalCount)} of{' '}
                                {reviewsPagination.totalCount} Reviews
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                                    disabled={reviewsPagination.currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >‹</button>
                                {Array.from({ length: reviewsPagination.totalPages }, (_, i) => i + 1)
                                    .slice(
                                        Math.max(0, reviewsPagination.currentPage - 2),
                                        Math.max(3, reviewsPagination.currentPage + 1)
                                    )
                                    .map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setReviewsPage(p)}
                                            className={`w-8 h-8 flex items-center justify-center rounded text-[14px] font-semibold transition-colors ${
                                                p === reviewsPagination.currentPage
                                                    ? 'bg-[#FDC63A] text-[#0F172A]'
                                                    : 'border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50'
                                            }`}
                                        >{p}</button>
                                    ))}
                                <button
                                    onClick={() => setReviewsPage((p) => Math.min(reviewsPagination.totalPages, p + 1))}
                                    disabled={reviewsPagination.currentPage === reviewsPagination.totalPages || reviewsPagination.totalPages === 0}
                                    className="w-8 h-8 flex items-center justify-center rounded border border-[#E2E8F0] text-[#64748B] text-[16px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >›</button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Add New Support button */}
                    <div className="flex justify-end mb-5">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#FDC638] text-[#1C180C] text-[16px] font-bold rounded-[10px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            Add New Support
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    {/* Ticket list */}
                    <div className="space-y-3">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-100 animate-pulse rounded-[10px] flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-32 h-3 bg-slate-100 animate-pulse rounded" />
                                        <div className="w-24 h-4 bg-slate-100 animate-pulse rounded" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-28 h-9 bg-slate-100 animate-pulse rounded-[8px]" />
                                        <div className="w-36 h-9 bg-slate-100 animate-pulse rounded-[8px]" />
                                    </div>
                                </div>
                            ))
                        ) : tickets.length === 0 ? (
                            <div className="py-16 text-center text-[#94A3B8] text-sm">
                                No support tickets found
                            </div>
                        ) : (
                            tickets.map((ticket) => {
                                const imgUrl = getMediaUrl(ticket.materialImage);
                                const categoryName = ticket.supportCategory?.name ?? null;
                                const color = getCategoryColor(categoryName);
                                return (
                                    <div
                                        key={ticket._id}
                                        className="bg-white rounded-[12px] border border-[#F1F5F9] p-[21px] flex items-center gap-10"
                                    >
                                        {/* Material image */}
                                        {imgUrl ? (
                                            <img
                                                src={imgUrl}
                                                alt={ticket.materialName}
                                                className="w-[78px] h-[78px] object-cover rounded-[8px] flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 bg-slate-100 rounded-[10px] flex-shrink-0" />
                                        )}

                                        {/* Order ID */}
                                        <div className="w-[160px] flex-shrink-0">
                                            <p className="text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase">Order ID</p>
                                            <p className="text-[16px] font-bold text-[#0F172A] mt-0.5">#{ticket.orderNumber}</p>
                                        </div>

                                        {/* Material name */}
                                        <div className="w-[140px] flex-shrink-0">
                                            <p className="text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase">Material Name</p>
                                            <p className="text-[16px] font-semibold text-[#0F172A] mt-0.5">{ticket.materialName || '--'}</p>
                                        </div>

                                        {/* Support Category */}
                                        <div className="flex-1">
                                            <p className="text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase">Support Category</p>
                                            <div className="mt-1">
                                                {categoryName ? (
                                                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold capitalize ${color.bg} ${color.text}`}>
                                                        {categoryName}
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] text-[#CBD5E1]">-- ----</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Created By */}
                                        <div className="w-[120px] flex-shrink-0">
                                            <p className="text-[12px] font-bold text-[#94A3B8] tracking-widest uppercase">Created By</p>
                                            <p className="text-[14px] font-semibold text-[#0F172A] mt-0.5">{ticket.createdBy?.fullName || '--'}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setSummaryModal({ ticketId: ticket._id, hasSummary: ticket.hasSummary })}
                                                className="px-4 py-2 border border-[#E2E8F0] text-[#475569] text-[14px] font-semibold rounded-[8px] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                                            >
                                                {ticket.hasSummary ? 'View Summary' : 'Enter Summary'}
                                            </button>
                                            <button
                                                onClick={() => setOrderDetailId(ticket.orderId)}
                                                className="px-4 py-2 bg-[#FDC63A] text-[#1C180C] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer whitespace-nowrap"
                                            >
                                                View Order Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && tickets.length > 0 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-[14px] text-[#64748B]">
                                Showing {showingFrom} to {showingTo} of {totalCount} Tickets
                            </p>
                            {renderPageButtons()}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddSupportModal
                    onClose={() => setShowAddModal(false)}
                    onCreated={handleCreated}
                />
            )}

            {summaryModal && (
                <SupportSummaryModal
                    ticketId={summaryModal.ticketId}
                    hasSummary={summaryModal.hasSummary}
                    onClose={() => setSummaryModal(null)}
                    onSaved={handleSummarySaved}
                />
            )}

            {orderDetailId && (
                <OrderDetailModal
                    orderId={orderDetailId}
                    onClose={() => setOrderDetailId(null)}
                />
            )}
        </div>
    );
};

export default SupportPage;
