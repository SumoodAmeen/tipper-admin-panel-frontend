import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth';
import { AuthProvider } from '../features/auth/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import PartnerManagementPage from '../features/partners/pages/PartnerManagementPage';
import CustomerManagementPage from '../features/customers/pages/CustomerManagementPage';
import OrderManagementPage from '../features/orders/pages/OrderManagementPage';
import PromotionsPage from '../features/promotions/pages/PromotionsPage';
import BidManagementPage from '../features/bids/pages/BidManagementPage';
import PartnerDetailPage from '../features/partners/pages/PartnerDetailPage';
import CustomerDetailPage from '../features/customers/pages/CustomerDetailPage';
import DriverVerificationPage from '../features/partners/pages/DriverVerificationPage';
import SupportPage from '../features/support/pages/SupportPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import PaymentsPage from '../features/payments/pages/PaymentsPage';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected admin routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/partner-management" element={<PartnerManagementPage />} />
                            <Route path="/partner-management/:id" element={<PartnerDetailPage />} />
                            <Route path="/customer-management" element={<CustomerManagementPage />} />
                            <Route path="/customer-management/:id" element={<CustomerDetailPage />} />
                            <Route path="/order-management" element={<OrderManagementPage />} />
                            <Route path="/promotions" element={<PromotionsPage />} />
                            <Route path="/bid-management" element={<BidManagementPage />} />
                            <Route path="/driver-verification" element={<DriverVerificationPage />} />
                            <Route path="/support" element={<SupportPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/payments" element={<PaymentsPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRouter;
