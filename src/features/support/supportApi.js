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
        throw new Error(`Server error (${response.status}): unexpected response from ${response.url}`);
    }
};

export const searchOrderByNumber = async (orderNumber) => {
    const params = new URLSearchParams({ orderNumber });
    const response = await fetch(`${BASE_URL}/support/orders/search?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search order');
    }

    return data.data;
};

export const fetchTickets = async ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    const response = await fetch(`${BASE_URL}/support/tickets?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tickets');
    }

    return data.data;
};

export const fetchTicketById = async (id) => {
    const response = await fetch(`${BASE_URL}/support/tickets/${id}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ticket');
    }

    return data.data;
};

export const createTicket = async (orderId) => {
    const response = await fetch(`${BASE_URL}/support/tickets`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderId }),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
    }

    return data.data;
};

export const fetchCategories = async () => {
    const response = await fetch(`${BASE_URL}/support/categories`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
    }

    return data.data;
};

export const fetchRatings = async ({ page = 1, limit = 10, search = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${BASE_URL}/ratings/all?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ratings');
    }

    return data.data;
};

export const addSummary = async (ticketId, { supportCategory, customerComplaint, solution }) => {
    const response = await fetch(`${BASE_URL}/support/tickets/${ticketId}/summary`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ supportCategory, customerComplaint, solution }),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to add summary');
    }

    return data;
};

export const updateSummary = async (ticketId, { supportCategory, customerComplaint, solution }) => {
    const response = await fetch(`${BASE_URL}/support/tickets/${ticketId}/summary`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ supportCategory, customerComplaint, solution }),
    });

    const data = await parseJSON(response);

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update summary');
    }

    return data;
};
