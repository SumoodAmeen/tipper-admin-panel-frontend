import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../customerApi';
import excelIcon from '../../../assets/customer/excel.png';

const STATUS_CONFIG = {
    Active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-600' },
    Blocked: { label: 'Blocked', bg: 'bg-red-50', text: 'text-red-500' },
    Deleted: { label: 'Deleted', bg: 'bg-slate-100', text: 'text-slate-500' },
    Inactive: { label: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-500' },
};

const TABLE_COLS = ['CUSTOMER ID', 'NAME', 'MOBILE NUMBER', 'ORDERS', 'CREATED DATE', 'STATUS', 'ACTION'];

const LIMIT = 10;

const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd} - ${mm} - ${yyyy}`;
};

const getCustomerId = (user) => {
    if (user.uniqueId) return `#${user.uniqueId}`;
    return `#CUST-${user._id.slice(-4).toUpperCase()}`;
};

const CustomerManagementPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setLoading(true);
        fetchCustomers({ page, limit: LIMIT, search, status, from, to })
            .then((data) => {
                setCustomers(data.users);
                setPagination(data.pagination);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
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
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[30px] font-bold text-[#0F172A]">Customer Management</h1>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors cursor-pointer">
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
                        placeholder="Search by Customer ID, Name, or Mobile N..."
                        className="w-[364px] pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#475569] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white"
                    />
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
                        className={`pl-9 pr-3 py-2.5 border border-[#E2E8F0] w-[166px] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white ${from ? 'text-[#475569]' : 'text-[#6B7280]'}`}
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
                        className={`pl-9 pr-3 py-2.5 border border-[#E2E8F0] w-[166px] rounded-[8px] text-[14px] focus:outline-none  focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white ${to ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                    />
                </div>

                {/* Status dropdown */}
                <div className="relative">
                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className={`appearance-none pl-4 pr-9 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FDC63A]/50 focus:border-[#FDC63A] bg-white w-[166px] cursor-pointer ${status ? 'text-[#475569]' : 'text-[#6B7280]'}`}
                    >
                        <option value="">All</option>
                        <option value="Active">Active</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Deleted">Deleted</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[12px] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#E2E8F0]">
                                {TABLE_COLS.map((col) => (
                                    <th
                                        key={col}
                                        className="px-6 py-3 text-left text-[12px] font-bold text-[#64748B] tracking-widest uppercase"
                                    >
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
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-[#94A3B8] text-sm">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => {
                                    const statusCfg = STATUS_CONFIG[customer.status] || {
                                        label: customer.status || '--',
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-500',
                                    };
                                    return (
                                        <tr key={customer._id} className="hover:bg-[#FAFAFA] transition-colors">
                                            <td className="px-6 py-4 text-[14px] font-bold text-[#0F172A]">
                                                {getCustomerId(customer)}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {customer.fullName || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {customer.phone ? `+91 ${customer.phone.slice(0, 5)} ${customer.phone.slice(5)}` : '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {customer.totalOrders ?? '--'}
                                            </td>
                                            <td className="px-6 py-4 text-[14px] text-[#475569]">
                                                {formatDate(customer.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/customer-management/${customer._id}`)}
                                                    className="px-4 py-1.5 bg-[#FDC63A] text-[#1C180C] text-[12px] font-bold rounded-[6px] hover:bg-[#fbbf24] transition-colors cursor-pointer"
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
                {!loading && customers.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-[#E2E8F0]">
                        <p className="text-[14px] text-[#64748B]">
                            Showing {showingFrom} to {showingTo} of {totalCount} Customers
                        </p>
                        {renderPageButtons()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerManagementPage;
