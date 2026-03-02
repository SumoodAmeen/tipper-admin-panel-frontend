import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../../assets/auth/auth_background.jpg';
import logo from '../../../assets/common/logo.png';
import profileIcon from '../../../assets/auth/profile_icon.png';
import lockIcon from '../../../assets/auth/lock_icon.png';
import { adminLogin } from '../authApi';
import { useAuth } from '../AuthContext';

const LoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await adminLogin(identifier, password);
            login(data.data.accessToken);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setIdentifier('');
        setPassword('');
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Login Card */}
            <div className="bg-[#FFFFFF] rounded-[12px] px-[32px] py-[51px] w-[90%] max-w-[400px] shadow-2xl relative z-10 flex flex-col border border-[#E2E8F033]">

                {/* Logo block */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-[#FFCC29] p-0 rounded-[20px] mb-5 flex items-center justify-center shadow-sm">
                        <img
                            src={logo}
                            alt="Tipper App Logo"
                            className="w-[96px] h-[96px] object-contain"
                        />
                    </div>
                    <h1 className="text-[24px] font-bold text-[#0F172A] leading-tight text-center mb-3">Tipper App</h1>
                    <p className="text-[#0F172A] font-semibold text-[16px] mt-1.5 text-center">Admin Login</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Username Field */}
                    <div className="space-y-3 flex flex-col">
                        <label className="text-[14px] font-bold text-[#334155]">
                            Username
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <img src={profileIcon} alt="identifier icon" className="h-[15px] w-[15px] object-contain" />
                            </div>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter identifier"
                                className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#FFCC29]/50 focus:border-[#FFCC29] transition-colors bg-white placeholder:text-[#94a3b8] text-[16px] font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5 flex flex-col">
                        <label className="text-[14px] font-bold text-[#334155]">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <img src={lockIcon} alt="password icon" className="h-[18px] w-[18px] object-contain" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2.5 border text-[16px] border-[#e2e8f0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#FFCC29]/50 focus:border-[#FFCC29] transition-colors bg-white placeholder:text-[#94a3b8] tracking-[0.2em] font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-red-500 text-[13px] font-medium text-center">{error}</p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={loading}
                            className="flex-1 py-[14px] px-[56.5px] bg-[#F1F5F9] text-[#475569] text-[16px] font-bold rounded-[8px] hover:bg-[#e2e8f0] transition-colors disabled:opacity-50"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-[14px] px-[56.5px] bg-[#FDC63A] text-[#0F172A] text-[16px] font-bold rounded-[8px] hover:bg-[#fbbf24] transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
