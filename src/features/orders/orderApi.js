import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const fetchOrders = async ({ page = 1, limit = 10, search = '', status = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${BASE_URL}/orders/manage/all?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
    }

    return data.data;
};

export const fetchOrderById = async (id) => {
    const response = await fetch(`${BASE_URL}/orders/manage/${id}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch order');
    }

    return data.data;
};

export const cancelOrder = async (id) => {
    const response = await fetch(`${BASE_URL}/orders/manage/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'cancelled' }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
    }

    return data;
};
