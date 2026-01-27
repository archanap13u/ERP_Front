import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, ArrowRight, UserPlus, Building2, Search, Edit2, Info, ArrowUpDown, Filter } from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link } from 'react-router-dom';

export default function StudentRecordsPage() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [students, setStudents] = useState<any[]>([]);
    const [studyCenters, setStudyCenters] = useState<any[]>([]);
    const [selectedCenter, setSelectedCenter] = useState<string>('');
    const [selectedUniversity, setSelectedUniversity] = useState<string>('');
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<string>('studentName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const userRole = localStorage.getItem('user_role');
    const centerName = localStorage.getItem('study_center_name');
    const isOps = userRole === 'Operations' || userRole === 'DepartmentAdmin';
    const isCenter = userRole === 'StudyCenter';
    const isGlobalRole = userRole === 'SuperAdmin' || userRole === 'OrganizationAdmin' || userRole === 'Operations';

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptId = localStorage.getItem('department_id');

                let url = '/api/resource/student';

                // Construct robust query params based on role
                const params = new URLSearchParams();

                // 1. Organization filtering
                if (orgId) params.append('organizationId', orgId);

                // 2. Role-specific filtering
                if (isCenter && centerName) {
                    // Study Center User: MUST only see their own students
                    params.append('studyCenter', centerName.trim());
                } else if (isOps) {
                    // Operations User: Should see ALL students for the organization
                    // We explicitly DO NOT append studyCenter here
                }

                const finalUrl = `/api/resource/student?${params.toString()}`;
                console.log('[StudentRecords] Fetching:', finalUrl);

                const res = await fetch(finalUrl);
                const json = await res.json();
                const data = json.data || [];

                setCounts({
                    total: data.length,
                    active: data.filter((s: any) => s.isActive).length,
                });

                setStudents(data);

                // Fetch Study Centers (for filters)
                const resCenters = await fetch(`/api/resource/studycenter?organizationId=${orgId || ''}`);
                const jsonCenters = await resCenters.json();
                setStudyCenters(jsonCenters.data || []);

                if (isCenter && centerName) {
                    setSelectedCenter(centerName);
                }

                if (isCenter && centerName) {
                    setSelectedCenter(centerName);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Extract unique values for filters
    const universities = Array.from(new Set(students.map(s => s.university).filter(Boolean)));
    const programs = Array.from(new Set(students.map(s => s.program).filter(Boolean)));
    const statuses = ['Pending', 'Processing', 'Verified by Ops', 'Approved by Accounts'];

    const sortedStudents = [...students].sort((a, b) => {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredStudents = sortedStudents.filter(s => {
        const matchesSearch = (
            (s.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.university || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.program || '').toLowerCase().includes(search.toLowerCase())
        );
        const matchesCenter = selectedCenter === '' || s.studyCenter === selectedCenter;
        const matchesUniversity = selectedUniversity === '' || s.university === selectedUniversity;
        const matchesProgram = selectedProgram === '' || s.program === selectedProgram;
        const matchesStatus = selectedStatus === '' || (s.verificationStatus || 'Pending') === selectedStatus;

        return matchesSearch && matchesCenter && matchesUniversity && matchesProgram && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="STUDENTS"
                newHref={!isOps ? "/student/new" : undefined}
                newLabel={!isOps ? "Add STUDENT" : undefined}
                summaryItems={[
                    { label: 'Total STUDENTS', value: loading ? '...' : counts.total || 0, color: 'text-blue-500', doctype: 'student' },
                ]}
                masterCards={[
                    { label: 'All STUDENT Records', icon: Users, count: counts.total || 0, href: '/student' },
                ]}
                shortcuts={!isOps ? [
                    { label: 'Add New STUDENT', href: '/student/new' },
                ] : [
                ]}
            />

            <div className="max-w-7xl mx-auto space-y-6 px-4">
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                                <GraduationCap size={18} className="text-blue-600" />
                                {selectedCenter ? `${selectedCenter} STUDENTS` : 'All STUDENT Records'}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by name, univ, program..."
                                        className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-64"
                                    />
                                </div>

                                {!isOps && (
                                    <Link to="/student/new" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-bold hover:bg-blue-700 no-underline shadow-sm flex items-center gap-2">
                                        <UserPlus size={14} /> Add STUDENT
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400 mr-2">
                                <Filter size={14} /> Filters:
                            </div>

                            <select
                                value={selectedCenter}
                                onChange={e => setSelectedCenter(e.target.value)}
                                disabled={isCenter}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 font-medium text-gray-700 disabled:bg-gray-50"
                            >
                                {!isCenter && <option value="">All Study Centers</option>}
                                {studyCenters.map(c => (
                                    <option key={c._id} value={c.centerName}>{c.centerName}</option>
                                ))}
                            </select>

                            <select
                                value={selectedUniversity}
                                onChange={e => setSelectedUniversity(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 font-medium text-gray-700"
                            >
                                <option value="">All Universities</option>
                                {universities.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>

                            <select
                                value={selectedProgram}
                                onChange={e => setSelectedProgram(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 font-medium text-gray-700"
                            >
                                <option value="">All Programs</option>
                                {programs.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 font-medium text-gray-700"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            {(selectedCenter || selectedUniversity || selectedProgram || selectedStatus || search) && (
                                <button
                                    onClick={() => {
                                        setSelectedCenter(isCenter ? centerName || '' : '');
                                        setSelectedUniversity('');
                                        setSelectedProgram('');
                                        setSelectedStatus('');
                                        setSearch('');
                                    }}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-[#d1d8dd]">
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('studentName')}>
                                        <div className="flex items-center gap-2">Name <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('university')}>
                                        <div className="flex items-center gap-2">University <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleSort('program')}>
                                        <div className="flex items-center gap-2">Program <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-6 py-4">Study Center</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic text-[13px]">Loading records...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic text-[13px]">No records found for this selection.</td></tr>
                                ) : (
                                    filteredStudents.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[11px]">
                                                        {student.studentName ? student.studentName.substring(0, 1).toUpperCase() : 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-gray-900 leading-none mb-1">{student.studentName}</p>
                                                        <p className="text-[11px] text-gray-400 font-medium">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[12px] font-medium text-gray-700">{student.university || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[12px] font-medium text-gray-700">{student.program || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[12px] text-gray-500 font-medium">{student.studyCenter || 'No Center'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${student.verificationStatus === 'Approved by Accounts' ? 'bg-emerald-100 text-emerald-700' :
                                                    student.verificationStatus === 'Verified by Ops' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {student.verificationStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    {isOps && (student.verificationStatus === 'Pending' || student.verificationStatus === 'Processing') && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('Approve this STUDENT entry?')) return;
                                                                try {
                                                                    const storedOrgId = localStorage.getItem('organization_id');
                                                                    const orgId = (storedOrgId === 'null' || storedOrgId === 'undefined' || !storedOrgId) ? '' : storedOrgId;

                                                                    if (!orgId) {
                                                                        alert('Error: Organization ID is missing. Please log out and log in again.');
                                                                        return;
                                                                    }

                                                                    const res = await fetch(`/api/resource/student/${student._id}?organizationId=${orgId}`, {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            verificationStatus: 'Verified by Ops',
                                                                            organizationId: orgId
                                                                        })
                                                                    });
                                                                    if (res.ok) window.location.reload();
                                                                    else {
                                                                        const err = await res.json();
                                                                        alert(`Error: ${err.error || 'Failed to approve student'}`);
                                                                    }
                                                                } catch (e) { console.error(e); }
                                                            }}
                                                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-black hover:bg-emerald-700 shadow-sm transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    <Link to={`/student/${student._id}/edit`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95 flex items-center gap-1.5 no-underline" title="Edit">
                                                        <Edit2 size={14} />
                                                        <span className="text-[11px] font-bold">Edit</span>
                                                    </Link>
                                                    <Link to={`/student/${student._id}`} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95 flex items-center gap-1.5 no-underline" title="Details">
                                                        <Info size={14} />
                                                        <span className="text-[11px] font-bold">View</span>
                                                    </Link>
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

            {
                !isOps && (
                    <div className="max-w-7xl mx-auto px-4 mt-8">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-xl font-black mb-2">Ready to onboard?</h4>
                                <p className="text-blue-100 text-sm mb-6 max-w-md">Add new STUDENT records to track their academic progress, internal marks, and university enrollment.</p>
                                <div className="flex flex-wrap gap-4">
                                    <Link to="/student/new" className="bg-white text-blue-600 px-6 py-2.5 rounded-xl text-[14px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all no-underline">
                                        Add New STUDENT
                                    </Link>
                                </div>
                            </div>
                            <Users className="absolute right-[-40px] bottom-[-40px] text-white/10 rotate-12" size={240} />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
