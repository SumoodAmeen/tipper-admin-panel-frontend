import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto">
                <Navbar />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
