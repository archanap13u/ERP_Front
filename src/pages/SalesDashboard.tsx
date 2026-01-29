import React, { useEffect, useState } from 'react';
import {
    Users,
    Clock,
    Building2,
    ArrowRight,
    Edit,
    Megaphone,
    Briefcase,
    Calendar,
    CheckCircle2,
    MessageSquare,
    ClipboardList,
    AlertCircle,
    GraduationCap,
    BadgeDollarSign,
    TrendingUp,
    Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Workspace from '../components/Workspace';
import CustomizationModal from '../components/CustomizationModal';

export default function SalesDashboard() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [features, setFeatures] = useState<string[]>([]);
    const [contextData, setContextData] = useState<{ id?: string, name?: string }>({});

    const deptId = localStorage.getItem('department_id');
    const orgId = localStorage.getItem('organization_id');

    useEffect(() => {
        const storedFeatures = localStorage.getItem('user_features');
        if (storedFeatures) {
            try {
                setFeatures(JSON.parse(storedFeatures));
            } catch (e) {
                console.error(e);
            }
        }

        async function fetchData() {
            if (!orgId) return;
            try {
                // Fetch all departments to find the Sales one if deptId is not set (e.g. Org Admin view)
                const resDept = await fetch(`/api/resource/department?organizationId=${orgId}`);
                const jsonDept = await resDept.json();
                const fetchedDepts = jsonDept.data || [];

                let contextDept = fetchedDepts.find((d: any) => d.panelType === 'Sales');
                let effectiveDeptId = deptId || contextDept?._id;
                let effectiveDeptName = localStorage.getItem('department_name') || contextDept?.name;

                setContextData({ id: effectiveDeptId, name: effectiveDeptName });

                const baseUrl = `/api/resource`;
                const params = `?organizationId=${orgId}`;
                const deptParams = `${params}${effectiveDeptId ? `&departmentId=${effectiveDeptId}` : ''}`;

                const fetchPromises = [
                    fetch(`${baseUrl}/employee${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/attendance${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/task${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/announcement${params}${effectiveDeptId ? `&departmentId=${effectiveDeptId}` : ''}`).then(r => r.json()),
                    fetch(`${baseUrl}/complaint${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/leave-request${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/studycenter${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/student${deptParams}`).then(r => r.json()),
                    fetch(`${baseUrl}/paymententry${deptParams}`).then(r => r.json())
                ];

                if (effectiveDeptId) {
                    fetchPromises.push(fetch(`${baseUrl}/department/${effectiveDeptId}?organizationId=${orgId}`).then(r => r.json()));
                }

                const results = await Promise.all(fetchPromises);
                const [jsonEmp, jsonAtt, jsonTask, jsonAnn, jsonComp, jsonLeave, jsonCenters, jsonStudents, jsonPayments] = results;
                const jsonFeatures = effectiveDeptId ? results[9] : null;

                setEmployees(jsonEmp.data?.slice(0, 5) || []);
                setTasks(jsonTask.data?.slice(0, 5) || []);
                setAnnouncements(jsonAnn.data?.slice(0, 3) || []);

                // Today's attendance count
                const today = new Date().toISOString().split('T')[0];
                const presentToday = jsonAtt.data?.filter((a: any) => a.date?.startsWith(today) && a.status === 'Present').length || 0;

                // Revenue calculation
                const revenue = jsonPayments.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

                setCounts({
                    employee: jsonEmp.data?.length || 0,
                    present: presentToday,
                    task: jsonTask.data?.filter((t: any) => t.status !== 'Completed').length || 0,
                    complaint: jsonComp.data?.filter((c: any) => c.status !== 'Resolved').length || 0,
                    leave: jsonLeave.data?.filter((l: any) => l.status === 'Pending').length || 0,
                    centers: jsonCenters.data?.length || 0,
                    students: jsonStudents.data?.length || 0,
                    revenue: revenue
                });

                if (jsonFeatures?.data?.features) {
                    setFeatures(jsonFeatures.data.features);
                    localStorage.setItem('user_features', JSON.stringify(jsonFeatures.data.features));
                }

            } catch (e) {
                console.error("[Sales Staff Portal] Fetch failed:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [orgId, deptId]);

    const hasFeature = (feat: string) => {
        return features.includes(feat);
    };

    const handleSaveFeatures = async (newFeatures: string[]) => {
        try {
            const res = await fetch(`/api/resource/department/${deptId}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: newFeatures })
            });

            if (res.ok) {
                localStorage.setItem('user_features', JSON.stringify(newFeatures));
                setFeatures(newFeatures);
                setIsCustomizing(false);
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const summaryItems = [
        { label: 'Total Leads', value: loading ? '...' : counts.centers || 0, color: 'text-orange-600', doctype: 'studycenter', feature: 'Study Center' },
        { label: 'Total Staff', value: loading ? '...' : counts.employee || 0, color: 'text-blue-600', doctype: 'employee', feature: 'Employee List' },
    ].filter(i => hasFeature(i.feature));

    const masterCards = [
        { label: 'Leads (Centers)', icon: Building2, count: counts.centers?.toString(), href: `/studycenter`, color: 'bg-orange-50 text-orange-600', feature: 'Study Center' },
        { label: 'Staff List', icon: Users, count: counts.employee?.toString(), href: `/employee?departmentId=${contextData.id || ''}`, color: 'bg-blue-50 text-blue-600', feature: 'Employee List' },
        { label: 'Attendance', icon: Clock, count: counts.present?.toString(), href: `/attendance?departmentId=${contextData.id || ''}`, color: 'bg-emerald-50 text-emerald-600', feature: 'Attendance' },
        { label: 'Dept Tasks', icon: ClipboardList, count: counts.task?.toString(), href: `/task?departmentId=${contextData.id || ''}`, color: 'bg-orange-50 text-orange-600', feature: 'Tasks' },
    ].filter(c => hasFeature(c.feature));

    const shortcuts = [
        { label: 'Add New Lead (Center)', href: '/studycenter/new', feature: 'Study Center' },
        { label: 'Add Staff Member', href: '/employee/new', feature: 'Employee List' },
    ].filter(s => hasFeature(s.feature));

    return (
        <div className="space-y-8 pb-20">
            <Workspace
                title="SALES WORKSPACE Staff Portal"
                newHref="/employee/new"
                newLabel="Add Staff"
                onCustomize={() => setIsCustomizing(true)}
                summaryItems={summaryItems}
                masterCards={masterCards}
                shortcuts={shortcuts}
            />

            <CustomizationModal
                isOpen={isCustomizing}
                onClose={() => setIsCustomizing(false)}
                currentFeatures={features}
                onSave={handleSaveFeatures}
                title="Portal Customization"
            />

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Staff Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Users size={20} />
                            </div>
                            Recent Staff
                        </h3>
                        <Link to={`/employee?departmentId=${contextData.id || ''}`} className="text-blue-600 text-[13px] font-medium hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-4 flex-1">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl" />)}
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic">No staff records found.</div>
                        ) : (
                            employees.map((emp, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-transparent hover:border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                            {emp.fullName?.charAt(0) || 'E'}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#1d2129]">{emp.fullName}</p>
                                            <p className="text-[12px] text-gray-500">{emp.designation}</p>
                                        </div>
                                    </div>
                                    <Link to={`/employee/${emp._id}`} className="text-gray-400 hover:text-blue-600">
                                        <Edit size={16} />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                <ClipboardList size={20} />
                            </div>
                            Active Tasks
                        </h3>
                        <Link to="/task" className="text-blue-600 text-[13px] font-medium hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-4 flex-1">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl" />)}
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic">No active tasks found.</div>
                        ) : (
                            tasks.map((task, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-transparent hover:border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                            <ClipboardList size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#1d2129] line-clamp-1">{task.title}</p>
                                            <p className="text-[12px] text-gray-500">{task.priority} Priority</p>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${task.status === 'Working' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Announcements Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Megaphone size={20} />
                            </div>
                            Department News
                        </h3>
                    </div>
                    <div className="space-y-6">
                        {announcements.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic text-[14px]">No recent announcements.</div>
                        ) : (
                            announcements.map((ann, idx) => (
                                <div key={idx} className="pl-4 border-l-4 border-purple-400">
                                    <h4 className="text-[15px] font-bold text-[#1d2129]">{ann.title}</h4>
                                    <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                                    <p className="text-[11px] text-gray-400 mt-2 uppercase font-black">{new Date(ann.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Stats Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                <TrendingUp size={20} />
                            </div>
                            Portal Stats
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Attendance Rate</p>
                                <p className="text-2xl font-black text-emerald-600">{counts.employee > 0 ? Math.round((counts.present / counts.employee) * 100) : 0}%</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[11px] font-bold text-red-800 uppercase tracking-widest mb-1">Open Complaints</p>
                            <p className="text-2xl font-black text-red-900">{counts.complaint}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-[11px] font-bold text-orange-800 uppercase tracking-widest mb-1">Pending Leaves</p>
                            <p className="text-2xl font-black text-orange-900">{counts.leave}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

