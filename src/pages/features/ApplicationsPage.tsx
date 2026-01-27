import React, { useEffect, useState } from 'react';
import { ClipboardList, ArrowRight, CheckCircle, XCircle, FileText } from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link } from 'react-router-dom';

export default function ApplicationsPage() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userRole = localStorage.getItem('user_role');
    const isGlobalRole = userRole === 'SuperAdmin' || userRole === 'OrganizationAdmin' || userRole === 'Operations';

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptId = localStorage.getItem('department_id');

                let queryParams = `?organizationId=${orgId || ''}`;
                if (deptId && !isGlobalRole) {
                    queryParams += `&departmentId=${deptId}`;
                }

                const res = await fetch(`/api/resource/studentapplicant${queryParams}`);
                const json = await res.json();
                const data = json.data || [];

                setCounts({
                    total: data.length,
                    applied: data.filter((a: any) => a.application_status === 'Applied').length,
                    approved: data.filter((a: any) => a.application_status === 'Approved').length,
                    rejected: data.filter((a: any) => a.application_status === 'Rejected').length,
                });

                setApplications(data.slice(0, 10));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleApprove = async (id: string, name: string) => {
        if (!confirm(`Approve application for ${name}?`)) return;
        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/studentapplicant/${id}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application_status: 'Approved' })
            });
            if (res.ok) {
                setApplications(prev => prev.map(app =>
                    app._id === id ? { ...app, application_status: 'Approved' } : app
                ));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="ADMISSIONS Applications"
                newHref="/studentapplicant/new"
                newLabel="New Application"
                summaryItems={[
                    { label: 'Total Applications', value: loading ? '...' : counts.total || 0, color: 'text-blue-500', doctype: 'studentapplicant' },
                    { label: 'Pending Review', value: loading ? '...' : counts.applied || 0, color: 'text-orange-500', doctype: 'studentapplicant' },
                    { label: 'Approved', value: loading ? '...' : counts.approved || 0, color: 'text-emerald-500', doctype: 'studentapplicant' },
                ]}
                masterCards={[
                    { label: 'All Applications', icon: ClipboardList, count: counts.total || 0, href: '/studentapplicant' },
                    { label: 'Enrollments', icon: CheckCircle, count: 'View', href: '/program-enrollment' },
                ]}
                shortcuts={[
                    { label: 'New Application', href: '/studentapplicant/new' },
                    { label: 'Review Pending', href: '/studentapplicant?status=Applied' },
                ]}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-[#d1d8dd] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-bold text-gray-500 uppercase">Pending</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{counts.applied || 0}</p>
                        </div>
                        <ClipboardList size={28} className="text-orange-200" />
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-[#d1d8dd] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-bold text-gray-500 uppercase">Approved</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-1">{counts.approved || 0}</p>
                        </div>
                        <CheckCircle size={28} className="text-emerald-200" />
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-[#d1d8dd] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-bold text-gray-500 uppercase">Rejected</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{counts.rejected || 0}</p>
                        </div>
                        <XCircle size={28} className="text-red-200" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <ClipboardList size={18} className="text-blue-600" />
                            Recent Applications
                        </h3>
                        <Link to="/studentapplicant" className="text-blue-600 text-[12px] font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {applications.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic text-[13px]">No applications found.</div>
                        ) : (
                            applications.map((app, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1d2129]">{app.student_name || 'Applicant Name'}</p>
                                            <p className="text-[11px] text-gray-500 font-mono">{app.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${app.application_status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                            app.application_status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {app.application_status || 'Applied'}
                                        </span>
                                        {app.application_status !== 'Approved' && (
                                            <button
                                                onClick={() => handleApprove(app._id, app.student_name)}
                                                className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-black hover:bg-emerald-700 shadow-sm"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-[16px] font-bold mb-4">Application Actions</h4>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/studentapplicant/new" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                            New Application
                        </Link>
                        <Link to="/program-enrollment/new" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                            Enroll APPLICATION
                        </Link>
                    </div>
                </div>
                <ClipboardList className="absolute right-[-20px] bottom-[-20px] text-white/10" size={120} />
            </div>
        </div>
    );
}
