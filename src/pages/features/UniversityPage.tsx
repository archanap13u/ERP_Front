import React, { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Users, ArrowRight, Building, Plus, MapPin, Award, Trash2 } from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link } from 'react-router-dom';

export default function UniversityPage() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [universities, setUniversities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete university: ${name}?`)) return;

        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/university/${id}?organizationId=${orgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setUniversities(prev => prev.filter(u => u._id !== id));
                setCounts(prev => ({
                    ...prev,
                    total: (prev.total || 0) - 1,
                    active: universities.find(u => u._id === id)?.enabled ? (prev.active || 0) - 1 : (prev.active || 0)
                }));
            } else {
                const err = await res.json();
                alert(`Failed to delete: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error deleting university:', err);
            alert('Failed to connect to server');
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptId = localStorage.getItem('department_id');

                let queryParams = `?organizationId=${orgId || ''}`;
                if (deptId) {
                    queryParams += `&departmentId=${deptId}`;
                }

                const res = await fetch(`/api/resource/university${queryParams}`);
                const json = await res.json();
                const data = json.data || [];

                setCounts({
                    total: data.length,
                    active: data.filter((u: any) => u.enabled).length,
                });

                setUniversities(data);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link to="/ops-dashboard" className="hover:text-blue-600">Operations</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Universities</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d2129]">Partner Universities</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all affiliated universities and study centers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-4 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                            <p className="text-lg font-bold text-blue-600">{loading ? '...' : counts.total || 0}</p>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold">Active</p>
                            <p className="text-lg font-bold text-emerald-600">{loading ? '...' : counts.active || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-2">
                        <GraduationCap size={20} className="text-blue-600" />
                        Partner Universities
                    </h3>
                    <Link to="/university/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors">
                        <Plus size={16} /> Add University
                    </Link>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400 italic">Loading universities...</div>
                ) : universities.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-dashed border-gray-300 rounded-xl">
                        <GraduationCap size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No universities found.</p>
                        <p className="text-[13px] text-gray-400 mb-6">Start by adding a partner university.</p>
                        <Link to="/university/new" className="text-blue-600 font-bold hover:underline">Add First University</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {universities.map((uni) => (
                            <Link to={`/university/${uni._id}`} key={uni._id} className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                                {/* Banner Area */}
                                <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
                                    {uni.bannerImage ? (
                                        <img src={uni.bannerImage} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                            <Building size={64} />
                                        </div>
                                    )}

                                    {/* Delete Button - Visible on Hover */}
                                    <button
                                        onClick={(e) => handleDelete(e, uni._id, uni.universityName)}
                                        className="absolute top-3 right-3 p-2 bg-white/90 text-gray-400 hover:text-red-600 rounded-lg shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border border-gray-100"
                                        title="Delete University"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    {/* Logo Overlay */}
                                    <div className="absolute -bottom-8 left-6">
                                        <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md border border-gray-100">
                                            {uni.logo ? (
                                                <img src={uni.logo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                                            ) : (
                                                <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                                                    {uni.universityName?.[0] || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="pt-10 px-6 pb-6">
                                    <div className="mb-3">
                                        <h4 className="text-[16px] font-bold text-[#1d2129] group-hover:text-blue-600 transition-colors line-clamp-1" title={uni.universityName}>
                                            {uni.universityName}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1">
                                            {uni.country && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} /> {uni.country}
                                                </span>
                                            )}
                                            {uni.country && uni.accreditations && <span>•</span>}
                                            {uni.accreditations && (
                                                <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    <Award size={10} /> {uni.accreditations}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {uni.description && (
                                        <p className="text-[12px] text-gray-500 line-clamp-2 mb-4 h-9 leading-relaxed">
                                            {uni.description}
                                        </p>
                                    )}

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                            View Details
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
