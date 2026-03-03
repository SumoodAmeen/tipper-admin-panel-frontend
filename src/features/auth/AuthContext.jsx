import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('admin_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (accessToken, refreshToken, userData) => {
        localStorage.setItem('admin_token', accessToken);
        if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        localStorage.setItem('admin_user', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
