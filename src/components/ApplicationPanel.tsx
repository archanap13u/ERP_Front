
import React, { useEffect, useState } from 'react';
import {
    ClipboardList,
    Search,
    Filter,
    Check,
    ArrowRight,
    ExternalLink,
    Building2,
    GraduationCap,
    Calendar,
    ArrowUpDown,
    Eye,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApplicationPanelProps {
    departmentId?: string;
    organizationId?: string;
}

export default function ApplicationPanel({ departmentId, organizationId: propOrgId }: ApplicationPanelProps) {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [centerFilter, setCenterFilter] = useState('');
    const [centers, setCenters] = useState<any[]>([]);
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const storedOrgId = localStorage.getItem('organization_id');
    const organizationId = propOrgId || ((storedOrgId === 'null' || storedOrgId === 'undefined') ? undefined : (storedOrgId || undefined));

    useEffect(() => {
        fetchData();
        fetchCenters();
    }, [departmentId, organizationId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const orgId = organizationId || localStorage.getItem('organization_id');

            if (!orgId) {
                console.error('[ApplicationPanel] No organizationId found!');
                setLoading(false);
                return;
            }

            let query = `organizationId=${orgId}`;
            if (departmentId) query += `&departmentId=${departmentId}`;

            console.log('[ApplicationPanel] Fetching students with query:', query);

            const res = await fetch(`/api/resource/student?${query}`);
            const data = await res.json();

            console.log('[ApplicationPanel] Total students fetched:', data.data?.length || 0);

            // Filter for those added by a study center
            const centerStds = (data.data || []).filter((s: any) => s.studyCenter).map((s: any) => ({
                ...s,
                status: s.verificationStatus || 'Pending'
            }));

            console.log('[ApplicationPanel] Center-added students:', centerStds.length);

            setApplications(centerStds);
        } catch (e) {
            console.error('[ApplicationPanel] Failed to fetch applications:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCenters = async () => {
        try {
            const res = await fetch(`/api/resource/studycenter?organizationId=${organizationId}`);
            const data = await res.json();
            setCenters(data.data || []);
        } catch (e) {
            console.error('Failed to fetch centers:', e);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to verify this student record? This will advance it to Finance.')) return;

        setActionLoading(id);
        try {
            const cleanOrgId = (organizationId === 'null' || organizationId === 'undefined') ? '' : (organizationId || '');
            const res = await fetch(`/api/resource/student/${id}?organizationId=${cleanOrgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationStatus: 'Verified by Ops' })
            });

            if (res.ok) {
                setApplications(prev => prev.map(app =>
                    app._id === id ? { ...app, status: 'Verified by Ops', verificationStatus: 'Verified by Ops' } : app
                ));
            }
        } catch (e) {
            console.error('Approval failed:', e);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const filtered = applications.filter(app => {
        const matchesSearch = (app.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
            (app.email || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || app.status === statusFilter;
        const matchesCenter = !centerFilter || app.studyCenter === centerFilter;
        return matchesSearch && matchesStatus && matchesCenter;
    }).sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        if (sortOrder === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });

    return (
        <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden mb-8 shadow-blue-50">
            <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                        <ClipboardList size={18} className="text-blue-600" />
                        Center Student Verification
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-1">Reviewing student records submitted by study centers.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search applicant..."
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-48 transition-all"
                        />
                    </div>

                    <select
                        value={centerFilter}
                        onChange={e => setCenterFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 font-medium text-gray-700"
                    >
                        <option value="">All Centers</option>
                        {centers.map(c => (
                            <option key={c._id} value={c.centerName}>{c.centerName}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 font-medium text-gray-700"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Verified by Ops">Verified by Ops</option>
                        <option value="Approved by Accounts">Approved by Accounts</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-[#d1d8dd]">
                            <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('studentName')}>
                                <div className="flex items-center gap-2">Student Name <ArrowUpDown size={12} /></div>
                            </th>
                            <th className="px-6 py-4">Center</th>
                            <th className="px-6 py-4">Program</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 size={24} className="text-blue-500 animate-spin" />
                                        <p className="text-gray-400 italic text-[13px]">Scanning for student records...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-gray-50 rounded-full">
                                            <ClipboardList size={32} className="text-gray-200" />
                                        </div>
                                        <p className="text-gray-400 italic text-[13px]">No records found in this queue.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((app, idx) => (
                                <tr key={app._id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] border border-blue-100 group-hover:scale-110 transition-transform">
                                                {(app.studentName || 'S').substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-900 leading-none mb-1">{app.studentName}</p>
                                                <p className="text-[11px] text-gray-400 font-medium">{app.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[12px] font-semibold text-gray-600">{app.studyCenter}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-[12px] font-bold text-indigo-900">{app.program}</p>
                                            <p className="text-[11px] text-gray-400">{app.university}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight border ${app.status === 'Approved' || app.status === 'Verified by Ops' || app.status === 'Approved by Accounts' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {(app.status === 'Pending' || app.status === 'Processing') && (
                                                <button
                                                    onClick={() => handleApprove(app._id)}
                                                    disabled={actionLoading === app._id}
                                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-black hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all active:scale-95 flex items-center gap-1.5"
                                                >
                                                    {actionLoading === app._id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                    Verify
                                                </button>
                                            )}
                                            <Link
                                                to={`/student/${app._id}`}
                                                className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                                title="View Details"
                                            >
                                                <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-3 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <p>Showing {filtered.length} applications from Study Centers</p>
                <Link to="/student" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                    View Comprehensive Roster <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}
