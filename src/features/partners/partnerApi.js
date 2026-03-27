import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const fetchPartners = async ({ page = 1, limit = 10, search = '', type = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (type) params.set('partnerType', type);
    if (from) params.set('fromDate', from);
    if (to) params.set('toDate', to);

    const response = await fetch(`${BASE_URL}/partner/manage/all?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch partners');
    }

    return data.data;
};

export const fetchPartnerById = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch partner');
    }

    return data.data;
};

export const fetchMaterialById = async (id) => {
    const response = await fetch(`${BASE_URL}/materialCategories/materials/${id}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch material');
    }

    return data.data;
};

export const fetchPartnerMaterials = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}/materials`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch partner materials');
    }

    return data.data.materials;
};

export const notifyPartner = async (id, { title, message }) => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}/notify`, {
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

export const blockPartner = async (id, reason = '') => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}/block`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to block partner');
    }

    return data;
};

export const activatePartner = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}/activate`, {
        method: 'PATCH',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to activate partner');
    }

    return data;
};

export const fetchPendingVerifications = async ({ page = 1, limit = 12 } = {}) => {
    const params = new URLSearchParams({ page, limit });

    const response = await fetch(`${BASE_URL}/partner/manage/drivers/verifications/pending?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch pending verifications');
    }

    return data.data;
};

export const approveDriverVerification = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/drivers/${id}/verification/approve`, {
        method: 'PATCH',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to approve driver');
    }

    return data;
};

export const rejectDriverVerification = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/drivers/${id}/verification/reject`, {
        method: 'PATCH',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to reject driver');
    }

    return data;
};

export const requestVerificationSelfie = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/drivers/${id}/verification/request`, {
        method: 'POST',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to request verification selfie');
    }

    return data;
};

export const fetchPartnerOverview = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}/overview`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch partner overview');
    }

    return data.data;
};

export const trackPartner = async (id) => {
    const response = await fetch(`${BASE_URL}/partner/manage/${id}/track`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch partner location');
    }

    return data.data;
};

export const fetchPartnerOrders = async (partnerId, { page = 1, limit = 10, search = '', status = '', from = '', to = '' } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${BASE_URL}/orders/manage/partner/${partnerId}/orders?${params}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch partner orders');
    }

    return data.data;
};
