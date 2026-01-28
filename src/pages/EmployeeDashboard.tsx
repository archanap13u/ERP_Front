import React, { useEffect, useState } from 'react';
import { UserCheck, CalendarDays, Megaphone, Clock, GraduationCap, Calendar, Trash2, Plus, ListTodo } from 'lucide-react';
import PollWidget from '../components/PollWidget';

export default function EmployeeDashboard() {
    const [name, setName] = useState('');
    const [empId, setEmpId] = useState('');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Use employee ID if available, otherwise fallback to username for voting checks
    const voterId = empId || name;

    const handleDeleteComplaint = async (id: string) => {
        if (!confirm('Are you sure you want to delete this complaint?')) return;
        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/complaint/${id}?organizationId=${orgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setComplaints(prev => prev.filter(c => c._id !== id));
            } else {
                alert('Failed to delete complaint');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting complaint');
        }
    };


    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        const storedId = localStorage.getItem('employee_id');
        const mongoId = localStorage.getItem('user_id');
        setName(storedName || 'Staff Member');
        setEmpId(storedId || '');

        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptId = localStorage.getItem('department_id');
                const userRole = localStorage.getItem('user_role');

                // For regular employees/students, filter by department. 
                // For Admins (HR, DeptAdmin, Ops), verify all announcements (Global access).
                const isRestricted = userRole === 'Employee' || userRole === 'Student';
                const baseQuery = `?organizationId=${orgId || ''}`;
                const annQuery = `${baseQuery}${isRestricted && deptId ? `&departmentId=${deptId}` : ''}`;
                const holQuery = baseQuery; // Holidays are always org-wide in our inheritance model

                // [Fix] Only fetch complaints if we have a valid Employee ID. 
                // "My Recent Complaints" should strictly be the user's own.
                // If I am Admin/HR without an employee ID, I should see NONE here, not ALL.
                let compPromise: Promise<any> = Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
                const timestamp = new Date().getTime(); // Cache busting

                if (storedId) {
                    const compQuery = `${baseQuery}&employeeId=${storedId}${storedName ? `&employeeName=${encodeURIComponent(storedName)}` : ''}&_t=${timestamp}`;
                    console.log(`[EmployeeDashboard] Fetching complaints for ID: ${storedId} with query: ${compQuery}`);
                    compPromise = fetch(`/api/resource/complaint${compQuery}`);
                } else if (storedName && userRole !== 'Student') {
                    // Fallback for Dept Admins (Operations/HR) who want to see their own complaints
                    const compQuery = `${baseQuery}&username=${encodeURIComponent(storedName)}&_t=${timestamp}`;
                    console.log(`[EmployeeDashboard] Fetching complaints for Dept Admin (Username): ${storedName}`);
                    compPromise = fetch(`/api/resource/complaint${compQuery}`);
                } else {
                    console.warn('[EmployeeDashboard] No Employee ID found and not a Dept Admin. Skipping complaint fetch.');
                }


                let taskPromise: Promise<any> = Promise.resolve({ json: () => Promise.resolve({ data: [] }) });
                if (mongoId) {
                    const taskQuery = `${baseQuery}&assignedTo=${mongoId}&_t=${timestamp}`;
                    taskPromise = fetch(`/api/resource/task${taskQuery}`);
                }

                const [resAnn, resHol, resComp, resTask] = await Promise.all([
                    fetch(`/api/resource/announcement${annQuery}`),
                    fetch(`/api/resource/holiday${holQuery}`),
                    compPromise,
                    taskPromise
                ]);
                const [jsonAnn, jsonHol, jsonComp, jsonTask] = await Promise.all([resAnn.json(), resHol.json(), resComp.json(), resTask.json()]);

                // Filter announcements by date
                const now = new Date();
                const validAnnouncements = (jsonAnn.data || []).filter((a: any) => {
                    if (a.department === 'None') return false;
                    if (!a.startDate || !a.endDate) return true; // Show if no dates set (legacy support)
                    const start = new Date(a.startDate);
                    const end = new Date(a.endDate);
                    return now >= start && now <= end;
                });

                // Client-Side Double Check: Ensure privacy even if API leaks
                const safeComplaints = (jsonComp.data || []).filter((c: any) => {
                    // 1. If I have an EmployeeID, this complaint MUST match it
                    if (storedId) {
                        return c.employeeId === storedId;
                    }
                    // 2. If I am a Dept Admin (no EmpID), this complaint MUST match my Username AND have no EmployeeID
                    if (storedName && !storedId) {
                        return c.username === storedName || (!c.employeeId && c.employeeName === storedName);
                    }
                    return false;
                });

                setAnnouncements(validAnnouncements);
                setHolidays(jsonHol.data || []);
                setComplaints(safeComplaints); // Use the filtered list
                setTasks(jsonTask.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-[#1d2129] flex items-center gap-2">
                        Staff Portal
                        <span className="text-[12px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black uppercase text-center min-w-[60px]">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                    </h1>
                    <p className="text-[13px] text-gray-400 mt-1">Welcome back, <span className="font-bold text-gray-600">{name}</span></p>
                </div>
                {/* Profile Card / ID */}
                <div className="bg-white px-4 py-2 rounded-xl border border-dashed border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[12px]">
                        {name.charAt(0)}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Employee ID</p>
                        <span className="font-bold text-[12px] text-gray-700">{empId || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Announcements & Quick Actions (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden min-h-[400px]">
                        <div className="px-6 py-4 border-b border-[#d1d8dd] bg-gradient-to-r from-gray-50/50 to-white flex items-center gap-2">
                            <Megaphone size={16} className="text-blue-600" />
                            <h2 className="font-bold text-[14px]">Announcements & Community</h2>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Megaphone size={32} className="mx-auto text-gray-200 mb-3" />
                                    <p className="text-gray-400 italic text-[13px]">No active announcements for your department.</p>
                                </div>
                            ) : (
                                announcements.map((ann, idx) => {
                                    const isPoll = ann.type === 'Poll';
                                    return (
                                        <div key={idx} className="group mb-8 last:mb-0">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-[15px] font-black text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                    {ann.title}
                                                    {isPoll && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Poll</span>}
                                                </h3>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{new Date(ann.date || ann.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            <p className="text-[13px] text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                                            {isPoll && (
                                                <div className="mt-4">
                                                    <PollWidget
                                                        announcement={ann}
                                                        voterId={voterId}
                                                        doctype="announcement"
                                                        onVoteSuccess={(updated: any) => {
                                                            setAnnouncements(prev => prev.map(p => p._id === updated._id ? updated : p));
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-50">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[8px] flex items-center justify-center font-black border border-blue-100">HR</div>
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Post by {ann.postedBy || 'Human Resources'}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button className="p-4 bg-white border border-[#d1d8dd] rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-blue-400 transition-all text-left group">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-[14px]">Log Attendance</p>
                                <p className="text-[11px] text-gray-500 font-medium">Submit your daily entry</p>
                            </div>
                        </button>
                        <button
                            onClick={() => window.location.href = '/leaverequest/new'}
                            className="p-4 bg-white border border-[#d1d8dd] rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-blue-400 transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-[14px]">Leave Request</p>
                                <p className="text-[11px] text-gray-500 font-medium">Apply for time off</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right Column: Holidays & Complaints */}
                <div className="space-y-6">
                    {/* My Assigned Tasks Card */}
                    <section className="bg-white rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#d1d8dd] bg-gradient-to-r from-rose-50/50 to-white flex items-center gap-2">
                            <ListTodo size={16} className="text-rose-600" />
                            <h2 className="font-bold text-[14px]">My Assigned Tasks</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-12 bg-gray-50 rounded-xl"></div>
                                    <div className="h-12 bg-gray-50 rounded-xl"></div>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <ListTodo size={24} className="mx-auto text-gray-200 mb-2" />
                                    <p className="text-gray-400 italic text-[12px]">No tasks assigned to you.</p>
                                </div>
                            ) : (
                                tasks.slice(0, 5).map((task, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all cursor-pointer ${task.verificationStatus === 'Rejected' ? 'bg-red-50 hover:bg-red-100 hover:border-red-200' :
                                            task.verificationStatus === 'Approved' ? 'bg-green-50 hover:bg-green-100 hover:border-green-200' :
                                                'bg-gray-50/50 hover:bg-white hover:border-rose-100'
                                            }`}
                                        onClick={() => window.location.href = `/task/${task._id}`}
                                    >
                                        <div className={`w-2 h-10 rounded-full shrink-0 ${task.priority === 'Urgent' || task.priority === 'High' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[13px] font-bold text-gray-800 truncate">{task.subject}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    task.status === 'Working' ? 'bg-blue-100 text-blue-700' :
                                                        task.status === 'Pending Review' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">{task.exp_end_date ? new Date(task.exp_end_date).toLocaleDateString() : 'No date'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Upcoming Holidays Card */}
                    <section className="bg-white rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#d1d8dd] bg-gradient-to-r from-orange-50/50 to-white flex items-center gap-2">
                            <CalendarDays size={16} className="text-orange-500" />
                            <h2 className="font-bold text-[14px]">Upcoming Holidays</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-12 bg-gray-50 rounded-xl"></div>
                                    <div className="h-12 bg-gray-50 rounded-xl"></div>
                                </div>
                            ) : holidays.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <CalendarDays size={24} className="mx-auto text-gray-200 mb-2" />
                                    <p className="text-gray-400 italic text-[12px]">No upcoming holidays.</p>
                                </div>
                            ) : (
                                holidays.slice(0, 5).map((hol, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-transparent hover:border-orange-100 hover:bg-white transition-all">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center border border-gray-100 shrink-0">
                                            <span className="text-[9px] font-black text-orange-500 uppercase">{new Date(hol.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                            <span className="text-[14px] font-black text-gray-900 leading-none">{new Date(hol.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-[13px] font-bold text-gray-800 truncate">{hol.holidayName}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(hol.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Recent Complaints Card */}
                    <section className="bg-white rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#d1d8dd] bg-gradient-to-r from-red-50/50 to-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Megaphone size={16} className="text-red-600" />
                                <h2 className="font-bold text-[14px]">My Personal Complaints</h2>
                            </div>
                            <button
                                onClick={() => window.location.href = '/complaint/new?redirect=/employee-dashboard'}
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="File New Complaint"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {loading ? (
                                <div className="animate-pulse flex gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                                    <div className="flex-1 h-10 bg-gray-100 rounded-xl"></div>
                                </div>
                            ) : complaints.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 italic text-[12px]">No complaints filed.</p>
                                </div>
                            ) : (
                                complaints.slice(0, 3).map((comp, idx) => (
                                    <div key={idx} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-100 transition-all flex items-center justify-between group">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-[13px] font-bold text-gray-800 truncate">{comp.subject}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'Resolved' ? 'bg-green-500' :
                                                    comp.status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`}></span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{comp.status}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComplaint(comp._id)}
                                            className="text-gray-300 hover:text-red-500 p-1 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>




        </div>
    );
}
