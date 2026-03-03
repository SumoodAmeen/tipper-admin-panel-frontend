import { BASE_URL } from '../../config/api';

export const adminLogin = async (identifier, password) => {
    const response = await fetch(`${BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }

    return data;
};

export const adminLogout = async (refreshToken) => {
    const response = await fetch(`${BASE_URL}/auth/admin/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Logout failed');
    }

    return data;
};

export const updateProfilePhoto = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${BASE_URL}/admin/my-profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile photo');
    }

    return data;
};
