import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../../orders/orderApi';
import { getMediaUrl } from '../../../config/api';

const LIMIT = 12;

const SkeletonCard = () => (
    <div className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-[#F1F5F9]">
        <div className="w-full h-[180px] bg-slate-100 animate-pulse" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
            <div className="h-9 bg-slate-100 animate-pulse rounded" />
        </div>
    </div>
);

const BidManagementPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        fetchOrders({ page, limit: LIMIT, status: 'requested' })
            .then((data) => {
                setOrders(data.orders ?? []);
                setPagination(data.pagination ?? { totalCount: 0, totalPages: 1, currentPage: 1 });
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [page]);

    const { totalPages, currentPage } = pagination;

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
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-[30px] font-bold text-[#0F172A]">Bid Management</h1>
                <p className="text-[14px] text-[#64748B] mt-1">Contact customer and verify material request</p>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Card Grid */}
            <div className="grid grid-cols-4 gap-5">
                {loading ? (
                    Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)
                ) : orders.length === 0 ? (
                    <div className="col-span-4 py-20 text-center text-[#94A3B8] text-sm">
                        No active bids found
                    </div>
                ) : (
                    orders.map((order) => {
                        const imgUrl = getMediaUrl(order.material?.image);
                        const name = order.material?.materialName ?? 'Unknown Material';
                        return (
                            <div
                                key={order._id}
                                className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-[#F1F5F9]"
                            >
                                {/* Image */}
                                <div className="relative px-[16px] pt-[16px]">
                                    <div className="rounded-[12px] overflow-hidden h-[180px]">
                                        {imgUrl ? (
                                            <img
                                                src={imgUrl}
                                                alt={name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute top-5 left-5 bg-[#FDC63A] text-[#0F172A] text-[10px] font-bold px-2.5 py-[3px] rounded-full uppercase tracking-wide">
                                        Active
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="py-4 px-[16px]">
                                    <p className="text-[14px] font-bold text-[#0F172A] truncate mb-3">
                                        {name}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/bid-management/${order._id}`)}
                                        className="w-full py-2 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                                    >
                                        Attend
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    {renderPageButtons()}
                </div>
            )}
        </div>
    );
};

export default BidManagementPage;
