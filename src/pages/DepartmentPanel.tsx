
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Workspace from '../components/Workspace';
import { Activity, Shield, Users, FileText, BadgeDollarSign, Receipt, School, BookOpen, UserCheck, CalendarDays, Megaphone, GraduationCap, Building2, ClipboardList, ArrowRight, Edit, Clock, ArrowLeftRight, TrendingUp, CheckCircle2, ListTodo, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import DepartmentStaffManager from '../components/DepartmentStaffManager';
import DepartmentStudentManager from '../components/DepartmentStudentManager';
import ApplicationPanel from '../components/ApplicationPanel';
import DepartmentModal from '../components/DepartmentModal';
import { useNavigate } from 'react-router-dom';

export default function DepartmentPanel() {
    const { id } = useParams();
    const [dept, setDept] = useState<any>(null);
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showCustomizer, setShowCustomizer] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;
        async function fetchDept() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const res = await fetch(`/api/resource/department/${id}?organizationId=${orgId}`);
                const data = await res.json();
                setDept(data.data);

                // Fetch real counts for this department
                const query = `?organizationId=${orgId}&departmentId=${id}`;
                const [resEmp, resAtt, resTask] = await Promise.all([
                    fetch(`/api/resource/employee${query}`),
                    fetch(`/api/resource/attendance${query}`),
                    fetch(`/api/resource/task${query}`)
                ]);
                const [jsonEmp, jsonAtt, jsonTask] = await Promise.all([resEmp.json(), resAtt.json(), resTask.json()]);

                setEmployees(jsonEmp.data || []);
                setTasks(jsonTask.data || []);

                const pendingReview = (jsonTask.data || []).filter((t: any) => t.status === 'Pending Review').length;
                setCounts({
                    employee: jsonEmp.data?.length || 0,
                    attendance: jsonAtt.data?.length || 0,
                    task: (jsonTask.data || []).filter((t: any) => t.status !== 'Completed').length || 0,
                    pendingReview: pendingReview
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchDept();
    }, [id]);

    const handleSaveCustomization = async (updatedData: any) => {
        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/department/${id}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (res.ok) {
                const json = await res.json();
                setDept(json.data);
                setShowCustomizer(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading workspace...</div>;
    if (!dept) return <div className="p-8 text-center text-red-500">Workspace not found.</div>;

    const hasFeature = (f: string) => dept.features?.includes(f);

    // Dynamic Cards Construction
    const masterCards = [];
    const shortcuts = [];
    const summaryItems = [
        { label: 'Assigned Staff', value: loading ? '...' : counts.employee || 0, color: 'text-blue-600', doctype: 'employee' }
    ];

    // HR Features
    if (hasFeature('Attendance')) {
        masterCards.push({
            label: 'Attendance',
            count: '',
            icon: CalendarDays,
            href: '/attendance',
            color: 'bg-emerald-50 text-emerald-600'
        });
        shortcuts.push({ label: 'Mark Attendance', href: '/attendance/new' });
        summaryItems.push({ label: 'Present Today', value: loading ? '...' : counts.attendance || 0, color: 'text-emerald-600', doctype: 'attendance' });
    }
    if (hasFeature('Add Employee')) {
        shortcuts.push({ label: 'Add Employee', href: '/employee/new' });
    }
    if (hasFeature('Employee Transfer')) {
        masterCards.push({
            label: 'Employee Transfer',
            count: '',
            icon: ArrowLeftRight,
            href: '/employee-transfer',
            color: 'bg-blue-50 text-blue-600'
        });
        shortcuts.push({ label: 'Transfer Employee', href: '/employee-transfer' });
    }
    if (hasFeature('Recruitment') || hasFeature('Post Vacancy')) {
        masterCards.push({
            label: 'Recruitment',
            count: '',
            icon: UserCheck,
            href: '/job-opening',
            color: 'bg-purple-50 text-purple-600'
        });
        shortcuts.push({ label: 'Post Job', href: '/job-opening/new' });
    }
    if (hasFeature('Job Application')) {
        masterCards.push({
            label: 'Applications',
            count: '',
            icon: ClipboardList,
            href: '/job-opening',
            color: 'bg-indigo-50 text-indigo-600'
        });
    }
    if (hasFeature('Payroll')) {
        shortcuts.push({ label: 'Process Payroll', href: '/payroll' });
    }
    if (hasFeature('Employee Lifecycle')) shortcuts.push({ label: 'Manage Lifecycle', href: '/employee-lifecycle' });
    if (hasFeature('Shift Management')) shortcuts.push({ label: 'Manage Shifts', href: '/shift-management' });
    if (hasFeature('Holidays')) {
        masterCards.push({ label: 'Holidays', count: '', icon: CalendarDays, href: '/holiday', color: 'bg-orange-50 text-orange-600' });
        const isHR = dept.panelType === 'HR' || /^(Human Resources|HR)$/i.test(dept.name);
        if (isHR) {
            shortcuts.push({ label: 'Add Holiday', href: `/holiday/new?departmentId=${id}&department=${encodeURIComponent(dept.name)}` });
        }
    }
    if (hasFeature('Tasks')) {
        summaryItems.push({ label: 'Review Required', value: loading ? '...' : counts.pendingReview || 0, color: 'text-rose-600', doctype: 'task' });
    }

    if (hasFeature('Announcements')) {
        masterCards.push({ label: 'Announcements', count: '', icon: Megaphone, href: '/announcement', color: 'bg-blue-50 text-blue-600' });
        shortcuts.push({ label: 'Post Announcement', href: '/announcement/new' });
    }
    if (hasFeature('Employee Complaints')) {
        // Only HR should manage complaints from the Department Panel
        const isHR = dept.panelType === 'HR' || /^(Human Resources|HR)$/i.test(dept.name);
        if (isHR) {
            masterCards.push({ label: 'Complaints', count: '', icon: Megaphone, href: '/complaint', color: 'bg-red-50 text-red-600' });
            shortcuts.push({ label: 'Manage Complaints', href: '/complaint' });
        }
    }
    if (hasFeature('Performance')) {
        masterCards.push({ label: 'Performance', count: '', icon: TrendingUp, href: '/performancereview', color: 'bg-indigo-50 text-indigo-600' });
        shortcuts.push({ label: 'Performance Reviews', href: '/performancereview' });
    }

    // Finance Features
    if (hasFeature('Invoices')) {
        masterCards.push({
            label: 'Invoices',
            count: '',
            icon: FileText,
            href: '/salesinvoice',
            color: 'bg-orange-50 text-orange-600'
        });
        shortcuts.push({ label: 'New Invoice', href: '/salesinvoice/new' });
    }
    if (hasFeature('Payments')) {
        masterCards.push({
            label: 'Payments',
            count: '',
            icon: BadgeDollarSign,
            href: '/paymententry',
            color: 'bg-green-50 text-green-600'
        });
        shortcuts.push({ label: 'Record Payment', href: '/paymententry/new' });
    }
    if (hasFeature('Expenses')) {
        masterCards.push({
            label: 'Expenses',
            count: '',
            icon: Receipt,
            href: '/expenseclaim',
            color: 'bg-red-50 text-red-600'
        });
        shortcuts.push({ label: 'File Claim', href: '/expenseclaim/new' });
    }
    if (hasFeature('General Ledger')) masterCards.push({ label: 'General Ledger', count: '', icon: BookOpen, href: '/general-ledger', color: 'bg-gray-50 text-gray-600' });
    if (hasFeature('Taxation')) shortcuts.push({ label: 'Tax Reports', href: '/taxation' });
    if (hasFeature('Quotations')) {
        masterCards.push({ label: 'Quotations', count: '', icon: FileText, href: '/quotation', color: 'bg-indigo-50 text-indigo-600' });
        shortcuts.push({ label: 'New Quotation', href: '/quotation/new' });
    }
    if (hasFeature('Sales Orders')) {
        masterCards.push({ label: 'Sales Orders', count: '', icon: FileText, href: '/salesorder', color: 'bg-blue-50 text-blue-600' });
        shortcuts.push({ label: 'New Sales Order', href: '/salesorder/new' });
    }

    // Operations Features
    if (hasFeature('University')) {
        masterCards.push({ label: 'Universities', count: '', icon: School, href: '/university', color: 'bg-indigo-50 text-indigo-600' });
    }
    if (hasFeature('Study Center')) {
        masterCards.push({ label: 'Study Centers', count: '', icon: BookOpen, href: '/studycenter', color: 'bg-cyan-50 text-cyan-600' });
    }
    if (hasFeature('STUDENTS')) shortcuts.push({ label: 'STUDENTS Directory', href: '/student' });
    if (hasFeature('Programs')) {
        masterCards.push({ label: 'Programs', count: '', icon: GraduationCap, href: '/program', color: 'bg-violet-50 text-violet-600' });
        shortcuts.push({ label: 'Create Program', href: '/program/new' });
    }
    if (hasFeature('APPLICATIONS')) {
        masterCards.push({
            label: 'APPLICATIONS',
            count: '',
            icon: ClipboardList,
            href: '/studentapplicant',
            color: 'bg-blue-50 text-blue-600'
        });
        shortcuts.push({ label: 'Verify Applications', href: '/studentapplicant' });
    }

    // New Modules Logic

    // Inventory
    if (hasFeature('Stock Entry')) {
        masterCards.push({ label: 'Stock Entries', count: '', icon: FileText, href: '/stockentry', color: 'bg-amber-50 text-amber-600' });
        shortcuts.push({ label: 'New Stock Entry', href: '/stockentry/new' });
    }
    if (hasFeature('Delivery Note')) shortcuts.push({ label: 'Create Delivery Note', href: '/deliverynote/new' });
    if (hasFeature('Item Management')) shortcuts.push({ label: 'Add Item', href: '/item/new' });
    if (hasFeature('Purchase Receipt')) shortcuts.push({ label: 'Create Receipt', href: '/purchase-receipt/new' });
    if (hasFeature('Warehouses')) shortcuts.push({ label: 'Manage Warehouses', href: '/warehouse' });
    if (hasFeature('Suppliers')) {
        masterCards.push({ label: 'Suppliers', count: '', icon: Building2, href: '/supplier', color: 'bg-slate-50 text-slate-600' });
        shortcuts.push({ label: 'Add Supplier', href: '/supplier/new' });
    }

    // CRM
    if (hasFeature('Leads')) {
        masterCards.push({ label: 'Leads', count: '', icon: Users, href: '/lead', color: 'bg-blue-50 text-blue-600' });
        shortcuts.push({ label: 'Add Lead', href: '/lead/new' });
    }
    if (hasFeature('Deals')) shortcuts.push({ label: 'New Deal', href: '/deal/new' });
    if (hasFeature('Customers')) masterCards.push({ label: 'Customers', count: '', icon: Users, href: '/customer', color: 'bg-sky-50 text-sky-600' });
    if (hasFeature('Touchpoints')) shortcuts.push({ label: 'Log Touchpoint', href: '/touchpoint' });

    // Projects & Management
    const showTasks = hasFeature('Tasks') || ['HR', 'Operations', 'Finance', 'Projects', 'Custom'].includes(dept.panelType);
    if (hasFeature('Projects')) {
        masterCards.push({ label: 'Projects', count: '', icon: FileText, href: '/project', color: 'bg-pink-50 text-pink-600' });
    }
    if (showTasks) {
        masterCards.push({ label: 'Tasks', count: '', icon: ListTodo, href: '/task', color: 'bg-rose-50 text-rose-600' });
        shortcuts.push({ label: 'Assign Task', href: `/task/new?departmentId=${id}&department=${encodeURIComponent(dept.name)}` });
        summaryItems.push({ label: 'Pending Tasks', value: loading ? '...' : (counts.task || 0), color: 'text-rose-600', doctype: 'task' });
    }
    if (hasFeature('Timesheets')) masterCards.push({ label: 'Timesheets', count: '', icon: CalendarDays, href: '/timesheet', color: 'bg-rose-50 text-rose-600' });
    if (hasFeature('Agile Board')) shortcuts.push({ label: 'Go to Board', href: '/agile-board' });

    // Helpdesk
    if (hasFeature('Tickets')) {
        masterCards.push({ label: 'Support Tickets', count: '', icon: Shield, href: '/ticket', color: 'bg-cyan-50 text-cyan-600' });
        shortcuts.push({ label: 'Raise Ticket', href: '/ticket/new' });
    }
    if (hasFeature('Issues')) masterCards.push({ label: 'Issues', count: '', icon: Activity, href: '/issue', color: 'bg-red-50 text-red-600' });
    if (hasFeature('Warranty Claims')) shortcuts.push({ label: 'Warranty Claims', href: '/warranty' });
    if (hasFeature('Knowledge Base')) shortcuts.push({ label: 'Knowledge Base', href: '/kb' });

    // Assets
    if (hasFeature('Asset Tracking')) {
        masterCards.push({ label: 'Assets', count: '', icon: BadgeDollarSign, href: '/asset', color: 'bg-slate-50 text-slate-600' });
        shortcuts.push({ label: 'Register Asset', href: '/asset/new' });
    }
    if (hasFeature('Maintenance')) masterCards.push({ label: 'Maintenance', count: '', icon: Activity, href: '/maintenance', color: 'bg-yellow-50 text-yellow-600' });
    if (hasFeature('Depreciation')) shortcuts.push({ label: 'View Depreciation', href: '/depreciation' });

    // Generate Dynamic Scope Description
    const getScopeSummary = () => {
        const modules = [];
        const f = dept.features || [];

        if (f.some((x: string) => ['Attendance', 'Recruitment', 'Payroll', 'Employee Lifecycle'].includes(x))) modules.push('HR & Payroll');
        if (f.some((x: string) => ['Invoices', 'Deep', 'General Ledger'].includes(x))) modules.push('Finance');
        if (f.some((x: string) => ['Stock Entry', 'Warehouses', 'Item Management', 'Suppliers'].includes(x))) modules.push('Inventory');
        if (f.some((x: string) => ['Leads', 'Deals', 'Customers'].includes(x))) modules.push('CRM');
        if (f.some((x: string) => ['Projects', 'Tasks', 'Timesheets'].includes(x))) modules.push('Projects');
        if (f.some((x: string) => ['Tickets', 'Issues'].includes(x))) modules.push('Helpdesk');
        if (f.some((x: string) => ['Asset Tracking', 'Maintenance'].includes(x))) modules.push('Assets');
        if (f.some((x: string) => ['University', 'Study Center'].includes(x))) modules.push('Education Ops');

        if (modules.length === 0) return "This workspace has a custom feature set.";
        if (modules.length === 1) return `This workspace is dedicated to ${modules[0]} functions.`;
        return `This workspace handles ${modules.join(', ')} functionalities.`;
    };

    return (
        <div className="space-y-8">
            <Workspace
                title={`${dept.name} Workspace`}
                summaryItems={summaryItems}
                masterCards={masterCards}
                shortcuts={shortcuts}
                onCustomize={() => setShowCustomizer(true)}
            />

            <DepartmentModal
                isOpen={showCustomizer}
                onClose={() => setShowCustomizer(false)}
                onSave={handleSaveCustomization}
                initialData={dept}
                title={`Customize ${dept.name} Workspace`}
            />

            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-start gap-4">
                    <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm shrink-0">
                        <Activity size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[16px] font-bold text-gray-900 mb-2">Functional Scope & Capabilities</h4>
                        <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
                            {dept.description || getScopeSummary()}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {dept.features?.map((f: string) => (
                                <span key={f} className="text-[11px] font-semibold bg-white text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* APPLICATIONS Feature Section */}
                {hasFeature('APPLICATIONS') && (
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-2">
                                    <ClipboardList size={22} className="text-blue-600" />
                                    APPLICATIONS
                                </h3>
                                <p className="text-[13px] text-gray-500 font-bold mt-1">Center Student Verification</p>
                                <p className="text-[12px] text-gray-400">Reviewing student records submitted by study centers.</p>
                            </div>
                            <Link to="/studentapplicant" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                View All Applications <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden p-2">
                            <ApplicationPanel
                                organizationId={localStorage.getItem('organization_id') || undefined}
                                departmentId={id}
                            />
                        </div>
                    </div>
                )}

                {/* Task Management Section */}
                {showTasks && (
                    <div className="space-y-8 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                                        <ListTodo size={20} />
                                    </div>
                                    Task Management
                                </h3>
                                <div className="flex items-center gap-4">
                                    <Link to="/task" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                        View All Tasks <ArrowRight size={14} />
                                    </Link>
                                    <Link
                                        to={`/task/new?departmentId=${id}&department=${encodeURIComponent(dept.name)}`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Assign New Task
                                    </Link>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 uppercase tracking-tighter text-[11px] font-black text-gray-400 bg-gray-50/50">
                                            <th className="px-4 py-3">Task Details</th>
                                            <th className="px-4 py-3">Assigned To</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Priority</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {tasks.slice(0, 10).map((task, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-[13px] font-bold text-gray-700">{task.subject}</p>
                                                        <p className="text-[11px] text-gray-500 line-clamp-1">{task.description || 'No description'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            {task.assignedToName?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-[12px] text-gray-600">{task.assignedToName || 'Unassigned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        task.status === 'Working' || task.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            task.status === 'Pending Review' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                task.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        }`}>
                                                        {task.status || 'Open'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[11px] font-bold ${task.priority === 'High' || task.priority === 'Urgent' ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link to={`/task/${task._id}/edit`} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                        <Edit size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {tasks.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 italic text-[14px]">
                                        No tasks assigned in this department.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Employee List Section */}
                {hasFeature('Employee List') && (
                    <div className="space-y-8 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                        <Users size={20} />
                                    </div>
                                    Staff Directory
                                </h3>
                                <div className="flex items-center gap-4">
                                    <Link to="/employee" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                        View Full List <ArrowRight size={14} />
                                    </Link>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search staff..."
                                            value={employeeSearch}
                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-64"
                                        />
                                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 uppercase tracking-tighter text-[11px] font-black text-gray-400 bg-gray-50/50">
                                            <th className="px-4 py-3">Staff Member</th>
                                            <th className="px-4 py-3">ID</th>
                                            <th className="px-4 py-3">Designation</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {employees
                                            .filter(emp =>
                                            (emp.employeeName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                                                emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                                                emp.designation?.toLowerCase().includes(employeeSearch.toLowerCase()))
                                            )
                                            .slice(0, 10).map((emp, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                                                                {emp.employeeName?.charAt(0)}
                                                            </div>
                                                            <span className="text-[13px] font-bold text-gray-700">{emp.employeeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[12px] text-gray-500 font-medium">{emp.employeeId}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase">
                                                            {emp.designation}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link to={`/employee/${emp._id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                            <Edit size={14} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                {employees.length === 0 && (
                                    <div className="py-12 text-center text-gray-400 italic text-[14px]">
                                        No staff found in this workspace.
                                    </div>
                                )}
                            </div>
                        </div>

                        <DepartmentStaffManager
                            departmentId={id}
                            title="Staff & Hierarchy"
                            description="Manage credentials and visual organization chart."
                        />
                    </div>
                )}

                {/* STUDENTS Management Section (If Education module) */}
                {hasFeature('STUDENTS') && (
                    <DepartmentStudentManager
                        departmentId={id}
                        organizationId={localStorage.getItem('organization_id') || undefined}
                        title={`${dept?.name} STUDENTS Management`}
                        description="Hierarchical view of students by program and counselor."
                    />
                )}
            </div>
        </div>
    );
}
