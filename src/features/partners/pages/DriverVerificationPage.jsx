import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingVerifications, approveDriverVerification } from '../partnerApi';
import { getMediaUrl } from '../../../config/api';

const LIMIT = 12;

const getInitials = (name) =>
    name
        ?.split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';

const DriverVerificationPage = () => {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState('');

    useEffect(() => {
        const load = () => {
            setLoading(true);
            fetchPendingVerifications({ page, limit: LIMIT })
                .then((data) => {
                    setDrivers(data.drivers);
                    setPagination(data.pagination);
                })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        };
        load();
        const interval = setInterval(load, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [page]);

    const handleApprove = async () => {
        setApproving(true);
        setApproveError('');
        try {
            await approveDriverVerification(selectedDriver._id);
            setDrivers((prev) => prev.filter((d) => d._id !== selectedDriver._id));
            setPagination((prev) => ({ ...prev, totalCount: prev.totalCount - 1 }));
            setSelectedDriver(null);
        } catch (err) {
            setApproveError(err.message);
        } finally {
            setApproving(false);
        }
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[30px] font-bold text-[#0F172A]">Driver Verification</h1>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Grid */}
            <div className="grid grid-cols-4 gap-5">
                {loading ? (
                    Array.from({ length: LIMIT }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[16px] border border-[#F1F5F9] p-5 flex flex-col items-center gap-3">
                            <div className="w-[120px] h-[120px] bg-slate-100 animate-pulse rounded-[12px]" />
                            <div className="w-24 h-4 bg-slate-100 animate-pulse rounded" />
                            <div className="w-32 h-3 bg-slate-100 animate-pulse rounded" />
                            <div className="w-full h-9 bg-slate-100 animate-pulse rounded-[8px]" />
                        </div>
                    ))
                ) : drivers.length === 0 ? (
                    <div className="col-span-4 py-16 text-center text-[#94A3B8] text-sm">
                        No pending verifications
                    </div>
                ) : (
                    drivers.map((driver) => {
                        const photoUrl = getMediaUrl(driver.photo);
                        return (
                            <div
                                key={driver._id}
                                className="bg-white rounded-[16px] border border-[#F1F5F9] p-5 flex flex-col items-center gap-3"
                            >
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt={driver.name}
                                        className="w-[120px] h-[120px] object-cover rounded-[12px]"
                                    />
                                ) : (
                                    <div className="w-[120px] h-[120px] rounded-[12px] bg-amber-100 flex items-center justify-center text-[#0F172A] text-[32px] font-bold">
                                        {getInitials(driver.name)}
                                    </div>
                                )}
                                <p className="text-[18px] font-bold text-[#0F172A] text-center">{driver.name}</p>
                                <p className="text-[12px] text-[#334155]">Partner ID : #{driver.uniqueId}</p>
                                <button
                                    onClick={() => {
                                        setSelectedDriver(driver);
                                        setApproveError('');
                                    }}
                                    className="w-full py-2 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors uppercase tracking-wide cursor-pointer"
                                >
                                    Verify
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!loading && drivers.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-[14px] text-[#64748B]">
                        Showing {showingFrom} to {showingTo} of {totalCount} Drivers
                    </p>
                    {renderPageButtons()}
                </div>
            )}

            {/* Verification Modal */}
            {selectedDriver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[20px] w-full max-w-[660px] shadow-2xl p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[18px] font-bold text-[#0F172A]">Verify Driver Partner</h2>
                            <button
                                onClick={() => setSelectedDriver(null)}
                                className="text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex gap-6 items-start">
                            {/* Left — profile */}
                            <div className="flex flex-col items-center gap-3 min-w-[160px]">
                                {getMediaUrl(selectedDriver.photo) ? (
                                    <img
                                        src={getMediaUrl(selectedDriver.photo)}
                                        alt={selectedDriver.name}
                                        className="w-[140px] h-[140px] object-cover rounded-full border-4 border-[#F1F5F9]"
                                    />
                                ) : (
                                    <div className="w-[140px] h-[140px] rounded-full border-4 border-[#F1F5F9] bg-amber-100 flex items-center justify-center text-[#0F172A] text-[36px] font-bold">
                                        {getInitials(selectedDriver.name)}
                                    </div>
                                )}
                                <p className="text-[16px] font-bold text-[#0F172A] text-center">{selectedDriver.name}</p>
                                <span className="px-3 py-1 bg-slate-100 text-[#475569] text-[12px] font-semibold rounded-full">
                                    ID : #{selectedDriver.uniqueId}
                                </span>
                            </div>

                            {/* Right — selfie */}
                            <div className="flex-1">
                                <p className="text-[13px] font-semibold text-[#475569] mb-3">Driver Uploaded Selfie</p>
                                {getMediaUrl(selectedDriver.verification?.selfie) ? (
                                    <img
                                        src={getMediaUrl(selectedDriver.verification.selfie)}
                                        alt="Selfie"
                                        className="w-full h-[260px] object-cover rounded-[12px] border border-[#F1F5F9]"
                                    />
                                ) : (
                                    <div className="w-full h-[260px] rounded-[12px] bg-slate-100 flex items-center justify-center text-[#94A3B8] text-sm">
                                        No selfie available
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-[12px] text-[#94A3B8] text-center mt-5">
                            Please ensure the face matches the profile photo and identification documents.
                        </p>

                        {approveError && (
                            <p className="text-red-500 text-[13px] text-center mt-3">{approveError}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => {
                                    const id = selectedDriver._id;
                                    setSelectedDriver(null);
                                    navigate(`/partner-management/${id}`);
                                }}
                                className="flex-1 py-3 border border-[#E2E8F0] text-[#475569] text-[14px] font-semibold rounded-[10px] hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                View Full Details
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={approving}
                                className="flex-1 py-3 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[10px] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                {approving ? 'Approving...' : 'Approve Driver'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverVerificationPage;
