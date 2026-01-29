
import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    School,
    Users,
    UserCheck,
    CalendarDays,
    Megaphone,
    TrendingUp,
    Plus,
    Building2,
    LogOut,
    Lock,
    Unlock,
    Search,
    Filter,
    ArrowRight,
    Trash2,
    Activity,
    Clock,
    User,
    Shield,
    Briefcase,
    BadgeDollarSign,
    FileText,
    ChevronRight,
    GraduationCap,
    Pen,
    Settings,
    ClipboardList
} from 'lucide-react';
import Workspace from '../components/Workspace';
import { Link } from 'react-router-dom';
import DepartmentModal from '../components/DepartmentModal';


export default function OrganizationDashboard() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [designations, setDesignations] = useState<string[]>([]);
    const [modalError, setModalError] = useState('');
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [editingDept, setEditingDept] = useState<any>(null); // For customization
    const [newDept, setNewDept] = useState({ name: '', code: '', username: '', password: '', panelType: 'Generic', features: [] as string[] });
    const [updatingCreds, setUpdatingCreds] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rowInputs, setRowInputs] = useState<Record<string, { username?: string, password?: string, panelType?: string }>>({});
    const [customizingDept, setCustomizingDept] = useState<any | null>(null);

    const orgId = localStorage.getItem('organization_id');

    useEffect(() => {
        console.log('[DEBUG] errorMessage state changed:', errorMessage);
    }, [errorMessage]);

    useEffect(() => {
        if (!orgId) return;

        async function fetchData() {
            try {
                const query = `?organizationId=${orgId}`;

                const responses = await Promise.all([
                    fetch(`/api/resource/organization/${orgId}`),
                    fetch(`/api/resource/employee${query}`),
                    fetch(`/api/resource/department${query}`),
                    fetch(`/api/resource/attendance${query}`),
                    fetch(`/api/resource/student${query}`),
                    fetch(`/api/resource/studentapplicant${query}`)
                ]);

                const [jsonOrg, jsonEmp, jsonDept, jsonAtt, jsonStu, jsonApp] = await Promise.all(
                    responses.map(r => r.json())
                );

                setOrg(jsonOrg.data);
                const empData = jsonEmp.data || [];
                setEmployees(empData);
                setDepartments(jsonDept.data || []);
                setAttendance(jsonAtt.data || []);

                const uniqueDesigs: string[] = Array.from(new Set(empData.map((e: any) => e.designation))).filter(Boolean) as string[];
                setDesignations(uniqueDesigs);
                setCounts({
                    employee: jsonEmp.data?.length || 0,
                    department: jsonDept.data?.length || 0,
                    attendance: jsonAtt.data?.length || 0,
                    student: jsonStu.data?.length || 0,
                    application: jsonApp.data?.length || 0
                });

            } catch (e) {
                console.error('Error fetching dashboard data:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [orgId]);

    const [deptDesignations, setDeptDesignations] = useState<string[]>(['Manager', 'Team Lead', 'Associate']); // Default suggestions
    const [desigInput, setDesigInput] = useState('');


    const addDesignation = () => {
        if (desigInput && !deptDesignations.includes(desigInput)) {
            setDeptDesignations([...deptDesignations, desigInput]);
            setDesigInput('');
        }
    };

    const removeDesignation = (idx: number) => {
        setDeptDesignations(deptDesignations.filter((_, i) => i !== idx));
    };

    const handleDeleteDept = async (e: React.MouseEvent, deptId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this panel/department? All credentials will be removed.')) return;

        try {
            const res = await fetch(`/api/resource/department/${deptId}?organizationId=${orgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setDepartments(departments.filter(d => d._id !== deptId));
                setCounts(prev => ({ ...prev, department: (prev.department || 0) - 1 }));
            }
        } catch (e) {
            console.error('Error deleting department:', e);
        }
    };

    const handleUpdateCreds = async (deptId: string) => {
        const input = rowInputs[deptId];
        const dept = departments.find(d => d._id === deptId);
        if (!dept) return;

        const updatedUsername = input?.username || dept.username;
        const updatedPassword = input?.password || dept.password;
        const updatedPanelType = input?.panelType || dept.panelType || 'Generic'; // Validate/Default

        if (!updatedUsername || !updatedPassword) return;

        setUpdatingCreds(deptId);
        try {
            const res = await fetch(`/api/resource/department/${deptId}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: updatedUsername,
                    password: updatedPassword,
                    panelType: updatedPanelType
                })
            });
            if (res.ok) {
                setDepartments(departments.map(d =>
                    d._id === deptId ? {
                        ...d,
                        username: updatedUsername,
                        password: updatedPassword,
                        panelType: updatedPanelType
                    } : d
                ));
                setRowInputs(prev => {
                    const next = { ...prev };
                    delete next[deptId];
                    return next;
                });
                setSaveSuccess(deptId);
                setTimeout(() => setSaveSuccess(null), 3000);
            }
        } catch (e) {
            console.error('Error updating credentials:', e);
        } finally {
            setUpdatingCreds(null);
        }
    };



    const maxEmployees = org?.subscription?.maxEmployees || 0;
    const totalUsers = (counts.employee || 0) + (counts.student || 0);
    const empPercentage = maxEmployees > 0 ? Math.min((counts.employee / maxEmployees) * 100, 100) : 0;

    return (
        <div className="space-y-8 pb-20">
            <Workspace
                title={`${org?.name || 'Organization'} - Multi-Department Dashboard`}
                onCustomize={() => alert('Global Organization customization coming soon!')}
                summaryItems={[
                    { label: 'Total Staff', value: '', color: 'text-blue-500', doctype: 'employee' },
                    { label: 'Daily Attendance', value: '', color: 'text-emerald-500', doctype: 'attendance' },
                ]}
                masterCards={[
                    { label: 'Departments', icon: Building2, count: '', href: '/organization/departments' },
                    { label: 'All Staffs', icon: Users, count: '', href: '/employee' },
                    { label: 'System Access', icon: Shield, count: '', href: '#' },
                ]}
                shortcuts={[
                    { label: 'Create Department', href: '#' },
                    { label: 'Customize Departments', href: '/organization/departments' },
                    { label: 'Manage Roles', href: '#' },
                    { label: 'Export Reports', href: '#' },
                ]}
            />



            {/* Department Visibility Grid */}
            <div className="max-w-6xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[18px] font-bold text-[#1d2129]">Department Portals</h3>
                        <p className="text-[13px] text-gray-500">Global visibility across all subunits</p>
                    </div>
                    <button
                        onClick={() => setShowDeptForm(!showDeptForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> New Department
                    </button>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top duration-200">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[13px] font-medium">{errorMessage}</span>
                    </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map(dept => {
                        const deptEmps = employees.filter(e => e.department === dept.name);
                        const empIds = deptEmps.map(e => e.employeeId);
                        const deptAtt = attendance.filter(a => empIds.includes(a.employee) && a.status === 'Present');
                        return (
                            <Link key={dept._id} to={`/department-login?deptId=${dept._id}`} className="group no-underline">
                                <div className="bg-white p-6 rounded-xl border border-[#d1d8dd] shadow-sm hover:border-blue-400 hover:shadow-md transition-all h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <Building2 size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                                {deptAtt.length} Active Today
                                            </p>
                                        </div>
                                    </div>
                                    <h4 className="text-[16px] font-bold text-[#1d2129] mb-1">{dept.name}</h4>
                                    <div className="space-y-1 mb-4">
                                        <p className="text-[12px] text-gray-500 font-medium">Code: {dept.code}</p>
                                        <div className="flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50/50 px-2 py-1 rounded">
                                            <User size={10} /> <span>{dept.username || 'No User'}</span>
                                            <span className="text-gray-300">|</span>
                                            <Lock size={10} /> <span>{dept.password || 'No Pass'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[12px]">
                                            <span className="text-gray-500 flex items-center gap-1"><Users size={12} /> Staff</span>
                                            <span className="font-bold text-[#1d2129]">{deptEmps.length}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-400 h-full" style={{ width: `${Math.min((deptEmps.length / 20) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-blue-600 text-[12px] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                            Enter Dashboard <ArrowRight size={14} />
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteDept(e, dept._id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Panel"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setCustomizingDept(dept);
                                            }}
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                                            title="Customize Features"
                                        >
                                            <Pen size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>


            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Activity Feed */}
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-[#1d2129]">
                            <Activity size={18} className="text-blue-600" />
                            Recent Organizational Activity
                        </div>
                    </div>
                    <div className="flex-1 divide-y divide-gray-50">
                        {attendance.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 italic text-[13px]">No recent multi-department activity found.</div>
                        ) : (
                            attendance.slice(0, 6).map((att) => (
                                <div key={att._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1d2129]">{att.employeeName}</p>
                                            <p className="text-[11px] text-gray-500">Marked <span className="text-blue-600 font-medium">{att.status}</span> • Across Organization</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-400">{new Date(att.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Resource Allocation & Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-[#d1d8dd] shadow-sm">
                        <h3 className="text-[16px] font-bold text-[#1d2129] mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-600" />
                            System Utilization
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-[13px] mb-2">
                                    <span className="text-gray-600 font-medium">Headcount Allocation</span>
                                    <span className="font-bold text-blue-600">{counts.employee} / {maxEmployees}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${counts.employee >= maxEmployees ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${empPercentage}%` }} />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2 italic">Total active staff seats assigned by Super Admin</p>
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                                    <p className="text-[11px] font-bold text-purple-600 uppercase tracking-tighter">Growth</p>
                                    <p className="text-2xl font-black text-purple-700">+{counts.department * 2}%</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tighter">Efficiency</p>
                                    <p className="text-2xl font-black text-emerald-700">92%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-100">
                        <h4 className="text-[14px] font-bold text-blue-800 mb-2">Administrative Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="bg-white text-blue-700 px-3 py-2 rounded border border-blue-100 text-[12px] font-bold hover:bg-blue-50 transition-colors">Export Reporting</button>
                            <button className="bg-white text-blue-700 px-3 py-2 rounded border border-blue-100 text-[12px] font-bold hover:bg-blue-50 transition-colors">Audit Logs</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credential Management Section */}
            <div className="max-w-6xl mx-auto mt-12">
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-[#1d2129]">
                            <Shield size={18} className="text-blue-600" />
                            System Access & Credentials
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <p className="text-[11px] text-gray-500 italic">Manage login access for your functional panels</p>
                            <p className="text-[10px] text-blue-500 font-medium">Tip: Use unique usernames (e.g. hr@orgname) for best reliability.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-[#f9fafb] border-b border-[#d1d8dd] text-[#8d99a6] font-bold uppercase">
                                <tr>
                                    <th className="px-4 py-2">Role / Panel</th>
                                    <th className="px-4 py-2">Staff Name</th>
                                    <th className="px-4 py-2">Dashboard Type</th>
                                    <th className="px-4 py-2">Set Username</th>
                                    <th className="px-4 py-2">Set Password</th>
                                    <th className="px-4 py-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {departments.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 italic">No departments found to manage.</td></tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(rowInputs[dept._id]?.panelType || dept.panelType) === 'HR' ? 'bg-purple-100 text-purple-700' :
                                                    ((rowInputs[dept._id]?.panelType || dept.panelType) === 'Operations' || (rowInputs[dept._id]?.panelType || dept.panelType) === 'Education') ? 'bg-orange-100 text-orange-700' :
                                                        (rowInputs[dept._id]?.panelType || dept.panelType) === 'Finance' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {((rowInputs[dept._id]?.panelType || dept.panelType) || 'Generic').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-[#1d2129]">{dept.name}</div>
                                                <div className="text-[11px] text-gray-500">{dept.code}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <select
                                                    value={rowInputs[dept._id]?.panelType ?? dept.panelType ?? 'Generic'}
                                                    onChange={e => setRowInputs(prev => ({ ...prev, [dept._id]: { ...prev[dept._id], panelType: e.target.value } }))}
                                                    className="w-full bg-white border border-gray-200 px-2 py-1 rounded focus:outline-none focus:border-blue-400 text-[12px]"
                                                >
                                                    <option value="Generic">Generic</option>
                                                    <option value="HR">HR Workspace</option>
                                                    <option value="Operations">Operations</option>
                                                    <option value="Finance">Finance Workspace</option>
                                                    <option value="Sales">Staff Portal</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input
                                                    value={rowInputs[dept._id]?.username ?? ''}
                                                    placeholder={dept.username || "Set username..."}
                                                    onChange={e => setRowInputs(prev => ({ ...prev, [dept._id]: { ...prev[dept._id], username: e.target.value } }))}
                                                    className="w-full bg-white border border-gray-200 px-2 py-1 rounded focus:outline-none focus:border-blue-400 text-[12px]"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="text"
                                                    value={rowInputs[dept._id]?.password ?? ''}
                                                    placeholder={dept.password || "Set password..."}
                                                    onChange={e => setRowInputs(prev => ({ ...prev, [dept._id]: { ...prev[dept._id], password: e.target.value } }))}
                                                    className="w-full bg-white border border-gray-200 px-2 py-1 rounded focus:outline-none focus:border-blue-400 text-[12px]"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => handleUpdateCreds(dept._id)}
                                                    disabled={updatingCreds === dept._id || !rowInputs[dept._id]?.username || !rowInputs[dept._id]?.password}
                                                    className={`px-3 py-1.5 rounded text-[11px] font-bold text-white w-full transition-all ${saveSuccess === dept._id ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                                                        } disabled:bg-gray-200 disabled:text-gray-400`}
                                                >
                                                    {updatingCreds === dept._id ? 'Saving...' : saveSuccess === dept._id ? '✓ Saved!' : 'Update Access'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <DepartmentModal
                isOpen={showDeptForm || !!editingDept || !!customizingDept}
                onClose={() => {
                    setShowDeptForm(false);
                    setEditingDept(null);
                    setCustomizingDept(null);
                    setModalError('');
                }}
                error={modalError}
                initialData={editingDept || customizingDept}
                onSave={async (data) => {
                    setModalError('');
                    const isNew = !editingDept && !customizingDept;
                    const target = editingDept || customizingDept;

                    try {
                        const url = isNew
                            ? `/api/resource/department?organizationId=${orgId}`
                            : `/api/resource/department/${target._id}?organizationId=${orgId}`;

                        const res = await fetch(url, {
                            method: isNew ? 'POST' : 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(isNew ? { ...data, organizationId: orgId } : data)
                        });

                        if (res.ok) {
                            const result = await res.json();
                            if (isNew) {
                                setDepartments([...departments, result.data]);
                                setCounts(prev => ({ ...prev, department: (prev.department || 0) + 1 }));
                            } else {
                                setDepartments(departments.map(d => d._id === target._id ? result.data : d));
                            }
                            setShowDeptForm(false);
                            setEditingDept(null);
                            setCustomizingDept(null);
                        } else {
                            const err = await res.json();
                            setModalError(err.error || 'Failed to save department');
                        }
                    } catch (e) {
                        console.error(e);
                        setModalError('Network error occurred');
                    }
                }}
                title={editingDept ? `Edit ${editingDept.name}` : customizingDept ? `Customize ${customizingDept.name}` : 'Launch New Department'}
            />
        </div>
    );
}

