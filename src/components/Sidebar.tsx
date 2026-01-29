import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    School,
    Building2,
    BookOpen,
    GraduationCap,
    FileCheck,
    Settings,
    Grid,
    Users,
    LogOut,
    Megaphone,
    TrendingUp,
    BadgeDollarSign,
    CreditCard,
    Receipt,
    FileText,
    CalendarDays,
    UserCheck,
    Shield,
    Activity,
    ArrowLeftRight,
    Bell,
    ClipboardList,
    Clock,
    Award,
    ListTodo
} from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [role, setRole] = useState<string | null>(localStorage.getItem('user_role'));
    const [deptId, setDeptId] = useState<string | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [deptFeatures, setDeptFeatures] = useState<string[]>([]);
    const [panelType, setPanelType] = useState<string | null>(localStorage.getItem('department_panel_type'));

    useEffect(() => {
        const currentRole = localStorage.getItem('user_role');
        const storedOrgId = localStorage.getItem('organization_id');
        const currentOrgId = (storedOrgId === 'null' || storedOrgId === 'undefined') ? null : storedOrgId;
        const currentDeptId = localStorage.getItem('department_id');
        const currentPanelType = localStorage.getItem('department_panel_type');
        const storedFeatures = localStorage.getItem('user_features');
        setRole(currentRole);
        setDeptId(currentDeptId);
        setPanelType(currentPanelType);

        // Determine if we should fetch features for a specific department from the URL
        const pathParts = location.pathname.split('/');
        const urlDeptId = pathParts.includes('department') ? pathParts[pathParts.indexOf('department') + 1] : null;
        const targetDeptId = urlDeptId || currentDeptId;

        // If features are in localStorage (set during login), use them as initial state
        if (storedFeatures && !urlDeptId) {
            try {
                setDeptFeatures(JSON.parse(storedFeatures));
            } catch (e) {
                console.error('Error parsing user_features:', e);
            }
        }

        // Fetch features for the specific department (either from URL or from user session)
        if (targetDeptId && currentOrgId) {
            console.log('[Sidebar] Fetching features for target dept:', targetDeptId);
            fetch(`/api/resource/department/${targetDeptId}?organizationId=${currentOrgId}`)
                .then(res => res.json())
                .then(json => {
                    const features = json.data?.features || [];
                    console.log('[Sidebar] Loaded features:', features);
                    setDeptFeatures(features);
                    // Update localStorage ONLY if it was the session department
                    if (targetDeptId === currentDeptId) {
                        localStorage.setItem('user_features', JSON.stringify(features));
                    }
                })
                .catch(err => console.error('[Sidebar] Error fetching features:', err));
        }

        const isAllowedToSeeDepts = currentRole === 'OrganizationAdmin' || currentRole === 'HR' || currentRole === 'Operations';
        if (isAllowedToSeeDepts && currentOrgId) {
            fetch(`/api/resource/department?organizationId=${currentOrgId}`)
                .then(res => res.json())
                .then(json => setDepartments(json.data || []));
        }
    }, [location.pathname]); // Re-run when path changes to catch department jumps

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const allMenuItems = [
        // Core Dashboard Items (Role based, generally always visible for the role)
        {
            icon: LayoutDashboard,
            label: role === 'Employee' ? 'Staff Portal' : 'Dashboard',
            href: role === 'Employee' ? '/employee-dashboard' :
                (role === 'Operations' || panelType === 'Operations' || panelType === 'Education') ? '/ops-dashboard' :
                    (role === 'HR' || panelType === 'HR') ? '/hr' :
                        (role === 'Finance' || panelType === 'Finance') ? '/finance' :
                            '/employee-dashboard',
            roles: ['Employee', 'DepartmentAdmin', 'HR', 'Operations', 'Finance', 'Inventory', 'CRM', 'Projects', 'Support', 'Assets']
        },
        { icon: UserCheck, label: 'Staff Portal', href: '/employee-dashboard', roles: ['HR', 'Operations', 'Finance', 'DepartmentAdmin'] },
        { icon: LayoutDashboard, label: 'Student Portal', href: '/student-dashboard', roles: ['Student'] },
        // LMS Student Links
        { icon: Clock, label: 'Exams', href: '/student/exams', roles: ['Student'] },
        { icon: Award, label: 'Results', href: '/student/results', roles: ['Student'] },
        { icon: BookOpen, label: 'My Courses', href: '/student/courses', roles: ['Student'] },

        { icon: LayoutDashboard, label: 'Org Dashboard', href: '/organization-dashboard', roles: ['OrganizationAdmin'] },
        { icon: LayoutDashboard, label: 'Center Dashboard', href: '/center-dashboard', roles: ['StudyCenter'] },
        { icon: Settings, label: 'Customize Departments', href: '/organization/departments', roles: ['OrganizationAdmin'] },
        { icon: LayoutDashboard, label: 'Department Panel', href: `/department/${deptId}`, roles: ['DepartmentAdmin'] },
        { icon: ListTodo, label: 'Task Management', href: '/task', roles: ['DepartmentAdmin', 'HR', 'Operations', 'Finance'] },

        // HR & Employee Management
        { icon: Users, label: 'HR Workspace', href: '/hr', roles: ['HR'], feature: 'HR Dashboard' },
        { icon: ClipboardList, label: 'Employee List', href: '/employee', roles: ['HR'], feature: 'Employee List' },
        { icon: UserCheck, label: 'Add Employee', href: '/employee/new', roles: ['HR'], feature: 'Add Employee' },
        { icon: Building2, label: 'Post Vacancy', href: '/jobopening', roles: ['HR'], feature: 'Post Vacancy' },
        { icon: ArrowLeftRight, label: 'Employee Transfer', href: '/employee-transfer', roles: ['HR'], feature: 'Employee Transfer' },
        { icon: Users, label: 'Employee Lifecycle', href: '/employee-lifecycle', roles: ['HR'], feature: 'Employee Lifecycle' },

        { icon: GraduationCap, label: 'STUDENTS', href: (role === 'Finance' || panelType === 'Finance' || role?.includes('Admin')) ? '/finance-students' : '/student', roles: ['HR', 'Operations', 'StudyCenter', 'Finance', 'SuperAdmin'], feature: 'STUDENTS' },
        { icon: Megaphone, label: 'Complaints', href: '/complaint', roles: ['HR'], feature: 'Employee Complaints' },
        { icon: School, label: 'Holidays', href: '/holiday', roles: ['HR', 'Operations'], feature: 'Holidays' },
        { icon: Megaphone, label: 'Notice Board', href: '/announcement', roles: ['HR', 'Student'], feature: 'Announcements' },
        { icon: TrendingUp, label: 'Performance', href: '/performancereview', roles: ['HR'], feature: 'Performance' },
        { icon: CalendarDays, label: 'Attendance', href: '/attendance', roles: ['HR', 'Employee'], feature: 'Attendance' },

        // Finance
        { icon: BadgeDollarSign, label: 'Finance Workspace', href: '/finance', roles: ['Finance'], feature: 'Finance Dashboard' },
        { icon: FileText, label: 'Invoices', href: '/salesinvoice', roles: ['Finance'], feature: 'Invoices' },
        { icon: CreditCard, label: 'Payments', href: '/paymententry', roles: ['Finance'], feature: 'Payments' },
        { icon: Receipt, label: 'Expenses', href: '/expenseclaim', roles: ['Finance'], feature: 'Expenses' },
        { icon: BookOpen, label: 'General Ledger', href: '/ledger', roles: ['Finance'], feature: 'General Ledger' },
        { icon: FileText, label: 'Taxation', href: '/taxation', roles: ['Finance'], feature: 'Taxation' },

        // Operations
        { icon: School, label: 'Universities', href: '/university', roles: ['Operations'], feature: 'University' },
        { icon: Building2, label: 'Study Centers', href: '/studycenter', roles: ['Operations'], feature: 'Study Center' },
        { icon: GraduationCap, label: 'Programs', href: '/program', roles: ['Operations'], feature: 'Programs' },
        { icon: ClipboardList, label: 'APPLICATIONS', href: '/student', roles: ['Operations'], feature: 'APPLICATIONS' },
        { icon: UserCheck, label: 'Internal Marks', href: '/internalmark', roles: ['Operations', 'StudyCenter'], feature: 'Internal Marks' },

        // CRM & Sales
        { icon: Megaphone, label: 'Leads', href: '/lead', roles: ['CRM'], feature: 'Leads' },
        { icon: BadgeDollarSign, label: 'Deals', href: '/deal', roles: ['CRM'], feature: 'Deals' },
        { icon: Users, label: 'Customers', href: '/customer', roles: ['CRM'], feature: 'Customers' },
        { icon: FileText, label: 'Quotations', href: '/quotation', roles: ['CRM'], feature: 'Quotations' },
        { icon: FileText, label: 'Sales Orders', href: '/salesorder', roles: ['CRM'], feature: 'Sales Orders' },

        // Inventory
        { icon: Grid, label: 'Items', href: '/item', roles: ['Inventory'], feature: 'Item Management' },
        { icon: Building2, label: 'Suppliers', href: '/supplier', roles: ['Inventory'], feature: 'Suppliers' },
        { icon: Receipt, label: 'Purchase Receipts', href: '/purchase-receipt', roles: ['Inventory'], feature: 'Purchase Receipt' },
        { icon: FileText, label: 'Stock Entries', href: '/stockentry', roles: ['Inventory'], feature: 'Stock Entry' },
        { icon: Building2, label: 'Warehouses', href: '/warehouse', roles: ['Inventory'], feature: 'Warehouses' },

        // Projects
        { icon: FileText, label: 'Projects', href: '/project', roles: ['Projects'], feature: 'Projects' },
        { icon: ClipboardList, label: 'Tasks', href: '/task', roles: ['Projects', 'HR', 'Operations', 'Finance', 'DepartmentAdmin', 'Employee'], feature: 'Tasks' },
        { icon: CalendarDays, label: 'Timesheets', href: '/timesheet', roles: ['Projects'], feature: 'Timesheets' },

        // HR & Management (Universal)
        { icon: CalendarDays, label: 'Leave Requests', href: '/leaverequest', roles: ['DepartmentAdmin', 'HR', 'Operations', 'SuperAdmin', 'OrganizationAdmin', 'Finance', 'Inventory', 'CRM', 'Support', 'Assets', 'Projects', 'HeadOfDepartment', 'HumanResources'] },

        // Support
        { icon: Shield, label: 'Tickets', href: '/ticket', roles: ['Support'], feature: 'Tickets' },
        { icon: Activity, label: 'Issues', href: '/issue', roles: ['Support'], feature: 'Issues' },

        // Assets
        { icon: BadgeDollarSign, label: 'Assets', href: '/asset', roles: ['Assets'], feature: 'Asset Tracking' },

        // Shared
        { icon: Bell, label: 'Notifications', href: '/notifications', roles: ['Employee', 'DepartmentAdmin', 'Operations', 'Finance', 'Inventory', 'CRM', 'Projects', 'Support', 'Assets', 'StudyCenter', 'OrganizationAdmin', 'Student'] },
    ];

    // Total hard sandbox for employees
    if (role === 'Employee') {
        const staffPortal = allMenuItems.find(i => i.label === 'Staff Portal');
        const notifications = allMenuItems.find(i => i.label === 'Notifications');
        // Manually adding Leave Request link for Employees since it might not be in the filtered list yet
        const leaveRequests = { icon: CalendarDays, label: 'My Leave Requests', href: '/leaverequest', roles: ['Employee'] };
        const items = [];
        if (staffPortal) items.push(staffPortal);
        items.push(leaveRequests);
        if (notifications) items.push(notifications);

        return (
            <div className="w-60 h-screen bg-[#f4f5f6] border-r border-[#d1d8dd] flex flex-col fixed left-0 top-0 z-50 overflow-y-auto">
                <div className="p-4 pt-16 flex-1">
                    <div className="text-[11px] font-bold text-[#8d99a6] uppercase tracking-wider mb-4 px-3 flex items-center justify-between">
                        <span>Staff View</span>
                    </div>
                    <nav className="space-y-1">
                        {items.map((item, index) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={index}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded text-[#1d2129] hover:bg-[#ebedef] transition-colors no-underline ${isActive ? 'bg-white shadow-sm font-bold border-l-2 border-blue-600 pl-[10px]' : 'bg-transparent'}`}
                                >
                                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[13px]">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-[#d1d8dd]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                        <LogOut size={16} />
                        <span className="text-[13px]">Logout</span>
                    </button>
                </div>
            </div>
        );
    }

    const filteredItems = allMenuItems.filter(item => {
        // 1. Basic Role Check (if roles are specified)
        const roleAllowed = !item.roles || item.roles.length === 0 || (role && item.roles.includes(role));

        // --- STRICT STAFF ISOLATION ---
        // If the user is a standard Employee, they MUST ONLY see their Portal and Notifications.
        if (role === 'Employee') {
            const staffWhitelist = ['Staff Portal', 'Notifications', 'Tasks', 'My Leave Requests'];
            return staffWhitelist.includes(item.label) && roleAllowed;
        }

        if (!roleAllowed && role !== 'DepartmentAdmin') return false;

        // 2. Strict Feature Check for Department Admin/Customized Panels
        // EXCEPTION: Standard Employees should NOT inherit their department's admin features
        if ((role === 'DepartmentAdmin' || (deptFeatures && deptFeatures.length > 0)) && role !== 'Employee') {
            // Always show basic navigation items (Dashboard, Notifications, Task Management)
            const alwaysShowForDeptAdmin = ['Task Management', 'Tasks', 'Leave Requests'];
            if (!item.feature || (role === 'DepartmentAdmin' && alwaysShowForDeptAdmin.includes(item.label || ''))) {
                return roleAllowed;
            }

            // --- STAFF PORTAL COMPOUND FEATURE ---
            // If the "Staff Portal" feature is assigned, it enables a bundle of staff management tools
            if (deptFeatures.includes('Staff Portal')) {
                const staffPortalBundle = [
                    'Announcements',
                    'Employee List',
                    'Tasks',
                    'Attendance',
                    'Holidays',
                    'Employee Complaints'
                ];
                if (item.feature && staffPortalBundle.includes(item.feature)) {
                    return true;
                }
            }

            // For other items, strictly check if the feature is in the selected list
            return deptFeatures.includes(item.feature);
        }

        return roleAllowed;
    });

    // Remove duplicates based on label (case-insensitive)
    const uniqueFilteredItems = filteredItems.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.label?.toLowerCase() === item.label?.toLowerCase()
        ))
    );

    return (
        <div className="w-60 h-screen bg-[#f4f5f6] border-r border-[#d1d8dd] flex flex-col fixed left-0 top-0 z-50 overflow-y-auto">
            <div className="p-4 pt-16 flex-1">
                <div className="text-[11px] font-bold text-[#8d99a6] uppercase tracking-wider mb-4 px-3 flex items-center justify-between">
                    <span>{role ? `${role.replace('Admin', '')} View` : 'Navigation'}</span>
                </div>
                <nav className="space-y-1">
                    {uniqueFilteredItems.map((item, index) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={index}
                                to={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded text-[#1d2129] hover:bg-[#ebedef] transition-colors no-underline ${isActive ? 'bg-white shadow-sm font-bold border-l-2 border-blue-600 pl-[10px]' : 'bg-transparent'}`}
                            >
                                <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[13px]">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Contextual Sub-Panels Removed as per request to avoid clutter/leakage */}
            </div>

            <div className="p-4 border-t border-[#d1d8dd]">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                    <LogOut size={16} />
                    <span className="text-[13px]">Logout</span>
                </button>
            </div>
        </div>
    );
}
