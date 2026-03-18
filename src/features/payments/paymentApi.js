import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

const parseJSON = async (response) => {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Server error (${response.status}): unexpected response`);
    }
};

export const fetchTransactions = async ({ page = 1, limit = 10, search = '', status = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (from) params.set('fromDate', from);
    if (to) params.set('toDate', to);

    const response = await fetch(`${BASE_URL}/transactions?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
    }

    return data.data;
};
