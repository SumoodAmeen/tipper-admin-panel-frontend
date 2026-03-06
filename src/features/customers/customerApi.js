import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const fetchCustomers = async ({ page = 1, limit = 10, search = '', status = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${BASE_URL}/profile/manage/users?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customers');
    }

    return data.data;
};

export const fetchCustomerById = async (id) => {
    const response = await fetch(`${BASE_URL}/profile/manage/users/${id}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customer');
    }

    return data.data;
};

export const blockCustomer = async (id, reason) => {
    const response = await fetch(`${BASE_URL}/profile/manage/users/${id}/block`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to block customer');
    }

    return data;
};

export const activateCustomer = async (id) => {
    const response = await fetch(`${BASE_URL}/profile/manage/users/${id}/activate`, {
        method: 'PATCH',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to activate customer');
    }

    return data;
};

export const notifyCustomer = async (id, { title, message }) => {
    const response = await fetch(`${BASE_URL}/profile/manage/users/${id}/notify`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, message }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to send notification');
    }

    return data;
};

export const fetchCustomerOrders = async (userId, { page = 1, limit = 10, search = '', status = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${BASE_URL}/orders/manage/user/${userId}/orders?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customer orders');
    }

    return data.data;
};
