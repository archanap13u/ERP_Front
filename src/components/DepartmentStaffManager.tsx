
import React, { useEffect, useState } from 'react';
import { Shield, User, Lock, Search, Save, Check, AlertCircle, Eye, EyeOff, ChevronRight, Trash2, Users, TrendingUp, UserPlus, Plus } from 'lucide-react';

interface DepartmentStaffManagerProps {
    departmentId?: string; // If provided, filters by this department. If null, might show all (for HR/SuperAdmin)
    organizationId?: string;
    title?: string;
    description?: string;
}

export default function DepartmentStaffManager({ departmentId, organizationId: propOrgId, title, description }: DepartmentStaffManagerProps) {
    const orgId = propOrgId || localStorage.getItem('organization_id');
    const [employees, setEmployees] = useState<any[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [inputs, setInputs] = useState<Record<string, { username?: string, password?: string }>>({});

    // Visibility States
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'staff' | 'role'>('staff');
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        fetchDepartments();
        fetchJobOpenings();
    }, [departmentId]);

    const fetchDepartments = async () => {
        try {
            if (!orgId) return;
            const res = await fetch(`/api/resource/department?organizationId=${orgId}`);
            const data = await res.json();
            if (data.success) setDepartments(data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchJobOpenings = async () => {
        try {
            if (!orgId) return;
            let url = `/api/resource/jobopening?organizationId=${orgId}&status=Open`;
            if (departmentId) url += `&departmentId=${departmentId}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) setJobOpenings(data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchData = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const userRole = localStorage.getItem('user_role');
            let url = `/api/resource/employee?organizationId=${orgId}`;

            // HR/Admin can see everything BY DEFAULT, but if a departmentId is EXPLICITLY passed (e.g. from Explorer), respect it.
            const isGlobalRole = userRole === 'SuperAdmin' || userRole === 'OrganizationAdmin' || userRole === 'HR';
            if (departmentId) {
                url += `&departmentId=${departmentId}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setEmployees(data.data || []);
                setFilteredEmployees(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!search) {
            setFilteredEmployees(employees);
        } else {
            const lower = search.toLowerCase();
            setFilteredEmployees(employees.filter(e =>
                e.employeeName?.toLowerCase().includes(lower) ||
                e.designation?.toLowerCase().includes(lower) ||
                e.username?.toLowerCase().includes(lower)
            ));
        }
    }, [search, employees]);

    const handleSave = async (empId: string) => {
        const input = inputs[empId];
        if (!input || (!input.username && !input.password)) return;

        setSaving(empId);
        setSuccess(null);
        setError(null);

        try {
            const res = await fetch(`/api/resource/employee/${empId}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(input.username ? { username: input.username } : {}),
                    ...(input.password ? { password: input.password } : {})
                })
            });

            if (res.ok) {
                setSuccess(empId);
                // Update local state
                setEmployees(prev => prev.map(e => e._id === empId ? { ...e, ...input } : e));
                setInputs(prev => {
                    const next = { ...prev };
                    delete next[empId];
                    return next;
                });
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to update credentials');
            }
        } catch (e) {
            setError('Connection error');
        } finally {
            setSaving(null);
        }
    };

    const [showCreate, setShowCreate] = useState(false);
    const [newStaff, setNewStaff] = useState({
        employeeName: '',
        employeeId: '',
        designation: '',
        email: '',
        username: '',
        password: '',
        reportsTo: '',
        jobOpening: ''
    });
    const [jobOpenings, setJobOpenings] = useState<any[]>([]);


    const [designations, setDesignations] = useState<any[]>([]);
    const [formDesignations, setFormDesignations] = useState<any[]>([]);
    const [showDesignationModal, setShowDesignationModal] = useState(false);
    const [newDesignation, setNewDesignation] = useState({ title: '', level: 1, reportsTo: '' });
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Fetch designations for a specific department (used in global view when selecting dept)
    const fetchFormDesignations = async (deptId: string) => {
        if (!orgId) return;
        try {
            // Fetch all org designations
            const res = await fetch(`/api/resource/designation?organizationId=${orgId}`);
            const data = await res.json();
            const allDesig = data.data || [];

            // Fetch department whitelist
            const deptRes = await fetch(`/api/resource/department/${deptId}?organizationId=${orgId}`);
            const deptData = await deptRes.json();

            if (deptData.data?.designations?.length > 0) {
                const whitelist = deptData.data.designations;
                console.log('Department Whitelist:', whitelist);

                // Check for any whitelisted titles that don't have a record yet
                const missingTitles = whitelist.filter((title: string) =>
                    !allDesig.some((d: any) => d.title.toLowerCase() === title.toLowerCase())
                );

                // Auto-create missing designation records
                for (const title of missingTitles) {
                    try {
                        await fetch(`/api/resource/designation`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title, level: 1, departmentId: deptId, departmentName: deptData.data?.name, organizationId: orgId })
                        });
                    } catch (e) { console.error(e); }
                }

                // Re-fetch if we created any
                if (missingTitles.length > 0) {
                    const newRes = await fetch(`/api/resource/designation?organizationId=${orgId}`);
                    const newData = await newRes.json();
                    const finalDes = (newData.data || []).filter((d: any) =>
                        whitelist.some((w: string) => w.toLowerCase() === d.title.toLowerCase())
                    ).sort((a: any, b: any) => a.level - b.level);
                    console.log('Filtered Designations (New):', finalDes);
                    setFormDesignations(finalDes);
                } else {
                    const finalDes = allDesig.filter((d: any) =>
                        whitelist.some((w: string) => w.toLowerCase() === d.title.toLowerCase())
                    ).sort((a: any, b: any) => a.level - b.level);
                    console.log('Filtered Designations:', finalDes);
                    setFormDesignations(finalDes);
                }
            } else {
                // No whitelist, show all
                setFormDesignations(allDesig.sort((a: any, b: any) => a.level - b.level));
            }
        } catch (e) {
            console.error(e);
            setFormDesignations([]);
        }
    };

    const fetchAllDesignations = async () => {
        if (!orgId) return;
        try {
            const res = await fetch(`/api/resource/designation?organizationId=${orgId}`);
            const data = await res.json();
            setFormDesignations((data.data || []).sort((a: any, b: any) => a.level - b.level));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (departmentId) {
            fetchDesignations();
        } else {
            fetchAllDesignations();
        }
    }, [departmentId]);

    const fetchDesignations = async () => {
        if (!orgId) return;
        try {
            // Fetch all organization designations
            const res = await fetch(`/api/resource/designation?organizationId=${orgId}`);
            const data = await res.json();
            const allDesignations = data.data || [];

            let filteredDesignations = allDesignations;

            // If we have a departmentId, fetch department config and sync whitelist
            if (departmentId) {
                try {
                    const deptRes = await fetch(`/api/resource/department/${departmentId}?organizationId=${orgId}`);
                    const deptData = await deptRes.json();

                    if (deptData.data?.designations?.length > 0) {
                        const whitelist = deptData.data.designations;

                        // Check for any whitelisted titles that don't have a Designation record yet
                        const missingTitles = whitelist.filter((title: string) =>
                            !allDesignations.some((d: any) => d.title.toLowerCase() === title.toLowerCase())
                        );

                        // Auto-create missing designation records
                        for (const title of missingTitles) {
                            try {
                                await fetch(`/api/resource/designation`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        title,
                                        level: 1,
                                        departmentId,
                                        organizationId: orgId
                                    })
                                });
                            } catch (e) {
                                console.error(`Error creating designation ${title}:`, e);
                            }
                        }

                        // If we created any, re-fetch to get the new records
                        if (missingTitles.length > 0) {
                            const newRes = await fetch(`/api/resource/designation?organizationId=${orgId}`);
                            const newData = await newRes.json();
                            filteredDesignations = (newData.data || []).filter((d: any) =>
                                whitelist.some((w: string) => w.toLowerCase() === d.title.toLowerCase())
                            );
                        } else {
                            // Filter by department's whitelisted designations
                            filteredDesignations = allDesignations.filter((d: any) =>
                                whitelist.some((w: string) => w.toLowerCase() === d.title.toLowerCase())
                            );
                        }
                    }
                } catch (e) {
                    console.error('Error fetching department whitelist:', e);
                }
            }

            // Sort by level (ascending)
            setDesignations(filteredDesignations.sort((a: any, b: any) => a.level - b.level));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateDesignation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;
        try {
            // Create the designation
            const deptName = departments.find(d => d._id === departmentId)?.name;
            const res = await fetch(`/api/resource/designation?organizationId=${orgId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newDesignation,
                    departmentId: departmentId,
                    departmentName: deptName,
                    organizationId: orgId
                })
            });

            if (res.ok) {
                // If we have a departmentId, also add this designation to the department's whitelist
                if (departmentId) {
                    try {
                        // Fetch current department to get existing whitelist
                        const deptRes = await fetch(`/api/resource/department/${departmentId}?organizationId=${orgId}`);
                        const deptData = await deptRes.json();
                        const currentDesignations = deptData.data?.designations || [];

                        // Add new designation if not already present
                        if (!currentDesignations.some((d: string) => d.toLowerCase() === newDesignation.title.toLowerCase())) {
                            await fetch(`/api/resource/department/${departmentId}?organizationId=${orgId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    designations: [...currentDesignations, newDesignation.title]
                                })
                            });
                        }
                    } catch (e) {
                        console.error('Error updating department whitelist:', e);
                    }
                }

                fetchDesignations();
                setNewDesignation({ title: '', level: designations.length + 2, reportsTo: '' });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteDesignation = async (id: string) => {
        if (!confirm("Are you sure?") || !orgId) return;
        try {
            await fetch(`/api/resource/designation/${id}?organizationId=${orgId}`, { method: 'DELETE' });
            fetchDesignations();
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;
        setLoading(true);
        try {
            // deptId might be passed as prop or from local storage.
            // But we need the string Name of department for the 'department' field in Employee model
            // We'll try to fetch it or just use a placeholder if we only have ID.
            // Actually, we can fetch the department name first if we have the ID.

            // For now, let's assume we can get the name from the fetched employees (if any exist) or we default to Generic.
            // Better: Fetch department details if we have ID.
            let deptName = 'General';
            if (departmentId) {
                // Quick fetch to get name
                try {
                    const dRes = await fetch(`/api/resource/department/${departmentId}?organizationId=${orgId}`);
                    const dData = await dRes.json();
                    if (dData.data) deptName = dData.data.name;
                } catch (err) { console.error(err); }
            }

            const selectedDeptId = (newStaff as any).departmentId;
            let finalDeptId = departmentId || selectedDeptId;
            let finalDeptName = deptName;

            if (!departmentId && selectedDeptId) {
                const d = departments.find(dep => dep._id === selectedDeptId);
                if (d) finalDeptName = d.name;
            }

            const payload = {
                ...newStaff,
                department: finalDeptName,
                departmentId: finalDeptId,
                organizationId: orgId,
                addedByDepartmentId: departmentId, // The managing HR panel ID
                addedByDepartmentName: localStorage.getItem('department_name'), // The managing HR panel Name
                status: 'Active',
                dateOfJoining: new Date()
            };

            const res = await fetch(`/api/resource/employee?organizationId=${orgId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setEmployees([...employees, data.data]);
                setFilteredEmployees([...employees, data.data]); // Update filtered too
                setShowCreate(false);
                setNewStaff({ employeeName: '', employeeId: '', designation: '', email: '', username: '', password: '', reportsTo: '', jobOpening: '' });
                setSuccess('new-created');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to create staff member');
            }
        } catch (e) {
            setError('Creation failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getDirectReports = (id: string) => {
        return employees.filter(e => {
            const rId = typeof e.reportsTo === 'string' ? e.reportsTo : e.reportsTo?._id;
            return rId === id;
        });
    };

    const handleAddSubordinate = (managerId: string) => {
        const manager = employees.find(e => e._id === managerId);
        if (!manager) return;

        setNewStaff({
            ...newStaff,
            reportsTo: managerId,
            ['departmentId' as any]: manager.departmentId, // Inherit manager's department
            designation: '' // Reset designation to force selection within hierarchy context
        });
        setShowCreate(true);
        // Scroll to form if needed
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderRoleTree = (parentRole: string | null = null, level = 0) => {
        const activeList = departmentId ? designations : formDesignations;

        let children;
        if (parentRole === null) {
            // Find "local roots": nodes with no parent OR parent not in the list
            children = activeList.filter(d => {
                if (!d.reportsTo) return true;
                const parentExists = activeList.some(p => p.title === d.reportsTo);
                return !parentExists;
            });
        } else {
            children = activeList.filter(d => d.reportsTo === parentRole);
        }

        if (children.length === 0) return null;

        return (
            <div className={level > 0 ? "ml-12 border-l-2 border-dashed border-gray-200 pl-8 space-y-4 mt-4 relative" : "space-y-6 p-6"}>
                {children.map(role => {
                    const staffInRole = employees.filter(e => e.designation === role.title);
                    const isExpanded = expanded[role._id];

                    return (
                        <div key={role._id} className="relative">
                            {/* Visual Connector Line */}
                            {level > 0 && (
                                <div className="absolute -left-8 top-8 w-8 flex items-center">
                                    <div className="w-full h-0.5 bg-gray-200" />
                                </div>
                            )}

                            <div className={`bg-gradient-to-r from-white to-gray-50/30 rounded-2xl border ${staffInRole.length > 0 ? 'border-indigo-100 shadow-indigo-50/50' : 'border-gray-100'} p-4 flex items-center justify-between group hover:shadow-xl hover:shadow-gray-200/50 hover:border-indigo-200 transition-all duration-300`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl ${staffInRole.length > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'} flex items-center justify-center font-bold text-[16px] transform group-hover:scale-110 transition-transform`}>
                                        {role.level}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#1d2129] text-[15px] group-hover:text-indigo-700 transition-colors">{role.title}</h4>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <p className="text-[11px] text-gray-500 font-medium">{staffInRole.length} Positions Filled</p>
                                            {role.reportsTo && (
                                                <span className="flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-50 px-2 rounded-full font-bold">
                                                    Reports to {role.reportsTo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setNewStaff({ ...newStaff, designation: role.title });
                                            setShowCreate(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all flex items-center gap-2 text-[12px] font-bold"
                                        title="Hire for this Role"
                                    >
                                        <Plus size={14} /> Hire
                                    </button>
                                    <button
                                        onClick={() => toggleExpand(role._id)}
                                        className={`w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors ${designations.some(d => d.reportsTo === role.title) ? '' : 'invisible'}`}
                                    >
                                        <ChevronRight size={16} className={`text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`} />
                                    </button>
                                </div>
                            </div>
                            {isExpanded && renderRoleTree(role.title, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderEmployeeTree = (managerId: string | null = null, level = 0) => {
        const staffToRender = managerId ? employees : filteredEmployees;
        const children = staffToRender.filter(e => {
            const rId = typeof e.reportsTo === 'string' ? e.reportsTo : e.reportsTo?._id;
            if (!managerId) {
                if (search) return true;
                return !rId;
            }
            return rId === managerId;
        });

        if (children.length === 0 && level > 0) return null;

        return (
            <div className={level > 0 ? "ml-12 border-l-2 border-[#eef2f6] pl-8 space-y-4 mt-4 relative" : "space-y-6 p-6"}>
                {children.map(emp => {
                    const reports = getDirectReports(emp._id);
                    const isExpanded = expanded[emp._id];
                    const input = inputs[emp._id];
                    const userRole = localStorage.getItem('user_role');
                    const isGlobal = userRole === 'HR' || userRole === 'SuperAdmin' || userRole === 'OrganizationAdmin';

                    return (
                        <div key={emp._id} className="relative">
                            {/* Horizontal Connector Line */}
                            {level > 0 && (
                                <div className="absolute -left-8 top-10 w-8 flex items-center">
                                    <div className="w-full h-0.5 bg-[#eef2f6]" />
                                    <div className="w-2 h-2 rounded-full bg-[#eef2f6] -ml-1" />
                                </div>
                            )}

                            <div className={`bg-white rounded-2xl border ${isExpanded ? 'border-blue-200 shadow-lg shadow-blue-50/50' : 'border-[#eef2f6]'} shadow-sm overflow-hidden group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50/80 transition-all duration-300`}>
                                <div className={`p-4 flex items-center justify-between ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'} transition-colors`}>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleExpand(emp._id)}
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 transition-all ${reports.length === 0 ? 'invisible' : ''}`}
                                        >
                                            <ChevronRight size={14} className={`text-blue-600 transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-[16px] shadow-lg shadow-blue-200 transform group-hover:scale-105 transition-transform">
                                                {emp.employeeName.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                            {emp.username && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-[#1d2129] text-[15px] group-hover:text-blue-700 transition-colors">{emp.employeeName}</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100 uppercase tracking-wider">{emp.designation}</span>
                                                {isGlobal && emp.department && (
                                                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-bold uppercase tracking-widest">
                                                        {emp.department}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-[12px] text-gray-500 mt-1">
                                                <span className="flex items-center gap-1.5 opacity-70"><Shield size={12} className="text-gray-400" /> {emp.employeeId}</span>
                                                {reports.length > 0 && (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                        <Users size={12} /> {reports.length} Reports
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#f8fafc] rounded-2xl border border-[#eef2f6] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <div className="relative group/field">
                                                <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/field:text-blue-500 transition-colors" />
                                                <input
                                                    value={inputs[emp._id]?.username ?? ''}
                                                    placeholder={emp.username || "Set username"}
                                                    onChange={e => setInputs(prev => ({ ...prev, [emp._id]: { ...prev[emp._id], username: e.target.value } }))}
                                                    className="pl-8 pr-3 py-1.5 bg-white border border-transparent rounded-xl text-[12px] w-32 focus:outline-none focus:border-blue-400 focus:ring-4 ring-blue-50 transition-all placeholder:text-gray-300 shadow-sm"
                                                />
                                            </div>
                                            <div className="relative group/field">
                                                <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/field:text-blue-500 transition-colors" />
                                                <input
                                                    type={visiblePasswords[emp._id] ? "text" : "password"}
                                                    value={inputs[emp._id]?.password ?? ''}
                                                    placeholder={emp.password ? "••••••••" : "Set password"}
                                                    onChange={e => setInputs(prev => ({ ...prev, [emp._id]: { ...prev[emp._id], password: e.target.value } }))}
                                                    className="pl-8 pr-10 py-1.5 bg-white border border-transparent rounded-xl text-[12px] w-32 focus:outline-none focus:border-blue-400 focus:ring-4 ring-blue-50 transition-all placeholder:text-gray-300 shadow-sm"
                                                />
                                                <button
                                                    onClick={() => setVisiblePasswords(prev => ({ ...prev, [emp._id]: !prev[emp._id] }))}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    {visiblePasswords[emp._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <div className="w-px h-6 bg-gray-200 mx-1" />
                                            <button
                                                onClick={() => handleSave(emp._id)}
                                                disabled={saving === emp._id || (!input?.username && !input?.password)}
                                                className={`p-2 rounded-xl transition-all ${success === emp._id ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm'} disabled:opacity-30`}
                                            >
                                                {saving === emp._id ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent animate-spin rounded-full" /> : success === emp._id ? <Check size={16} /> : <Save size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleAddSubordinate(emp._id)}
                                                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center"
                                                title="Add Subordinate"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        {!emp.username && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 animate-pulse">
                                                <AlertCircle size={10} />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Identity Needed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-[#f8fafc] animate-in slide-in-from-top-4 duration-500">
                                        {renderEmployeeTree(emp._id, level + 1)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const activeDesignations = departmentId ? designations : formDesignations;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-8 transition-all hover:shadow-2xl">
            <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="flex items-center gap-2 font-bold text-[#1d2129]">
                        <Shield size={18} className="text-blue-600" />
                        {title || 'Staff & Hierarchy Management'}
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-1">{description || 'Visualize reporting structure and manage staff credentials.'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        <button
                            onClick={() => setViewMode('staff')}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-2 ${viewMode === 'staff' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Users size={14} /> Staff View
                        </button>
                        <button
                            onClick={() => setViewMode('role')}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-2 ${viewMode === 'role' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <TrendingUp size={14} /> Role View
                        </button>
                    </div>
                    <div className="h-8 w-px bg-gray-200 mx-2" />
                    <button
                        onClick={() => setShowDesignationModal(!showDesignationModal)}
                        className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex items-center gap-1"
                    >
                        Configure Levels
                    </button>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search hierarchy..."
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-700 flex items-center gap-1 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                        <Plus size={16} /> Hire Staff
                    </button>
                </div>
            </div>

            {showDesignationModal && (
                <div className="p-6 bg-gray-50 border-b border-gray-200 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[14px] font-bold text-gray-800">Designation Hierarchy</h4>
                        <button onClick={() => setShowDesignationModal(false)} className="text-gray-400 hover:text-gray-600 text-xs">Close</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <form onSubmit={handleCreateDesignation} className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-600">Designation Title</label>
                                    <input required value={newDesignation.title} onChange={e => setNewDesignation({ ...newDesignation, title: e.target.value })} className="w-full text-[13px] p-2 border rounded" placeholder="e.g. Lead Developer" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-600">Level (1 = Highest)</label>
                                        <input type="number" required value={newDesignation.level} onChange={e => setNewDesignation({ ...newDesignation, level: parseInt(e.target.value) })} className="w-full text-[13px] p-2 border rounded" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-600">Reports To</label>
                                        <select value={newDesignation.reportsTo} onChange={e => setNewDesignation({ ...newDesignation, reportsTo: e.target.value })} className="w-full text-[13px] p-2 border rounded">
                                            <option value="">None (Top Level)</option>
                                            {designations.map(d => (
                                                <option key={d._id} value={d.title}>{d.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-[13px] font-bold w-full hover:bg-blue-700 shadow-sm transition-all focus:ring-2 ring-blue-500 focus:outline-none">Add Designation</button>
                            </form>
                        </div>

                        <div className="bg-white border rounded-lg p-3 max-h-[250px] overflow-y-auto shadow-inner">
                            <div className="text-[11px] font-bold text-gray-400 uppercase mb-3 px-1">Current Structure</div>
                            {designations.length === 0 ? <p className="text-gray-400 text-[12px] text-center py-6 italic">No levels defined yet.</p> : (
                                <div className="space-y-2">
                                    {designations.map(d => (
                                        <div key={d._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100 group hover:border-blue-200 transition-colors">
                                            <div>
                                                <div className="font-bold text-[13px] text-gray-800">{d.title}</div>
                                                <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                                    <span>Rank {d.level}</span>
                                                    {d.reportsTo && (
                                                        <>
                                                            <span className="text-gray-300">|</span>
                                                            <span className="flex items-center gap-1"><Users size={10} /> {d.reportsTo}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDesignation(d._id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCreate && (
                <>
                    <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 border-b border-indigo-500 relative overflow-hidden group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-150" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full -ml-24 -mb-24 blur-2xl" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-2xl">
                                    <UserPlus size={28} />
                                </div>
                                <div>
                                    <h4 className="text-[20px] font-bold text-white tracking-tight">Expand the Workforce</h4>
                                    <p className="text-blue-100/80 text-[13px] font-medium">Adding a new node to the organizational architecture.</p>
                                </div>
                            </div>

                            {newStaff.reportsTo && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-[12px] font-bold text-white">
                                                    <span className="text-blue-200/70">Hierarchy Path:</span>
                                                    {departmentId ? (
                                                        <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">{departments.find(d => d._id === departmentId)?.name}</span>
                                                    ) : (
                                                        <span className="bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-400/20 text-orange-200">
                                                            {departments.find(d => d._id === (newStaff as any).departmentId)?.name || 'Needs Dept'}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={12} className="text-white/30" />
                                                    <span className="text-blue-100">{employees.find(e => e._id === newStaff.reportsTo)?.employeeName}</span>
                                                    <ChevronRight size={12} className="text-white/30" />
                                                    <span className="text-white animate-pulse">{newStaff.employeeName || 'New Hire'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNewStaff({ ...newStaff, reportsTo: '' })}
                                            className="w-10 h-10 bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/20 rounded-2xl transition-all flex items-center justify-center backdrop-blur-sm"
                                            title="Detach from Manager"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-8 bg-white border-b border-gray-100 animate-in slide-in-from-top-2 duration-500">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                {!departmentId && (
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Shield size={12} /> Assign Department</label>
                                        <select
                                            required
                                            value={(newStaff as any).departmentId || ''}
                                            onChange={e => {
                                                const selectedDeptId = e.target.value;
                                                setNewStaff({ ...newStaff, ['departmentId' as any]: selectedDeptId, designation: '', reportsTo: '' });
                                                if (selectedDeptId) {
                                                    fetchFormDesignations(selectedDeptId);
                                                } else {
                                                    fetchAllDesignations();
                                                }
                                            }}
                                            className="w-full text-[13px] p-2.5 border rounded-lg h-[41px] shadow-sm focus:border-blue-400 outline-none bg-white transition-all appearance-none"
                                        >
                                            <option value="">Select Dept...</option>
                                            {departments.map(d => (
                                                <option key={d._id} value={d._id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Shield size={12} /> Link Vacancy (Optional)</label>
                                    <select
                                        value={newStaff.jobOpening}
                                        onChange={e => {
                                            const jobOpeningId = e.target.value;
                                            const job = jobOpenings.find(j => j._id === jobOpeningId);
                                            if (job && job.job_title) {
                                                const title = job.job_title;
                                                const exists = activeDesignations.some(d => d.title === title);
                                                if (!exists) {
                                                    const newDes = { _id: `temp-${Date.now()}`, title: title, level: 1 };
                                                    setDesignations(prev => [...prev, newDes]);
                                                    setFormDesignations(prev => [...prev, newDes]);
                                                }
                                                setNewStaff({ ...newStaff, jobOpening: jobOpeningId, designation: title });
                                            } else {
                                                setNewStaff({ ...newStaff, jobOpening: jobOpeningId });
                                            }
                                        }}
                                        className="w-full text-[13px] p-2.5 border rounded-lg h-[41px] shadow-sm focus:border-blue-400 outline-none bg-white transition-all appearance-none"
                                    >
                                        <option value="">Direct Hire (No Vacancy)</option>
                                        {jobOpenings.map(j => (
                                            <option key={j._id} value={j._id}>{j.job_title} ({j.department || 'General'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><User size={12} /> Full Name</label>
                                    <input required value={newStaff.employeeName} onChange={e => setNewStaff({ ...newStaff, employeeName: e.target.value })} className="w-full text-[13px] p-2.5 border rounded-lg shadow-sm focus:border-blue-400 outline-none bg-white transition-all" placeholder="e.g. Alice Smith" />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Shield size={12} /> Employee ID</label>
                                    <input required value={newStaff.employeeId} onChange={e => setNewStaff({ ...newStaff, employeeId: e.target.value })} className="w-full text-[13px] p-2.5 border rounded-lg shadow-sm focus:border-blue-400 outline-none bg-white transition-all" placeholder="e.g. STF-102" />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Users size={12} /> Designation</label>
                                    {activeDesignations.length > 0 ? (
                                        <select
                                            required
                                            value={newStaff.designation}
                                            onChange={e => {
                                                const newDesig = e.target.value;
                                                const desigData = activeDesignations.find(d => d.title === newDesig);
                                                let autoManager = newStaff.reportsTo;

                                                // Smart suggestion: if this designation reports to something specific, try to find a manager
                                                if (desigData?.reportsTo) {
                                                    const potentialManager = employees.find(emp => emp.designation === desigData.reportsTo);
                                                    if (potentialManager) autoManager = potentialManager._id;
                                                }

                                                setNewStaff({ ...newStaff, designation: newDesig, reportsTo: autoManager });
                                            }}
                                            className="w-full text-[13px] p-2.5 border rounded-lg h-[41px] shadow-sm focus:border-blue-400 outline-none bg-white transition-all appearance-none"
                                        >
                                            <option value="">Choose Level...</option>
                                            {activeDesignations
                                                .filter(d => {
                                                    // If reportsTo is selected, show only levels lower than manager
                                                    if (newStaff.reportsTo) {
                                                        const manager = employees.find(e => e._id === newStaff.reportsTo);
                                                        const managerDesignation = activeDesignations.find(des => des.title === manager?.designation);
                                                        if (managerDesignation) return d.level > managerDesignation.level;
                                                    }
                                                    return true;
                                                })
                                                .map(d => (
                                                    <option key={d._id} value={d.title}>{d.title}</option>
                                                ))}
                                        </select>
                                    ) : (
                                        <input required value={newStaff.designation} onChange={e => setNewStaff({ ...newStaff, designation: e.target.value })} className="w-full text-[13px] p-2.5 border rounded-lg shadow-sm focus:border-blue-400 outline-none bg-white transition-all" placeholder="e.g. Manager" />
                                    )}
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><TrendingUp size={12} /> Reports To</label>
                                    <select
                                        value={newStaff.reportsTo || ''}
                                        onChange={e => setNewStaff({ ...newStaff, reportsTo: e.target.value })}
                                        className="w-full text-[13px] p-2.5 border rounded-lg h-[41px] shadow-sm focus:border-blue-400 outline-none bg-white transition-all appearance-none"
                                    >
                                        <option value="">None (Top Level)</option>
                                        {employees
                                            .filter(emp => {
                                                // If dept is selected, show only employees from that dept
                                                const targetDeptId = departmentId || (newStaff as any).departmentId;
                                                if (targetDeptId && (emp.departmentId || emp.addedByDepartmentId) !== targetDeptId) {
                                                    // Flexible check: use department name if ID check fails (legacy data support)
                                                    const targetDept = departments.find(d => d._id === targetDeptId);
                                                    if (targetDept && emp.department !== targetDept.name) return false;
                                                }

                                                const mgrDest = activeDesignations.find(d => d.title === emp.designation);
                                                const myDest = activeDesignations.find(d => d.title === newStaff.designation);
                                                if (mgrDest && myDest) return mgrDest.level < myDest.level;
                                                return true;
                                            })
                                            .map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.employeeName} ({emp.designation})</option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-blue-100 pt-5">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><User size={12} /> System Username</label>
                                    <input required value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} className="w-full text-[13px] p-2.5 border rounded-lg shadow-sm focus:border-blue-400 outline-none bg-white transition-all" placeholder="username" />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><Lock size={12} /> System Password</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showCreatePassword ? "text" : "password"}
                                            value={newStaff.password}
                                            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                            className="w-full text-[13px] p-2.5 border rounded-lg pr-10 shadow-sm focus:border-blue-400 outline-none bg-white transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCreatePassword(!showCreatePassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg text-[13px] font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all flex-1 active:scale-95 flex items-center justify-center gap-2">
                                        <Check size={16} /> Confirm Creation
                                    </button>
                                    <button type="button" onClick={() => setShowCreate(false)} className="bg-white border border-gray-200 text-gray-500 px-8 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 flex-1 hover:text-gray-700 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </>
            )
            }

            <div className="p-5 bg-gray-50/20">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Organizational Structure</span>
                    </div>
                    {search && (
                        <div className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-100 animate-pulse">
                            Search Active: showing matching records
                        </div>
                    )}
                </div>
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-medium text-[13px]">Building hierarchy chart...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="py-32 text-center text-gray-400 italic border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <Users size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-[14px]">No staff or roles found for this view.</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {viewMode === 'staff' ? renderEmployeeTree() : renderRoleTree()}
                    </div>
                )}
            </div>

            {
                error && (
                    <div className="bg-red-50 text-red-600 text-[12px] p-4 text-center border-t border-red-100 flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2">
                        <AlertCircle size={16} />
                        <span className="font-medium">{error}</span>
                    </div>
                )
            }
        </div >
    );
}
