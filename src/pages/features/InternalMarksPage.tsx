import React, { useEffect, useState } from 'react';
import { UserCheck, Search, Filter, Plus, Trash2, Pen, GraduationCap, Building2, BookOpen } from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link, useNavigate } from 'react-router-dom';

export default function InternalMarksPage() {
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [studyCenters, setStudyCenters] = useState<any[]>([]);
    const navigate = useNavigate();

    const userRole = localStorage.getItem('user_role');
    const isOps = userRole === 'Operations' || userRole === 'DepartmentAdmin';

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptName = localStorage.getItem('department_name');
                const userCenter = localStorage.getItem('study_center_name');

                let query = `?organizationId=${orgId || ''}`;
                // Only filter by department if NOT Ops/Admin (Ops should see all)
                if (deptName && !isOps && userRole !== 'OrganizationAdmin' && userRole !== 'SuperAdmin') {
                    query += `&department=${deptName}`;
                }

                if (userCenter && userRole !== 'SuperAdmin' && userRole !== 'OrganizationAdmin' && !isOps) {
                    query += `&studyCenter=${userCenter}`;
                }

                const resp = await fetch(`/api/resource/internalmark${query}`);
                const json = await resp.json();
                setMarks(json.data || []);

                // Fetch centers for filter
                const respCenters = await fetch(`/api/resource/studycenter?organizationId=${orgId || ''}`);
                const jsonCenters = await respCenters.json();
                setStudyCenters(jsonCenters.data || []);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this internal mark?')) return;
        try {
            const res = await fetch(`/api/resource/internalmark/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMarks(marks.filter(m => m._id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredMarks = marks.filter(m => {
        const matchesSearch =
            m.student?.toLowerCase().includes(search.toLowerCase()) ||
            m.subject?.toLowerCase().includes(search.toLowerCase()) ||
            m.program?.toLowerCase().includes(search.toLowerCase());
        const matchesCenter = selectedCenter === '' || m.studyCenter === selectedCenter;
        return matchesSearch && matchesCenter;
    });

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Internal Marks"
                newHref="/internalmark/new"
                newLabel="Add Marks"
                summaryItems={[
                    { label: 'Total Entries', value: loading ? '...' : marks.length, color: 'text-blue-500', doctype: 'internalmark' },
                ]}
                masterCards={[]}
                shortcuts={[
                    { label: 'Add Internal Mark', href: `/internalmark/new?studyCenter=${encodeURIComponent(localStorage.getItem('study_center_name') || '')}` },
                    { label: 'View APPLICATIONS', href: '/student' },
                ]}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <UserCheck size={18} className="text-blue-600" />
                            Internal Marks List
                        </h3>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search marks..."
                                    className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-48"
                                />
                            </div>

                            {isOps && (
                                <div className="relative">
                                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={selectedCenter}
                                        onChange={e => setSelectedCenter(e.target.value)}
                                        className="pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 font-medium text-gray-700 appearance-none"
                                    >
                                        <option value="">All Centers</option>
                                        {studyCenters.map(c => (
                                            <option key={c._id} value={c.centerName}>{c.centerName}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">APPLICATION</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Program / Semester</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Marks</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Center</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading marks...</td></tr>
                                ) : filteredMarks.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No marks found.</td></tr>
                                ) : (
                                    filteredMarks.map((m) => (
                                        <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-[13px]">{m.student}</div>
                                                <div className="text-[11px] text-gray-500">{m.batch}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[13px]">{m.program}</div>
                                                <div className="text-[11px] text-gray-400">{m.semester}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium">{m.subject}</td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center px-2 py-1 rounded text-[13px] font-bold ${(m.marksObtained / m.maxMarks) >= 0.4 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {m.marksObtained} / {m.maxMarks}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-[12px] text-gray-600">
                                                    <Building2 size={12} /> {m.studyCenter || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link to={`/internalmark/${m._id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Pen size={14} />
                                                    </Link>
                                                    <button onClick={() => handleDelete(m._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
