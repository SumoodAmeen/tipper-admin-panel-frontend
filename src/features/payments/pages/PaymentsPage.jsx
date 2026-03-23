import { useEffect, useState } from 'react';
import { fetchTransactions } from '../paymentApi';
import OrderDetailModal from '../../orders/components/OrderDetailModal';
import excelIcon from '../../../assets/partner/excel.png';

const STATUS_CONFIG = {
    paid: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-600' },
    pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-600' },
    failed: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-500' },
};

const TYPE_LABELS = {
    wallet_recharge: 'Wallet Recharge',
    commission_payment: 'Commission Payment',
    refund: 'Refund',
    penalty: 'Penalty',
};

const TABLE_COLS = ['TRANSACTION ID', 'NAME', 'TRANSACTION TYPE', 'DATE', 'AMOUNT', 'STATUS', 'ACTION'];

const LIMIT = 10;

const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd} - ${mm} - ${yyyy}`;
};

const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '--';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PaymentsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orderPickerTxn, setOrderPickerTxn] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const load = () => {
            setLoading(true);
            fetchTransactions({ page, limit: LIMIT, search, status, from, to })
                .then((data) => {
                    setTransactions(data.transactions);
                    setPagination(data.pagination);
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        };
        load();
    }, [page, search, status, from, to]);

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
        setPage(1);
    };

    const handleFromChange = (e) => {
        setFrom(e.target.value);
        setPage(1);
    };

    const handleToChange = (e) => {
        setTo(e.target.value);
        setPage(1);
    };

    const handleExport = () => {
        if (!transactions.length) return;
        const headers = ['Transaction ID', 'Name', 'Partner Type', 'Transaction Type', 'Date', 'Amount', 'Status'];
        const rows = transactions.map((t) => [
            t.transactionNumber || t._id,
            t.partnerName || '--',
            t.partnerType || '--',
            TYPE_LABELS[t.type] || t.type || '--',
            formatDate(t.createdAt),
            t.amount ?? '--',
            t.status || '--',
        ]);
        const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_page${page}.csv`;
        a.click();
        URL.revokeObjectURL(url);
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[30px] font-bold text-[#0F172A]">Transaction Summary</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
                >
                    <img src={excelIcon} alt="excel" width="16" height="16" />
                    Export as XL Sheet
                </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by Transaction ID or Partner Name..."
                        className="w-[364px] pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                    />
                </div>

                {/* Status */}
                <div className="relative">
                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className={`appearance-none pl-4 pr-9 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white min-w-[130px] cursor-pointer ${status ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                    >
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </div>

                {/* From date */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <input
                        type="date"
                        value={from}
                        onChange={handleFromChange}
                        className={`pl-9 pr-3 py-2.5 border border-[#E2E8F0] w-[160px] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white ${from ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                    />
                </div>

                <span className="text-[#94A3B8] font-medium">–</span>

                {/* To date */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <input
                        type="date"
                        value={to}
                        onChange={handleToChange}
                        className={`pl-9 pr-3 py-2.5 border border-[#E2E8F0] w-[160px] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white ${to ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E2E8F0]">
                                {TABLE_COLS.map((col) => (
                                    <th key={col} className="px-6 py-3 text-left text-[12px] font-bold text-[#64748B] tracking-widest uppercase">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: LIMIT }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#E2E8F0]">
                                        {TABLE_COLS.map((col) => (
                                            <td key={col} className="px-6 py-4">
                                                <span className="inline-block w-24 h-4 bg-slate-100 animate-pulse rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} className="px-6 py-10 text-center text-[#94A3B8] text-sm">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => {
                                    const statusCfg = STATUS_CONFIG[txn.status] || {
                                        label: txn.status || '--',
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-500',
                                    };
                                    return (
                                        <tr key={txn._id} className="hover:bg-[#FAFAFA] transition-colors">
                                            <td className="px-6 py-4 text-[12px] font-bold text-[#64748B]">
                                                #{txn.transactionNumber || txn._id.slice(-6).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[14px] font-Regular text-[#111827]">{txn.partnerName || '--'}</div>
                                                <div className="text-[12px] text-[#94A3B8] capitalize">{txn.partnerType || ''}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-[14px] text-[#111827]">
                                                {TYPE_LABELS[txn.type] || txn.type || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {formatDate(txn.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] font-semibold text-[#111827]">
                                                {formatAmount(txn.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {txn.type === 'commission_payment' && txn.orderIds?.length > 0 ? (
                                                    <button
                                                        onClick={() => txn.orderIds.length === 1
                                                            ? setSelectedOrderId(txn.orderIds[0])
                                                            : setOrderPickerTxn(txn)
                                                        }
                                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <button disabled className="w-8 h-8 flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && transactions.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-[#E2E8F0]">
                        <p className="text-[14px] text-[#64748B]">
                            Showing {showingFrom} to {showingTo} of {totalCount} Transactions
                        </p>
                        {renderPageButtons()}
                    </div>
                )}
            </div>

            {/* Order picker modal — for commission with multiple orders */}
            {orderPickerTxn && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[16px] w-full max-w-[400px] shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[16px] font-bold text-[#0F172A]">Select Order</h2>
                            <button onClick={() => setOrderPickerTxn(null)} className="text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[13px] text-[#64748B] mb-4">This commission covers {orderPickerTxn.orderIds.length} orders. Select one to view details.</p>
                        <div className="space-y-2">
                            {orderPickerTxn.orderIds.map((orderId, idx) => (
                                <button
                                    key={orderId}
                                    onClick={() => { setSelectedOrderId(orderId); setOrderPickerTxn(null); }}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-[#E2E8F0] rounded-[10px] hover:border-[#FDC63A] hover:bg-amber-50/40 transition-all cursor-pointer"
                                >
                                    <span className="text-[14px] font-semibold text-[#0F172A]">Order {idx + 1}</span>
                                    <span className="text-[12px] text-[#94A3B8]">{orderId.slice(-8).toUpperCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {selectedOrderId && (
                <OrderDetailModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </div>
    );
};

export default PaymentsPage;
