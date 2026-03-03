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
