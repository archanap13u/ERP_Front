import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AnnouncementPopup from "../components/AnnouncementPopup";

export default function DeskLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [authorized, setAuthorized] = useState(!!localStorage.getItem('user_role'));

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        if (!role) {
            navigate('/login');
            return;
        }

        // --- STRICT STAFF ISOLATION ---
        // Prevent Employees from reaching administrative dashboards or list views
        const isEmployee = role === 'Employee';
        const path = location.pathname;

        const adminDashboards = ['/hr', '/organization-dashboard', '/finance', '/ops-dashboard', '/superadmin', '/department/'];
        const adminLists = ['/employee', '/student', '/studycenter', '/program', '/university', '/jobopening', '/salesinvoice', '/paymententry', '/expenseclaim', '/attendance'];

        // Exception: Allowed for employees if it's their dashboard or notifications
        const isAllowedPath = path === '/employee-dashboard' || path === '/notifications' || path === '/login';
        // Exception: Allowed to view OWN profile if we decide to implement that path, 
        // but for now, keep them on the dashboard.

        if (isEmployee && !isAllowedPath) {
            const isTryingToAccessAdmin = adminDashboards.some(d => path.startsWith(d)) ||
                adminLists.some(l => path === l || path.startsWith(l + '/'));

            // If they are on a generic record page, they might be filing a complaint or viewing a holiday.
            // We'll allow specific paths like /complaint/new or /holiday
            const isActionPath = path.startsWith('/complaint') || path.startsWith('/holiday') || path.startsWith('/attendance');

            if (isTryingToAccessAdmin && !isActionPath) {
                console.warn(`[Security] 🛡️ Sandbox Breach Blocked: Employee tried to access ${path}`);
                navigate('/employee-dashboard');
            }
        }
    }, [navigate, location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden">
            <Navbar />
            <div className="flex flex-1 pt-12">
                <Sidebar />
                <main className="flex-1 ml-60 overflow-y-auto px-12 py-8 bg-[#f4f5f6]">
                    <AnnouncementPopup />
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
