import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const fetchNotifications = async ({ page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    const response = await fetch(`${BASE_URL}/notifications?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
    }

    return data.data;
};

export const markAllAsRead = async () => {
    const response = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notifications as read');
    }

    return data;
};
