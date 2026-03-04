import { BASE_URL } from '../../config/api';

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const fetchVehicles = async () => {
    const response = await fetch(`${BASE_URL}/vehicles`, {
        method: 'GET',
        headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch vehicles');
    return data.data;
};

export const approveOrder = async (id) => {
    const response = await fetch(`${BASE_URL}/orders/manage/${id}/approve`, {
        method: 'PATCH',
        headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to approve order');
    return data;
};

export const rejectOrder = async (id) => {
    const response = await fetch(`${BASE_URL}/orders/manage/${id}/reject`, {
        method: 'PATCH',
        headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to reject order');
    return data;
};

export const changeOrderVehicle = async (id, vehicleId) => {
    const response = await fetch(`${BASE_URL}/orders/manage/${id}/vehicle`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ vehicleId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update vehicle');
    return data;
};
