import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const fetchAdminDashboard = async () => {
    const response = await fetch(`${BASE_URL}/orders/manage/admin-dashboard`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard');
    }

    return data.data;
};

export const fetchOrderOverview = async () => {
    const response = await fetch(`${BASE_URL}/orders/manage/overview`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
    }

    return data.data;
};
