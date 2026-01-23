import React, { useEffect, useState } from 'react';
import { School, Building2, BookOpen, GraduationCap, FileCheck, TrendingUp, Megaphone, CalendarDays, MapPin, Lock, ExternalLink, ArrowRight, UserPlus, Users, ClipboardList, Edit, Clock, Pin, Plus } from 'lucide-react';
import Workspace from '../components/Workspace';
import { Link } from 'react-router-dom';
import DepartmentStaffManager from '../components/DepartmentStaffManager';
import DepartmentWorkLog from '../components/DepartmentWorkLog';
import DepartmentStudentManager from '../components/DepartmentStudentManager';
import ApplicationPanel from '../components/ApplicationPanel';

export default function OpsDashboard() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({
        university: 0,
        student: 0,
        application: 0,
        studycenter: 0,
        employee: 0
    });
    const [loading, setLoading] = useState(true);
    const [centers, setCenters] = useState<any[]>([]);
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [centerStudentsCount, setCenterStudentsCount] = useState(0);
    const [employees, setEmployees] = useState<any[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [contextData, setContextData] = useState<{ id?: string, name?: string }>({});
    const [opsAnnouncements, setOpsAnnouncements] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);

    // Get features from localStorage (set during login)
    const userFeaturesRaw = localStorage.getItem('user_features');
    const userRole = localStorage.getItem('user_role');
    const panelType = localStorage.getItem('department_panel_type');
    const userFeatures: string[] = userFeaturesRaw ? JSON.parse(userFeaturesRaw) : [];
    const isOps = userRole === 'Operations' || userRole === 'SuperAdmin' || panelType === 'Operations' || panelType === 'Education';
    const hasFeature = (f: string) => isOps || userFeatures.length === 0 || userFeatures.includes(f);

    useEffect(() => {
        async function fetchData() {
            try {
                const storedOrgId = localStorage.getItem('organization_id');
                const orgId = (storedOrgId === 'null' || storedOrgId === 'undefined') ? null : storedOrgId;
                if (!orgId) {
                    setLoading(false);
                    return;
                }
                const deptId = localStorage.getItem('department_id');
                const deptName = localStorage.getItem('department_name');
                const userRole = localStorage.getItem('user_role');

                // Step 1: Fetch Departments for context resolution
                const resDept = await fetch(`/api/resource/department?organizationId=${orgId}`);
                const jsonDept = await resDept.json();
                const fetchedDepts = jsonDept.data || [];
                setDepartments(fetchedDepts);

                // Find Operations context
                const contextDept = fetchedDepts.find((d: any) => d.panelType === 'Operations' || d.panelType === 'Education');
                const effectiveDeptId = deptId || contextDept?._id;
                const effectiveDeptName = deptName || contextDept?.name;
                setContextData({ id: effectiveDeptId, name: effectiveDeptName });

                let baseUrl = `/api/resource`;
                let queryParams = `?organizationId=${orgId || ''}`;

                if (effectiveDeptId) queryParams += `&departmentId=${effectiveDeptId}`;
                // Removed name filter to avoid mismatch issues

                const [resUni, resStd, resApp, resCen, resEmp, resOpsAnn, resHol] = await Promise.all([
                    fetch(`${baseUrl}/university${queryParams}`),
                    fetch(`${baseUrl}/student${queryParams}`),
                    fetch(`${baseUrl}/studentapplicant${queryParams}`),
                    fetch(`${baseUrl}/studycenter${queryParams}`),
                    fetch(`${baseUrl}/employee${queryParams}`),
                    fetch(`${baseUrl}/opsannouncement${queryParams}`),
                    fetch(`${baseUrl}/holiday?organizationId=${orgId || ''}`)
                ]);
                const [jsonUni, jsonStd, jsonApp, jsonCen, jsonEmp, jsonOpsAnn, jsonHol] = await Promise.all([
                    resUni.json(), resStd.json(), resApp.json(), resCen.json(), resEmp.json(), resOpsAnn.json(), resHol.json()
                ]);

                setCounts({
                    university: jsonUni.data?.length || 0,
                    student: jsonStd.data?.length || 0,
                    application: jsonApp.data?.length || 0,
                    studycenter: jsonCen.data?.length || 0,
                    employee: jsonEmp.data?.length || 0
                });
                setEmployees(jsonEmp.data || []);
                setCenters(jsonCen.data || []);
                setOpsAnnouncements(jsonOpsAnn.data || []);
                setHolidays(jsonHol.data?.slice(0, 3) || []);

                // Store all students
                const allStds = jsonStd.data || [];
                setAllStudents(allStds);
                setAllStudents(allStds);
                // Filter for students needing Ops verification (Pending or Processing)
                const pendingOps = allStds.filter((s: any) =>
                    s.verificationStatus === 'Processing' ||
                    s.verificationStatus === 'Pending'
                );
                setPendingStudents(pendingOps);
                setCenterStudentsCount(allStds.filter((s: any) => s.studyCenter).length);
            } catch (e) {
                console.error('[OpsDashboard] Error:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);


    const allMasterCards = [
        { label: 'Universities', icon: School, count: '', href: '/university', feature: 'University' },
        { icon: Building2, label: 'Study Centers', count: '', href: '/studycenter', feature: 'Study Center' },
        { icon: BookOpen, label: 'Programs', count: '', href: '/program', feature: 'Programs' },
        { icon: ClipboardList, label: 'APPLICATIONS', count: '', href: '/studentapplicant', feature: 'APPLICATIONS' },
        { icon: GraduationCap, label: 'STUDENTS', count: '', href: '/student', feature: 'STUDENTS' },
        { icon: Megaphone, label: 'Ops Announcements', count: '', href: `/opsannouncement?department=${encodeURIComponent(contextData.name || 'Operations')}&departmentId=${contextData.id || ''}`, feature: 'Announcements' },
    ];

    const allShortcuts = [
        { label: 'New STUDENT', href: '/student/new', feature: 'STUDENTS' },
        { label: 'Add University', href: '/university/new', feature: 'University' },
        { label: 'Add Program', href: '/program/new', feature: 'Programs' },
        { label: 'Add Study Center', href: '/studycenter/new', feature: 'Study Center' },
        { label: 'Post Ops Announcement', href: `/opsannouncement/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}`, feature: 'Announcements' },
        { label: 'Login Portal URL', href: '/login', feature: 'Study Center' },
    ];

    const masterCards = allMasterCards.filter(c => hasFeature(c.feature));
    const shortcuts = allShortcuts.filter(s => hasFeature(s.feature));

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Ops Dashboard"
                newHref="/student/new"
                summaryItems={[
                    { label: 'Prospective APPLICATIONS', value: counts.application.toString(), color: 'text-blue-500', doctype: 'studentapplicant' },
                    { label: 'Center Students', value: centerStudentsCount.toString(), color: 'text-indigo-500', doctype: 'student' },
                    { label: 'Pending Verifications', value: pendingStudents.length.toString(), color: 'text-rose-500', doctype: 'student' },
                    { label: 'Total STUDENTS', value: counts.student.toString(), color: 'text-emerald-500', doctype: 'student' },
                ]}
                masterCards={masterCards}
                shortcuts={shortcuts}
            />

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Pending Ops Verifications (New Section) */}
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-rose-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <UserPlus size={18} className="text-rose-600" />
                            Pending Student Verifications
                        </h3>
                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {pendingStudents.length} PENDING
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                        {pendingStudents.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 italic text-[13px]">No students awaiting verification.</div>
                        ) : (
                            pendingStudents.map((student, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 text-rose-600 rounded">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1d2129]">{student.studentName}</p>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                                                <span>{student.studyCenter || 'Unknown Center'}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span>{student.program || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link to={`/student/${student._id}`} className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100" title="View Details">
                                            <ExternalLink size={14} />
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (!confirm(`Verify student ${student.studentName}? This will send them to Finance approval.`)) return;
                                                try {
                                                    const storedOrgId = localStorage.getItem('organization_id');
                                                    const orgId = (storedOrgId === 'null' || storedOrgId === 'undefined') ? '' : (storedOrgId || '');

                                                    const res = await fetch(`/api/resource/student/${student._id}?organizationId=${orgId}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ verificationStatus: 'Verified by Ops' })
                                                    });
                                                    if (res.ok) window.location.reload();
                                                    else {
                                                        const err = await res.json();
                                                        alert(`Error: ${err.error || 'Failed to approve student'}`);
                                                    }
                                                } catch (e) { console.error(e); }
                                            }}
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-blue-700 shadow-sm"
                                        >
                                            Verify & Forward
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {/* Recent Announcements Feed */}
                <div className="bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Megaphone size={20} />
                            </div>
                            Recent Ops Announcements
                        </h3>
                        <div className="flex items-center gap-4">
                            <Link to={`/opsannouncement/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}`} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-sm hover:scale-105 transition-transform no-underline">
                                Post New
                            </Link>
                            <Link to="/opsannouncement" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                View Full Feed <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {opsAnnouncements.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400 italic text-[14px] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                No announcements posted yet for Centers.
                            </div>
                        ) : (
                            opsAnnouncements.slice(0, 3).map((ann, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border border-[#d1d8dd] hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full ${ann.pinned ? 'bg-orange-50/30 border-orange-200' : 'bg-white'}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-[14px] font-bold text-gray-800 line-clamp-1">{ann.title}</h4>
                                        <div className="flex items-center gap-1">
                                            {ann.pinned && <Pin size={12} className="text-orange-500" />}
                                            {ann.priority === 'High' && (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">Urgent</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[12px] text-gray-600 line-clamp-3 mb-4 flex-1">
                                        {ann.content || ann.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                            {new Date(ann.createdAt).toLocaleDateString()}
                                        </span>
                                        <Link to={`/opsannouncement/${ann._id}`} className="text-blue-600 text-[11px] font-bold hover:underline">
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Holidays Section */}
                <div className="bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                <CalendarDays size={20} />
                            </div>
                            Upcoming Holidays
                        </h3>
                        <div className="flex gap-2">
                            <Link to="/holiday" className="text-blue-600 hover:text-blue-800 text-[13px] font-bold no-underline bg-blue-50 px-3 py-1.5 rounded-lg transition-all flex items-center">View Calendar</Link>
                            {isOps && (
                                <Link to={`/holiday/new?department=${encodeURIComponent(contextData.name || '')}&departmentId=${contextData.id || ''}`} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-100 no-underline">
                                    <Plus size={14} /> New
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {holidays.length === 0 && !loading ? (
                            <div className="col-span-full py-8 text-center text-gray-400 italic text-[13px]">
                                No upcoming holidays listed.
                            </div>
                        ) : (
                            holidays.map((hol, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-transparent hover:border-orange-100 transition-all">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100 min-w-[48px]">
                                        <span className="text-[10px] font-black text-orange-500 uppercase">{new Date(hol.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                        <span className="text-[16px] font-black text-gray-900 leading-none">{new Date(hol.date).getDate()}</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="text-[14px] font-bold text-[#1d2129] uppercase tracking-tight truncate">{hol.holidayName}</h4>
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter">{new Date(hol.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {hasFeature('APPLICATIONS') && (
                    <div className="lg:col-span-3 space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-2">
                                    <ClipboardList size={22} className="text-blue-600" />
                                    APPLICATIONS
                                </h3>
                                <p className="text-[13px] text-gray-500 font-bold mt-1">Center Student Verification</p>
                                <p className="text-[12px] text-gray-400">Reviewing student records submitted by study centers.</p>
                            </div>
                            <Link to="/studentapplicant" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                View All Applications <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden p-2">
                            <ApplicationPanel
                                departmentId={(userRole === 'Operations' || userRole === 'SuperAdmin') ? undefined : (localStorage.getItem('department_id') || undefined)}
                                organizationId={localStorage.getItem('organization_id') || undefined}
                            />
                        </div>
                    </div>
                )}

                {/* Inline Employee List View (Ops Staff) */}
                <div className="bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Users size={20} />
                            </div>
                            Operations Staff Directory
                        </h3>
                        <div className="flex items-center gap-4">
                            <Link to="/employee" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                View Full List <ArrowRight size={14} />
                            </Link>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={employeeSearch}
                                    onChange={(e) => setEmployeeSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-400 w-full md:w-64"
                                />
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 uppercase tracking-tighter text-[11px] font-black text-gray-400 bg-gray-50/50">
                                    <th className="px-4 py-3">Staff Member</th>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Designation</th>
                                    <th className="px-4 py-3">Department</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {employees
                                    .filter(emp =>
                                    (emp.employeeName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                                        emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                                        emp.designation?.toLowerCase().includes(employeeSearch.toLowerCase()))
                                    )
                                    .slice(0, 10).map((emp, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                                                        {emp.employeeName?.charAt(0)}
                                                    </div>
                                                    <span className="text-[13px] font-bold text-gray-700">{emp.employeeName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-gray-500 font-medium">{emp.employeeId}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100 uppercase">
                                                    {emp.designation}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-gray-500">{emp.department}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link to={`/employee/${emp._id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Edit size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {employees.length === 0 && (
                            <div className="py-12 text-center text-gray-400 italic text-[14px]">
                                No operations staff found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Operations Team Work Log */}
                <div className="mb-8">
                    <DepartmentWorkLog
                        departmentId={contextData.id}
                        organizationId={localStorage.getItem('organization_id') || ''}
                        title="Operations Team Work Log"
                    />
                </div>

                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <Building2 size={18} className="text-orange-600" />
                            Studycenter List & Login Portal
                        </h3>
                        <Link to="/studycenter" className="text-blue-600 text-[12px] font-medium hover:underline flex items-center gap-1">
                            Manage All Centers <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {centers.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 italic text-[13px]">
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading study centers...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p>No study centers found in your portal.</p>
                                        <Link to="/studycenter/new" className="text-blue-600 font-bold hover:underline">Click here to add one</Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            centers.map((center, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded">
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-black text-[#1d2129]">{center.centerName}</p>
                                                {(center.username || center.password) && (
                                                    <div className="flex items-center gap-1.5 ml-2">
                                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black border border-blue-100 flex items-center gap-1">
                                                            <Users size={10} /> {center.username}
                                                        </span>
                                                        <span className="text-[10px] bg-gray-50 text-gray-700 px-2 py-0.5 rounded font-black border border-gray-100 flex items-center gap-1">
                                                            <Lock size={10} /> {center.password}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                                <MapPin size={10} /> {center.location || 'Branch location not specified'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            to={`/student/new?studyCenter=${encodeURIComponent(center.centerName || center.name || '')}&studyCenterId=${center._id}&redirect=/ops-dashboard`}
                                            className="text-[11px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1.5 hover:bg-blue-100 transition-all shadow-sm no-underline"
                                            title="Add Student to this Center"
                                        >
                                            <UserPlus size={14} /> Add Student
                                        </Link>
                                        <Link
                                            to="/login"
                                            target="_blank"
                                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-black shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 no-underline"
                                        >
                                            <ExternalLink size={14} />
                                            Center Login
                                        </Link>
                                        <Link to={`/studycenter/${center._id}`} className="text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors">Settings</Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Show features badge for debugging/info */}
            {userFeatures.length > 0 && (
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap gap-1.5 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <span className="text-[11px] font-bold text-blue-600 mr-2">Active Features:</span>
                        {userFeatures.map(f => (
                            <span key={f} className="text-[10px] bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-100">{f}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* <div className="max-w-6xl mx-auto"> */}
            {/* <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2"> */}
            {/* <TrendingUp size={18} className="text-blue-600" /> */}
            {/* Admission Trends */}
            {/* </h3> */}
            {/* <div className="p-10 bg-white border-dashed border-2 border-gray-100 rounded-xl flex flex-col items-center justify-center min-h-[300px]"> */}
            {/* <GraduationCap size={48} className="text-gray-100 mb-4" /> */}
            {/* <p className="text-gray-400 font-medium">Monthly Enrollment Analytics</p> */}
            {/* <p className="text-[12px] text-gray-300">Data visualization module connecting...</p> */}
            {/* </div> */}
            {/* </div> */}

            {/* <div className="max-w-6xl mx-auto space-y-8">
                <DepartmentStaffManager
                    departmentId={contextData.id}
                    organizationId={localStorage.getItem('organization_id') || undefined}
                    title="Operations Team Access"
                    description="Manage credentials for operations staff."
                />

                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gradient-to-r from-violet-50 to-blue-50">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <GraduationCap size={20} className="text-violet-600" />
                            All Student Records ({allStudents.length})
                        </h3>
                        <div className="text-[10px] font-mono mt-1 text-gray-600">
                            Current Session Org ID: {localStorage.getItem('organization_id') || 'NULL'}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {allStudents.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No students found.</p>
                            </div>
                        ) : (
                            allStudents.map((student: any) => {
                                // Resolve Center Name if it's an ID
                                const centerObj = centers.find((c: any) => c._id === student.studyCenter || c.centerName === student.studyCenter);
                                const displayCenterName = centerObj ? centerObj.centerName : (student.studyCenter || 'Unknown Center');

                                return (
                                    <div key={student._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm">
                                                {student.studentName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[14px] text-gray-900">{student.studentName || 'Unknown'}</p>
                                                <p className="text-[12px] text-gray-500">
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {student.studyCenter && (
                                                <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-100 flex items-center gap-1">
                                                    <Building2 size={10} /> {displayCenterName}
                                                </span>
                                            )}
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${student.verificationStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                student.verificationStatus === 'Verified by Ops' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {student.verificationStatus || 'Pending'}
                                            </span>
                                            <Link to={`/student/${student._id}`} className="text-blue-600 text-[12px] font-medium hover:underline">View</Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <DepartmentStudentManager
                    departmentId={localStorage.getItem('department_id') || undefined}
                    organizationId={localStorage.getItem('organization_id') || undefined}
                    title="STUDENTS Enrollment & Support"
                    description="Hierarchical view of students and assigned mentors."
                />
            </div> */}
        </div>
    );
}
