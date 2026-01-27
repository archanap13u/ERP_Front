import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProgramsPage() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'All' | 'Skill' | 'B.Voc'>('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const orgId = localStorage.getItem('organization_id');
            const deptId = localStorage.getItem('department_id');

            let queryParams = `?organizationId=${orgId || ''}`;
            // Programs are organization-wide, not department-specific
            // Do NOT filter by departmentId

            console.log('[ProgramsPage] Fetching programs with query:', queryParams);
            const res = await fetch(`/api/resource/program${queryParams}`);
            const json = await res.json();
            console.log('[ProgramsPage] Received programs:', json.data?.length || 0, 'programs');
            const data = json.data || [];

            setCounts({
                total: data.length,
                active: data.filter((p: any) => p.published).length,
            });

            setPrograms(data);

        } catch (e) {
            console.error('[ProgramsPage] Error fetching programs:', e);
            alert('Failed to load programs. Please check your connection and try refreshing the page.');
        } finally {
            console.log('[ProgramsPage] Fetch complete, setting loading to false');
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this program?')) return;

        try {
            const res = await fetch(`/api/resource/program/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setPrograms(programs.filter(p => p._id !== id));
            } else {
                alert('Failed to delete program');
            }
        } catch (e) {
            console.error('Error deleting program', e);
            alert('Error deleting program');
        }
    };

    const filteredPrograms = programs.filter(prog => {
        if (filterType === 'All') return true;
        return prog.programType === filterType;
    });

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link to="/ops-dashboard" className="hover:text-blue-600">Operations</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Programs</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d2129]">Academic Programs</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all course offerings and their details.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/program/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all text-decoration-none">
                        <Plus size={16} /> Add Program
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Filters */}
                <div className="flex items-center gap-2 mb-6">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium mr-2">Filter by Type:</span>
                    {['All', 'Skill', 'B.Voc'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${filterType === type
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading programs...</div>
                ) : filteredPrograms.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No programs found for {filterType !== 'All' ? `"${filterType}"` : ''}.</p>
                        <Link to="/program/new" className="text-blue-600 font-bold hover:underline mt-2 inline-block">Create a new program</Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <th className="px-6 py-4">Program Name</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Mode</th>
                                        <th className="px-6 py-4">Fees</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPrograms.map((prog) => (
                                        <tr key={prog._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{prog.programName}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{prog._id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${prog.programType === 'B.Voc' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                                                    {prog.programType || 'Skill'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {prog.duration ? `${prog.duration} ${prog.durationUnit || 'Years'}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {prog.mode || 'Regular'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {prog.fees ? `₹ ${prog.fees.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/program/${prog._id}/edit`}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit Program"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(prog._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Program"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
