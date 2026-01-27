import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, ArrowLeft, Trash2 } from 'lucide-react';
import { fieldRegistry } from '../config/fields';

interface GenericListProps {
    doctype?: string;
}

export default function GenericList({ doctype: propDoctype }: GenericListProps) {
    const params = useParams();
    const doctype = propDoctype || params.doctype;
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hiredCounts, setHiredCounts] = useState<Record<string, number>>({});

    // Determine context
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('user_role');
    const deptName = localStorage.getItem('department_name');

    const [filterStatus, setFilterStatus] = useState<string>('All');

    const displayTitle = (doctype as string || '').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete this ${displayTitle}?`)) return;

        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/${doctype}/${id}?organizationId=${orgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setData(prev => prev.filter(item => item._id !== id));
            } else {
                const err = await res.json();
                alert(`Failed to delete: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error deleting record:', err);
            alert('Failed to connect to server');
        }
    };

    useEffect(() => {
        const orgId = localStorage.getItem('organization_id');
        if (!doctype || !orgId) return;

        async function fetchData() {
            setLoading(true);
            try {
                const userRole = localStorage.getItem('user_role');
                const deptIdFromStorage = localStorage.getItem('department_id');
                const deptNameFromStorage = localStorage.getItem('department_name');

                let deptId = deptIdFromStorage;
                let deptName = deptNameFromStorage;

                // Fallback for Admins without query params (detect context from path)
                if (!deptName && (userRole === 'OrganizationAdmin' || userRole === 'SuperAdmin')) {
                    const path = location.pathname;
                    const isDepartmental = ['announcement', 'holiday', 'performancereview'].includes(doctype || '');

                    if (isDepartmental) {
                        if (/^\/(hr|employee|jobopening|attendance|holiday)/i.test(path)) {
                            deptName = 'Human Resources';
                        } else if (/^\/(ops-dashboard|student|university|program|studycenter)/i.test(path)) {
                            deptName = 'Operations';
                        } else if (/^\/(finance|salesinvoice|payment|expense)/i.test(path)) {
                            deptName = 'Finance';
                        }
                    }
                }

                let url = `/api/resource/${doctype}?organizationId=${orgId || ''}`;

                // Don't silo Employees, Students, or Complaints by Department for HR/Admin roles
                const isGlobalDoctype = ['employee', 'student', 'jobopening', 'complaint'].includes(doctype || '');
                const isAdminOrHR = userRole === 'SuperAdmin' || userRole === 'OrganizationAdmin' || userRole === 'HR' || userRole === 'Operations';

                if (!isGlobalDoctype || !isAdminOrHR) {
                    // For Job Openings, HR should see ALL, regardless of their own department
                    if (doctype === 'jobopening' && (deptName === 'Human Resources' || deptName === 'HR')) {
                        // Do not filter
                    } else {
                        if (deptId) url += `&departmentId=${deptId}`;
                        if (deptName) url += `&department=${encodeURIComponent(deptName)}`;
                    }
                }

                // Extra privacy for complaints: Employees AND Dept Admins only see their own
                // Only HR (Dept) and SuperAdmin (Global) can see ALL complaints. 
                // OrganizationAdmin is restricted because they might be a Dept Head acting as Org Admin.
                if (doctype === 'complaint') {
                    const isHR = userRole === 'HR' || deptName === 'Human Resources' || deptName === 'HR';
                    const isSuper = userRole === 'SuperAdmin'; // REMOVED OrganizationAdmin from here

                    console.log(`[GenericList] Complaint Access Check: Role=${userRole}, Dept=${deptName}, isHR=${isHR}, isSuper=${isSuper}`);

                    if (!isHR && !isSuper) {
                        const storedEmpId = localStorage.getItem('employee_id');
                        const storedUserName = localStorage.getItem('user_name');

                        // Pass both if available, backend handles OR logic
                        if (storedEmpId && storedEmpId !== 'null') url += `&employeeId=${storedEmpId}`;

                        // CRITICAL: We must pass 'username' param for Dept Admins (e.g. 'operation') who don't have employee IDs
                        if (storedUserName && storedUserName !== 'null') url += `&username=${encodeURIComponent(storedUserName)}`;

                        console.log(`[GenericList] Restricted Fetch URL: ${url}`);
                    } else {
                        // HR/SuperAdmin: Explicitly request ALL records
                        url += `&view=all`;
                        console.log(`[GenericList] Admin Fetch URL (View All): ${url}`);
                    }
                }

                // [Fix] Enforce Isolation for Study Center Users
                // They should ONLY see data related to their center
                if ((userRole === 'StudyCenter' || userRole === 'Study Center') && ['student', 'studentapplicant', 'internalmark'].includes(doctype || '')) {
                    const myCenterId = localStorage.getItem('study_center_id');
                    const myCenterName = localStorage.getItem('study_center_name');
                    if (myCenterId) url += `&studyCenterId=${myCenterId}`;
                    if (myCenterName) url += `&studyCenter=${encodeURIComponent(myCenterName)}`;
                }

                const dataPromise = fetch(url).then(res => res.json());

                // Metadata fetch for job openings
                let metaPromise = Promise.resolve({ data: [] });
                if (doctype === 'jobopening') {
                    metaPromise = fetch(`/api/resource/employee?organizationId=${orgId}`).then(res => res.json());
                }

                const [json, metaJson] = await Promise.all([dataPromise, metaPromise]);

                setData(json.data || []);

                if (doctype === 'jobopening') {
                    const employees = metaJson.data || [];
                    const counts: Record<string, number> = {};
                    for (const emp of employees) {
                        const jobId = (emp as any).jobOpening?._id || (emp as any).jobOpening;
                        if (jobId) {
                            counts[jobId] = (counts[jobId] || 0) + 1;
                        }
                    }
                    setHiredCounts(counts);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [doctype]);

    const handleRowClick = (id: string) => {
        navigate(`/${doctype}/${id}`);
    };

    return (
        <div className="pb-20 text-[#1d2129]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded">
                        <ArrowLeft size={18} className="text-gray-500" />
                    </button>
                    <h2 className="text-[20px] font-bold">{displayTitle} List</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.location.reload()} className="bg-white border border-[#d1d8dd] px-3 py-1.5 rounded text-[13px] font-semibold hover:bg-gray-50">
                        Refresh
                    </button>
                    {doctype !== 'student' && doctype !== 'complaint' && (
                        doctype !== 'holiday' ||
                        ['SuperAdmin', 'OrganizationAdmin', 'HR'].includes(localStorage.getItem('user_role') || '') ||
                        localStorage.getItem('department_panel_type') === 'HR' ||
                        /^(Human Resources|HR)$/i.test(localStorage.getItem('department_name') || '')
                    ) && (
                            <button
                                onClick={() => navigate(`/${doctype}/new`)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-[13px] font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                            >
                                <Plus size={14} />
                                Add {displayTitle}
                            </button>
                        )}
                </div>
            </div>

            {/* Status Filter Tabs for Student List */}
            {doctype === 'student' && (
                <div className="flex items-center gap-2 mb-6">
                    <div className="bg-white p-1 rounded-lg border border-[#d1d8dd] flex items-center">
                        {['All', 'Verified by Ops', 'Active', 'Processing', 'Pending'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 text-[12px] font-bold rounded-md transition-all ${filterStatus === status
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }`}
                            >
                                {status === 'Verified by Ops' ? 'Ready for Approval' : status}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white overflow-hidden shadow-sm border border-[#d1d8dd] rounded-lg">
                <div className="p-3 border-b border-[#d1d8dd] bg-[#f9fafb] flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder={`Search ${displayTitle}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#d1d8dd] rounded text-[13px] focus:outline-none focus:border-blue-400 font-medium"
                        />
                    </div>
                    <button className="flex items-center gap-2 text-[13px] text-[#626161] hover:text-blue-600 font-medium px-2 py-1">
                        <Filter size={14} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="bg-[#f0f4f7] border-b border-[#d1d8dd] text-[#8d99a6] font-bold uppercase tracking-wider">
                                <th className="px-4 py-2 w-10"><input type="checkbox" className="rounded" /></th>
                                <th className="px-4 py-2">Name</th>
                                {doctype === 'employee' && <th className="px-4 py-2">ID</th>}
                                {doctype === 'employee' && <th className="px-4 py-2">Department</th>}
                                {doctype === 'employee' && <th className="px-4 py-2">Designation</th>}
                                {doctype === 'employee' && <th className="px-4 py-2">Reports To</th>}
                                {doctype === 'jobopening' && <th className="px-4 py-2">Department</th>}
                                {doctype === 'jobopening' && <th className="px-4 py-2">Positions</th>}
                                {doctype === 'jobopening' && <th className="px-4 py-2">Hired</th>}
                                {doctype === 'jobopening' && <th className="px-4 py-2">Remaining</th>}
                                {(doctype === 'announcement' || doctype === 'opsannouncement') && <th className="px-4 py-2">Target Center</th>}
                                {doctype === 'announcement' && <th className="px-4 py-2">Department</th>}
                                {doctype === 'complaint' && <th className="px-4 py-2">Filed By</th>}
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Last Modified</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Fetching records...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">No records found.</td></tr>
                            ) : (
                                data
                                    .filter(item => {
                                        if (doctype !== 'student' || filterStatus === 'All') return true;
                                        return item.verificationStatus === filterStatus;
                                    })
                                    .filter(item => {
                                        if (!searchTerm) return true;
                                        const search = searchTerm.toLowerCase();
                                        const values = Object.values(item).map(v => String(v).toLowerCase());
                                        return values.some(v => v.includes(search));
                                    })
                                    .map((item, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => handleRowClick(item._id)}
                                            className="hover:bg-[#f9fafb] cursor-pointer group transition-colors"
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded" /></td>
                                            <td className="px-4 py-3 font-medium text-blue-600 hover:underline">
                                                {item.employeeName || item.name || item.job_title || item.title || item.subject || item.holidayName || item.universityName || item.centerName || item.programName || item.studentName || item.student || item._id}
                                            </td>
                                            {doctype === 'employee' && (
                                                <td className="px-4 py-3 text-[#1d2129] font-mono font-medium">
                                                    {item.employeeId || '-'}
                                                </td>
                                            )}
                                            {doctype === 'employee' && (
                                                <td className="px-4 py-3 text-[#1d2129]">
                                                    {item.department || '-'}
                                                </td>
                                            )}
                                            {doctype === 'employee' && (
                                                <td className="px-4 py-3 text-[#1d2129]">
                                                    {item.designation || '-'}
                                                </td>
                                            )}
                                            {doctype === 'employee' && (
                                                <td className="px-4 py-3 text-[#1d2129]">
                                                    {item.reportsToRole || (item.reportsTo?.employeeName ? item.reportsTo.employeeName : '-')}
                                                </td>
                                            )}
                                            {doctype === 'jobopening' && (
                                                <td className="px-4 py-3 text-[#1d2129]">
                                                    {item.department || '-'}
                                                </td>
                                            )}
                                            {doctype === 'jobopening' && (
                                                <td className="px-4 py-3 text-[#1d2129] font-medium">
                                                    {item.no_of_positions || 1}
                                                </td>
                                            )}
                                            {doctype === 'jobopening' && (
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${(hiredCounts[item._id] || 0) >= (item.no_of_positions || 1)
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {hiredCounts[item._id] || 0}
                                                    </span>
                                                </td>
                                            )}
                                            {doctype === 'jobopening' && (
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${((item.no_of_positions || 1) - (hiredCounts[item._id] || 0)) <= 0
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {Math.max(0, (item.no_of_positions || 1) - (hiredCounts[item._id] || 0))}
                                                    </span>
                                                </td>
                                            )}
                                            {(doctype === 'announcement' || doctype === 'opsannouncement') && (
                                                <td className="px-4 py-3 text-[#1d2129] font-medium">
                                                    {item.targetCenter || '-'}
                                                </td>
                                            )}
                                            {doctype === 'announcement' && (
                                                <td className="px-4 py-3 text-[#1d2129]">
                                                    {item.department || '-'}
                                                </td>
                                            )}
                                            {doctype === 'complaint' && (
                                                <td className="px-4 py-3 text-[#1d2129]">
                                                    {item.employeeName || item.employeeId || 'Anonymous'}
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'Left' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-[#626161]'
                                                    }`}>
                                                    {item.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#8d99a6]">
                                                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Today'}
                                            </td>
                                            <td className="px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal size={16} className="text-gray-400 hover:text-blue-600" />
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
