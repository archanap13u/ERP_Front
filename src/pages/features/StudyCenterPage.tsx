import React, { useEffect, useState } from 'react';
import { Building, MapPin, Users, ArrowRight, ExternalLink, Lock } from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link } from 'react-router-dom';

export default function StudyCenterPage() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [centers, setCenters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptId = localStorage.getItem('department_id');

                let queryParams = `?organizationId=${orgId || ''}`;
                // Study Centers are organization-wide, not department-specific
                // Do NOT filter by departmentId

                console.log('[StudyCenterPage] Fetching centers with query:', queryParams);
                // Using 'studycenter' doctype
                const res = await fetch(`/api/resource/studycenter${queryParams}`);
                const json = await res.json();
                console.log('[StudyCenterPage] Received centers:', json.data?.length || 0, 'centers');
                const data = json.data || [];

                setCounts({
                    total: data.length,
                });

                setCenters(data);

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
            <Workspace
                title="Study Centers"
                newHref="/studycenter/new"
                newLabel="Add Center"
                summaryItems={[
                    { label: 'Total Centers', value: loading ? '...' : counts.total || 0, color: 'text-blue-500', doctype: 'studycenter' },
                ]}
                masterCards={[
                    { label: 'All Centers', icon: Building, count: counts.total || 0, href: '/studycenter' },
                    { label: 'Staff', icon: Users, count: 'Manage', href: '/employee' },
                ]}
                shortcuts={[
                    { label: 'Add New Center', href: '/studycenter/new' },
                    { label: 'View Map', href: '/branch-map' },
                ]}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <Building size={18} className="text-orange-600" />
                            Active Study Centers
                        </h3>
                        <Link to="/studycenter" className="text-blue-600 text-[12px] font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {centers.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic text-[13px]">No study centers found.</div>
                        ) : (
                            centers.map((center, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded">
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-bold text-[#1d2129]">{center.centerName || 'Center Name'}</p>
                                                {(center.username || center.password) && (
                                                    <div className="flex items-center gap-1.5 ml-2">
                                                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-100 flex items-center gap-1">
                                                            <Users size={10} /> {center.username || '---'}
                                                        </span>
                                                        <span className="text-[9px] bg-gray-50 text-gray-700 px-1.5 py-0.5 rounded font-bold border border-gray-100 flex items-center gap-1">
                                                            <Lock size={10} /> {center.password || '---'}
                                                        </span>
                                                        <Link to="/login" target="_blank" className="text-indigo-600 hover:text-indigo-800 p-0.5 hover:bg-indigo-50 rounded" title="Open Login Portal">
                                                            <ExternalLink size={12} />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                                <MapPin size={10} /> {center.location || 'No location provided'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            to="/login"
                                            target="_blank"
                                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-black shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 no-underline"
                                        >
                                            <ExternalLink size={14} />
                                            Center Login
                                        </Link>
                                        <Link to={`/studycenter/${center._id}`} className="text-[11px] font-bold text-blue-600 hover:underline">Edit</Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-[16px] font-bold mb-4">Center Management</h4>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/studycenter/new" className="bg-white text-orange-600 px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm hover:bg-orange-50 no-underline transition-all">
                            Add New Center
                        </Link>
                        <Link to="/login" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline border border-white/30">
                            Open Login Portal
                        </Link>
                    </div>
                </div>
                <Building className="absolute right-[-20px] bottom-[-20px] text-white/10" size={120} />
            </div>
        </div>
    );
}
