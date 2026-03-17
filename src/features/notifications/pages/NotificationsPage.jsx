import { useEffect, useState, useCallback } from 'react';
import { fetchNotifications, markAllAsRead } from '../notificationApi';

const LIMIT = 20;

const TYPE_CONFIG = {
    new_order: { icon: '📦', bg: 'bg-blue-50', accent: 'text-blue-600' },
    order_update: { icon: '🔄', bg: 'bg-sky-50', accent: 'text-sky-600' },
    broadcast: { icon: '📢', bg: 'bg-amber-50', accent: 'text-amber-600' },
    partner_registration: { icon: '👤', bg: 'bg-purple-50', accent: 'text-purple-600' },
    review: { icon: '⭐', bg: 'bg-yellow-50', accent: 'text-yellow-600' },
    system: { icon: '⚙️', bg: 'bg-slate-50', accent: 'text-slate-600' },
};

const getTypeConfig = (type) => TYPE_CONFIG[type] || { icon: '🔔', bg: 'bg-slate-50', accent: 'text-slate-600' };

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [markingRead, setMarkingRead] = useState(false);

    const loadNotifications = useCallback(async (p) => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchNotifications({ page: p, limit: LIMIT });
            setNotifications(data.notifications);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications(page);
    }, [page, loadNotifications]);

    const handleMarkAllRead = async () => {
        setMarkingRead(true);
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            setError(err.message);
        } finally {
            setMarkingRead(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const { totalPages, currentPage, totalItems } = pagination;
    const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * LIMIT + 1;
    const showingTo = Math.min(currentPage * LIMIT, totalItems);

    const renderPageButtons = () => {
        const maxVisible = 3;
        let start = Math.max(1, currentPage - 1);
        const end = Math.min(totalPages, start + maxVisible - 1);
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
                <div>
                    <h1 className="text-[22px] font-bold text-[#0F172A]">Notifications</h1>
                    <p className="text-[14px] text-[#64748B] mt-0.5">
                        {totalItems} notification{totalItems !== 1 ? 's' : ''}
                        {unreadCount > 0 && <span className="text-[#FDC63A] font-semibold"> · {unreadCount} unread</span>}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingRead}
                        className="px-4 py-2 bg-[#FDC63A] text-[#0F172A] text-[14px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {markingRead ? 'Marking...' : 'Mark all as Read'}
                    </button>
                )}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Notification list */}
            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-[12px] border border-[#F1F5F9] p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="w-48 h-4 bg-slate-100 animate-pulse rounded" />
                                <div className="w-full h-3 bg-slate-100 animate-pulse rounded" />
                                <div className="w-20 h-3 bg-slate-100 animate-pulse rounded" />
                            </div>
                        </div>
                    ))
                ) : notifications.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-[40px] mb-3">🔔</p>
                        <p className="text-[#94A3B8] text-[15px] font-medium">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const config = getTypeConfig(notification.type);
                        return (
                            <div
                                key={notification._id}
                                className={`rounded-[12px] border p-5 flex items-start gap-4 transition-colors ${
                                    notification.isRead
                                        ? 'bg-white border-[#F1F5F9]'
                                        : 'bg-[#FFFBEB] border-[#FDE68A]/50'
                                }`}
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                    <span className="text-[18px]">{config.icon}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className={`text-[15px] font-bold ${notification.isRead ? 'text-[#475569]' : 'text-[#0F172A]'}`}>
                                            {notification.title}
                                        </p>
                                        {!notification.isRead && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#FDC63A] flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">{notification.message}</p>
                                    <p className="text-[12px] text-[#94A3B8] mt-2">{timeAgo(notification.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!loading && notifications.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-[14px] text-[#64748B]">
                        Showing {showingFrom} to {showingTo} of {totalItems} Notifications
                    </p>
                    {renderPageButtons()}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
