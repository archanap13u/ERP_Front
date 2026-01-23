
import React, { useEffect, useState } from 'react';
import {
    BadgeDollarSign,
    FileText,
    CreditCard,
    TrendingUp,
    Wallet,
    Receipt,
    ArrowRight,
    Search,
    BookOpen,
    Users,
    GraduationCap,
    Eye,
    Edit,
    Clock
} from 'lucide-react';
import Workspace from '../components/Workspace';
import { Link } from 'react-router-dom';
import DepartmentStaffManager from '../components/DepartmentStaffManager';
import DepartmentWorkLog from '../components/DepartmentWorkLog';

export default function FinanceDashboard() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [invoices, setInvoices] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const orgId = localStorage.getItem('organization_id');
    const deptId = localStorage.getItem('department_id');

    const [departments, setDepartments] = useState<any[]>([]);
    const [contextData, setContextData] = useState<{ id?: string, name?: string }>({});

    useEffect(() => {
        if (!orgId) return;
        fetch(`/api/resource/department?organizationId=${orgId}`)
            .then(res => res.json())
            .then(json => {
                const depts = json.data || [];
                setDepartments(depts);
                const finDept = depts.find((d: any) => d.panelType === 'Finance');
                if (finDept) setContextData({ id: finDept._id, name: finDept.name });
            })
            .catch(err => console.error(err));
    }, [orgId]);

    useEffect(() => {
        async function fetchData() {
            try {
                const userRole = localStorage.getItem('user_role');

                let baseUrl = `/api/resource`;
                let queryParams = `?organizationId=${orgId || ''}`;

                if (deptId || contextData.id) {
                    queryParams += `&departmentId=${deptId || contextData.id}`;
                }

                const [resInv, resPay, resExp, resLead] = await Promise.all([
                    fetch(`${baseUrl}/salesinvoice${queryParams}`),
                    fetch(`${baseUrl}/paymententry${queryParams}`),
                    fetch(`${baseUrl}/expenseclaim${queryParams}`),
                    fetch(`${baseUrl}/lead${queryParams}`)
                ]);

                const [jsonInv, jsonPay, jsonExp, jsonLead] = await Promise.all([
                    resInv.json(), resPay.json(), resExp.json(), resLead.json()
                ]);

                setCounts({
                    invoice: jsonInv.data?.length || 0,
                    payment: jsonPay.data?.length || 0,
                    expense: jsonExp.data?.length || 0,
                    lead: jsonLead.data?.length || 0
                });

                setInvoices((jsonInv.data || []).slice(0, 5)); // Recent 5

                // Fetch Students Verified by Ops
                const resStd = await fetch(`${baseUrl}/student${queryParams}&verificationStatus=Verified by Ops`);
                const jsonStd = await resStd.json();
                setPendingStudents(jsonStd.data || []);

                // Fetch All Finance Employees for Directory (regardless of verification status)
                const resAllEmp = await fetch(`${baseUrl}/employee${queryParams}`);
                const jsonAllEmp = await resAllEmp.json();
                setEmployees(jsonAllEmp.data || []);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [contextData.id]);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Finance Workspace"
                newHref={`/salesinvoice/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}`}
                summaryItems={[
                    { label: 'Total STUDENTS', value: '', color: 'text-blue-500', doctype: 'student' },
                    { label: 'Received Payments', value: '', color: 'text-emerald-500', doctype: 'paymententry' },
                    { label: 'Expense Claims', value: '', color: 'text-red-500', doctype: 'expenseclaim' },
                ]}
                masterCards={[
                    { label: 'STUDENT Fees', icon: GraduationCap, count: '', href: '/finance-students' },
                    { label: 'Payments', icon: CreditCard, count: '', href: '/paymententry' },
                    { label: 'Expenses', icon: Receipt, count: '', href: '/expenseclaim' },
                    { label: 'General Ledger', icon: BookOpen, count: '', href: '#' },
                ]}
                shortcuts={[
                    { label: 'Create Invoice', href: `/salesinvoice/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}` },
                    { label: 'Record Payment', href: `/paymententry/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}` },
                    { label: 'New Expense Claim', href: `/expenseclaim/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}` },
                    { label: 'Post Announcement', href: `/announcement/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}` },
                ]}
            />

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Invoices */}
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            Recent Invoices
                        </h3>
                        <Link to="/salesinvoice" className="text-blue-600 text-[12px] font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {invoices.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 italic text-[13px]">No recent invoices found.</div>
                        ) : (
                            invoices.map((inv, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                            <Receipt size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1d2129]">{inv.customer || 'Unknown Customer'}</p>
                                            <p className="text-[11px] text-gray-500 font-mono">{inv.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-bold text-emerald-600">{inv.grand_total ? `$${inv.grand_total}` : '-'}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                            inv.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {inv.status || 'Draft'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending Financial Approvals (New Section) */}
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-indigo-50/30 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <CreditCard size={18} className="text-indigo-600" />
                            Pending Financial Approvals
                        </h3>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {pendingStudents.length} STUDENTS
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {pendingStudents.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 italic text-[13px]">No records awaiting financial approval.</div>
                        ) : (
                            pendingStudents.map((student, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1d2129]">{student.studentName}</p>
                                            <p className="text-[11px] text-gray-500 font-medium">{student.studyCenter}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link to={`/student/${student._id}`} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100" title="View Details">
                                            <Eye size={14} />
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Approve student financial record?')) return;
                                                try {
                                                    const res = await fetch(`/api/resource/student/${student._id}?organizationId=${orgId}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ verificationStatus: 'Active' })
                                                    });
                                                    if (res.ok) window.location.reload();
                                                } catch (e) { console.error(e); }
                                            }}
                                            className="bg-emerald-600 text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-emerald-700 shadow-sm"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Inline Finance Staff Directory */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Users size={20} />
                            </div>
                            Finance Staff Directory
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-64"
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                                No finance staff found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Finance Team Work Log */}
                <div className="lg:col-span-2 mb-8">
                    <DepartmentWorkLog
                        departmentId={contextData.id}
                        organizationId={localStorage.getItem('organization_id') || ''}
                        title="Finance Team Work Log"
                    />
                </div>

                {/* Financial Overview */}
                <div className="bg-white p-6 rounded-xl border border-[#d1d8dd] shadow-sm">
                    <h3 className="text-[16px] font-bold text-[#1d2129] mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-600" />
                        Cash Flow Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Inflow</p>
                            <p className="text-2xl font-bold text-emerald-700 mt-1">$12,450</p>
                            <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
                                <TrendingUp size={10} /> +12% this month
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Outflow</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">$4,320</p>
                            <p className="text-[10px] text-red-500 mt-1">
                                Software & Utilities
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-[16px] font-bold mb-2">Quick Actions</h4>
                        <div className="flex flex-wrap gap-2">
                            <Link to="/salesinvoice/new" className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded text-[12px] font-medium backdrop-blur-sm transition-colors no-underline">
                                + New Invoice
                            </Link>
                            <Link to="/paymententry/new" className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded text-[12px] font-medium backdrop-blur-sm transition-colors no-underline">
                                + Receive Payment
                            </Link>
                            <button className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded text-[12px] font-medium backdrop-blur-sm transition-colors">
                                Generate Report
                            </button>
                        </div>
                    </div>
                    <Wallet className="absolute right-[-20px] bottom-[-20px] text-white/10" size={120} />
                </div>
            </div>

            <div className="col-span-1 lg:col-span-2">
                <DepartmentStaffManager
                    departmentId={localStorage.getItem('department_id') || undefined}
                    title="Finance Team Access"
                    description="Manage credentials for finance department staff."
                />
            </div>
        </div>
    );
}

// Needed: Ensure Lucide icons imported above are correct.
// Added: BookOpen for General Ledger placeholder.
