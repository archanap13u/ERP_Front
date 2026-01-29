import React, { useEffect, useState } from 'react';
import { School, Building2, BookOpen, GraduationCap, FileCheck, TrendingUp, Megaphone, Bell, UserCheck, Clock, CheckCircle, ClipboardList, ArrowRight, UserPlus, Search, Users, Trash2 } from 'lucide-react';
import Workspace from '../components/Workspace';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import PollWidget from '../components/PollWidget';

export default function CenterDashboard() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [applications, setApplications] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [marks, setMarks] = useState<any[]>([]);
    const [filteredMarks, setFilteredMarks] = useState<any[]>([]);
    const [markSearch, setMarkSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [selectedUniversity, setSelectedUniversity] = useState<string>('All');
    const [selectedProgram, setSelectedProgram] = useState<string>('All');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCenterId, setUserCenterId] = useState(localStorage.getItem('study_center_id'));
    const [search, setSearch] = useState('');
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const centerName = localStorage.getItem('study_center_name') || searchParams.get('centerName');

    const fetchDashboardData = async (resolvedId?: string) => {
        try {
            const storageOrgId = localStorage.getItem('organization_id');
            const orgId = storageOrgId && storageOrgId !== 'null' && storageOrgId !== 'undefined' ? storageOrgId : null;

            const params = new URLSearchParams();
            if (orgId) params.append('organizationId', orgId);
            const queryParams = `?${params.toString()}`;

            const userRole = localStorage.getItem('user_role');
            const isCenterIsolated = userRole !== 'SuperAdmin' && userRole !== 'OrganizationAdmin' && userRole !== 'Operations' && userRole !== 'DepartmentAdmin';

            const centerParams = new URLSearchParams(params);
            if (centerName && isCenterIsolated) centerParams.append('studyCenter', centerName.trim());
            const centerQueryParams = `?${centerParams.toString()}`;

            const marksUrl = `/api/resource/internalmark${centerQueryParams}`;
            console.log(`[Dashboard] Fetching Marks from: ${marksUrl}`);

            const [resStd, resApp, resMarks, resAnn] = await Promise.all([
                fetch(`/api/resource/student${centerQueryParams}`),
                fetch(`/api/resource/studentapplicant${centerQueryParams}`),
                fetch(marksUrl),
                fetch(`/api/resource/opsannouncement${queryParams}`)
            ]);
            const [jsonStd, jsonApp, jsonMarks, jsonAnn] = await Promise.all([
                resStd.json(), resApp.json(), resMarks.json(), resAnn.json()
            ]);

            const apps = jsonApp.data || [];
            const stds = jsonStd.data || [];
            const mrks = jsonMarks.data || [];
            const rawAnns = jsonAnn.data || [];
            // STRICT FILTERING: Ensure we ONLY show data for this center
            // This is a safety net in case the backend returns loose data
            const targetCenterName = (centerName || '').trim().toLowerCase();
            const targetCenterId = (resolvedId || userCenterId || '').trim();

            const strictFilter = (item: any) => {
                if (!item.studyCenter && !item.studyCenterId) return false; // Orphaned data

                const itemName = (item.studyCenter || '').toString().trim().toLowerCase();
                const itemId = (item.studyCenterId || '').toString().trim();

                // Match by ID if available (most robust)
                if (targetCenterId && itemId && itemId === targetCenterId) return true;

                // Match by Name (case-insensitive)
                if (targetCenterName && itemName === targetCenterName) return true;

                return false;
            };

            const isolatedStudents = isCenterIsolated ? stds.filter(strictFilter) : stds;
            const isolatedMarks = isCenterIsolated ? mrks.filter(strictFilter) : mrks;
            const isolatedApps = isCenterIsolated ? apps.filter(strictFilter) : apps;

            setApplications(isolatedApps);
            setStudents(isolatedStudents);
            setFilteredStudents(isolatedStudents);
            setMarks(isolatedMarks);
            setFilteredMarks(isolatedMarks);
            console.log(`[Dashboard] Fetched Marks: ${mrks.length}`, mrks);

            // --- Respective Filtering Logic with Diagnostic Logging ---
            const currentCenter = (centerName || '').toString().trim().toLowerCase();
            const currentId = (resolvedId || userCenterId || '').toString().toLowerCase();

            console.log(`[Diagnostic] Dashboard Refresh for center: "${currentCenter}" (ID: "${currentId}")`);

            const filteredAnns = rawAnns.filter((ann: any) => {
                const target = (ann.targetStudyCenter || ann.targetCenter || '').toString().trim().toLowerCase();
                if (target === 'none' || !target || target === 'null') return false;

                const now = new Date();
                const startDate = ann.startDate ? new Date(ann.startDate) : null;
                const endDate = ann.endDate ? new Date(ann.endDate) : null;
                if (startDate && now < startDate) return false;
                if (endDate && now > endDate) return false;

                // Show announcements targeted to 'All' centers
                if (target === 'all') return true;

                const nameMatch = target === currentCenter;
                const idMatch = currentId && (target === currentId);

                const isVisible = !!(nameMatch || idMatch);

                if (isVisible) {
                    console.log(`[Diagnostic] MATCH FOUND: "${ann.title}" | Target: "${target}" | Reason: ${nameMatch ? 'Exact Name' : 'ID'}`);
                }

                return isVisible;
            }).sort((a: any, b: any) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            console.log(`[Diagnostic] Filtered: ${filteredAnns.length} / ${rawAnns.length}`);
            setAnnouncements(filteredAnns.slice(0, 3));
            // -------------------------------------------------------------

            setCounts({
                student: stds.length,
                application: apps.length,
                marks: jsonMarks.data?.length || 0,
                pending: apps.filter((a: any) => a.status === 'Draft').length,
                processing: apps.filter((a: any) => a.status === 'Processed').length +
                    stds.filter((s: any) => s.verificationStatus !== 'Approved by Accounts').length,
                completed: stds.filter((s: any) => s.verificationStatus === 'Approved by Accounts').length,
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const resolveId = async () => {
            const currentOrgId = localStorage.getItem('organization_id');
            if (centerName) {
                try {
                    const res = await fetch(`/api/resource/studycenter?organizationId=${currentOrgId || ''}`);
                    const json = await res.json();
                    const centers = json.data || [];
                    const searchStr = centerName.trim().toLowerCase();
                    const found = centers.find((c: any) => {
                        const dbName = (c.centerName || '').toString().trim().toLowerCase();
                        const dbUser = (c.username || '').toString().trim().toLowerCase();
                        return dbName === searchStr || dbUser === searchStr;
                    });
                    if (found) {
                        setUserCenterId(found._id);
                        localStorage.setItem('study_center_id', found._id);
                        return found._id;
                    }
                } catch (e) { console.error(e); }
            }
            return userCenterId || undefined;
        };

        const run = async () => {
            const id = await resolveId();
            await fetchDashboardData(id);
        };
        if (centerName) run();
    }, [centerName]);

    useEffect(() => {
        let result = students;

        // Apply Status Filter
        if (selectedStatus !== 'All') {
            result = result.filter(s => {
                const status = (s.verificationStatus || '').toString();
                if (selectedStatus === 'Approved') return status === 'Approved by Accounts';
                if (selectedStatus === 'Ops Approved') return status === 'Verified by Ops';
                if (selectedStatus === 'Pending') return status !== 'Approved by Accounts' && status !== 'Verified by Ops';
                return status === selectedStatus;
            });
        }

        // Apply University Filter
        if (selectedUniversity !== 'All') {
            result = result.filter(s => s.university === selectedUniversity);
        }

        // Apply Program Filter
        if (selectedProgram !== 'All') {
            result = result.filter(s => s.program === selectedProgram);
        }

        setFilteredStudents(result);
    }, [selectedStatus, selectedUniversity, selectedProgram, students]);

    useEffect(() => {
        // Re-fetch dashboard data when location.key changes (e.g., navigation to same route)
        fetchDashboardData();
    }, [location.key, centerName, userCenterId]); // Added centerName and userCenterId as dependencies for fetchDashboardData

    useEffect(() => {
        let result = marks;
        if (markSearch) {
            const s = markSearch.toLowerCase();
            result = result.filter(m =>
                (m.student || '').toLowerCase().includes(s) ||
                (m.subject || '').toLowerCase().includes(s)
            );
        }
        setFilteredMarks(result);
    }, [markSearch, marks]);

    const universities = Array.from(new Set(students.map(s => s.university).filter(Boolean))).sort();
    const programs = Array.from(new Set(students.map(s => s.program).filter(Boolean))).sort();

    const handleDeleteStudent = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this student record? This action cannot be undone.')) return;

        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/student/${id}?organizationId=${orgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setStudents(prev => prev.filter(s => s._id !== id));
            } else {
                alert('Failed to delete student record.');
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('An error occurred while deleting.');
        }
    };

    const handleDeleteMark = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this mark record?')) return;
        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/internalmark/${id}?organizationId=${orgId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMarks(prev => prev.filter(m => m._id !== id));
            } else {
                alert('Failed to delete mark record.');
            }
        } catch (e) {
            console.error('Delete error:', e);
            alert('An error occurred while deleting.');
        }
    };

    const masterCards = [
        { icon: GraduationCap, label: 'STUDENTS', count: counts.student || 0, href: '/student' },
        { icon: UserCheck, label: 'Internal Marks', count: counts.marks || 0, href: '/internalmark' },
        { icon: Bell, label: 'Notifications', count: 'View', href: '/notifications' },
    ];

    const shortcuts = [
        { label: 'Register STUDENT', href: `/student/new?studyCenter=${encodeURIComponent(centerName || '')}&studyCenterId=${userCenterId || ''}&redirect=/center-dashboard` },
        { label: 'Start STUDENT', href: `/studentapplicant/new?studyCenter=${encodeURIComponent(centerName || '')}&studyCenterId=${userCenterId || ''}&redirect=/center-dashboard` },
        { label: 'Submit Marks', href: `/internalmark/new?studyCenter=${encodeURIComponent(centerName || '')}&studyCenterId=${userCenterId || ''}&redirect=/center-dashboard` },

    ];

    const ApplicationBucket = ({ title, count, status, icon: Icon, color }: any) => (
        <div className={`p-5 rounded-2xl border border-[#d1d8dd] bg-white shadow-sm hover:shadow-md transition-all group cursor-pointer`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                    <Icon size={20} className={color} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">View All</span>
            </div>
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-tight">{title}</p>
            <div className="flex items-end justify-between mt-1">
                <h4 className="text-3xl font-black text-gray-900">{count}</h4>
                <div className="flex -space-x-2 pb-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400`}>
                            {i}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 text-[#1d2129] animate-in">
            <Workspace
                title={`${centerName || 'Center'} Hub`}
                newHref={`/student/new?studyCenter=${encodeURIComponent(centerName || '')}&studyCenterId=${userCenterId || ''}&redirect=/center-dashboard`}
                newLabel="Add STUDENT"
                summaryItems={[
                    { label: 'Total STUDENTS', value: loading ? '...' : counts.student, color: 'text-blue-500', doctype: 'student' },
                    { label: 'In Processing', value: loading ? '...' : counts.processing || 0, color: 'text-blue-500', doctype: 'studentapplicant' },
                    { label: 'Completed', value: loading ? '...' : counts.completed || 0, color: 'text-emerald-500', doctype: 'student' },
                ]}
                masterCards={masterCards}
                shortcuts={shortcuts}
            />

            <div className="max-w-6xl mx-auto space-y-8 text-[#1d2129]">
                {/* Announcements Feed Section */}
                <div className="bg-white p-6 rounded-2xl border border-[#d1d8dd] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Megaphone size={20} />
                            </div>
                            Important Announcements
                        </h3>
                        <Link to="/notifications" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading ? (
                            <div className="col-span-full py-12 flex justify-center">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400 italic text-[14px] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                No active announcements from Operations.
                            </div>
                        ) : (
                            announcements.map((ann, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border border-[#d1d8dd] hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full ${ann.pinned ? 'bg-orange-50/30 border-orange-200' : 'bg-white'}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[14px] font-bold text-gray-800 line-clamp-1">{ann.title}</h4>
                                            {ann.type === 'Poll' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Poll</span>}
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${ann.priority === 'High' ? 'bg-red-100 text-red-600' :
                                            ann.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>{ann.priority}</span>
                                    </div>
                                    <p className="text-[12px] text-gray-600 line-clamp-3 mb-4 flex-1">
                                        {ann.content || ann.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                            {new Date(ann.createdAt).toLocaleDateString()}
                                        </span>
                                        <Link to="/notifications" className="text-blue-600 text-[11px] font-bold hover:underline">
                                            Read More
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Inline Student Records List - NEW ADDITION */}
                <div className="bg-white rounded-2xl border border-[#d1d8dd] hidden shadow-sm   overflow-hidden mb-8">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-4">
                            <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                                <GraduationCap size={20} className="text-blue-600" />
                                Registered STUDENTS ({students.length})
                            </h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Status Buttons */}
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                    {['All', 'Approved', 'Ops Approved', 'Pending'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setSelectedStatus(status)}
                                            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${selectedStatus === status
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>

                                {/* University Dropdown */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">University:</span>
                                    <select
                                        value={selectedUniversity}
                                        onChange={(e) => setSelectedUniversity(e.target.value)}
                                        className="text-[12px] font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                                    >
                                        <option value="All">All Universities</option>
                                        {universities.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Program Dropdown */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Program:</span>
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => setSelectedProgram(e.target.value)}
                                        className="text-[12px] font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                                    >
                                        <option value="All">All Programs</option>
                                        {programs.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <Link to="/student" className="text-blue-600 text-[12px] font-bold hover:underline py-1 px-3 bg-white/50 rounded-lg border border-blue-100">
                            View Full List
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 italic">Loading students...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-bold text-gray-500">No {selectedStatus !== 'All' ? selectedStatus.toLowerCase() : ''} students found.</p>
                                {selectedStatus === 'All' && <Link to="/student/new" className="text-blue-600 font-bold text-[13px] hover:underline mt-2 inline-block">Add your first student →</Link>}
                            </div>
                        ) : (
                            filteredStudents.slice(0, 10).map((student: any) => (
                                <div key={student._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-200">
                                            {student.studentName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-black text-[14px] text-gray-900 group-hover:text-blue-600 transition-colors">{student.studentName || 'Unknown Student'}</p>
                                            <p className="text-[11px] text-gray-500 font-medium">
                                                {student.email || 'No email provided'} • {student.program || 'No program'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter border ${student.verificationStatus === 'Approved by Accounts' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            student.verificationStatus === 'Verified by Ops' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {student.verificationStatus === 'Approved by Accounts' ? 'Approved' :
                                                (student.verificationStatus === 'Verified by Ops' ? 'Approved by Operations' : 'Pending')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Link
                                                to={`/internalmark/new?student=${encodeURIComponent(student.studentName || '')}&studentId=${student._id}&program=${encodeURIComponent(student.program || '')}&studyCenter=${encodeURIComponent(centerName || '')}`}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-indigo-50 rounded-lg"
                                                title="Add Internal Marks"
                                            >
                                                <UserCheck size={16} />
                                            </Link>
                                            <Link to={`/student/${student._id}/edit`} className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg">
                                                <Search size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteStudent(student._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {filteredStudents.length > 10 && (
                            <div className="p-3 bg-gray-50 text-center">
                                <Link to="/student" className="text-[12px] font-bold text-gray-500 hover:text-blue-600">
                                    + {filteredStudents.length - 10} more students. View all.
                                </Link>
                            </div>
                        )}
                    </div>
                </div>


                {/* Internal Marks Records Section */}
                <div id="marks-record" className="bg-white rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden mb-8">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gradient-to-r from-indigo-50 to-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                                <FileCheck size={20} className="text-indigo-600" />
                                Internal Marks Record ({marks.length})
                            </h3>
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm max-w-sm">
                                <Search size={14} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Student or Subject..."
                                    className="text-[12px] font-medium outline-none w-full"
                                    value={markSearch}
                                    onChange={(e) => setMarkSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <Link to="/internalmark" className="text-indigo-600 text-[12px] font-bold hover:underline py-1 px-3 bg-white/50 rounded-lg border border-indigo-100">
                            View All Marks
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 italic">Loading marks...</div>
                        ) : filteredMarks.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <FileCheck size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-bold text-gray-500">No mark records found.</p>
                                <Link to="/internalmark/new" className="text-indigo-600 font-bold text-[13px] hover:underline mt-2 inline-block">Submit new marks →</Link>
                            </div>
                        ) : (
                            filteredMarks.slice(0, 5).map((mark: any) => (
                                <div key={mark._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</p>
                                            <p className="font-bold text-[13px] text-gray-900">{mark.student || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</p>
                                            <p className="font-bold text-[13px] text-indigo-600">{mark.subject}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</p>
                                            <p className="font-black text-[15px] text-gray-900">
                                                {mark.marksObtained} <span className="text-gray-400 text-[11px] font-bold">/ {mark.maxMarks}</span>
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semester/Batch</p>
                                            <p className="text-[12px] font-bold text-gray-600">
                                                {mark.semester || 'N/A'} • {mark.batch || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-4">
                                        <button
                                            onClick={() => handleDeleteMark(mark._id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg group-hover:opacity-100 opacity-0"
                                            title="Delete Mark Record"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <Link to={`/internalmark/${mark._id}/edit`} className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg group-hover:opacity-100 opacity-0">
                                            <Search size={16} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                        {filteredMarks.length > 5 && (
                            <div className="p-3 bg-gray-50 text-center">
                                <Link to="/internalmark" className="text-[12px] font-bold text-gray-500 hover:text-indigo-600">
                                    + {filteredMarks.length - 5} more records. View all marks.
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Student Intake Card */}
                    <div className="bg-white rounded-2xl border border-[#d1d8dd] shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 bg-gray-50/50 border-b border-[#d1d8dd] flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <UserPlus className="text-blue-600" size={24} />
                                STUDENTS & Records
                            </h3>
                            <Link to={`/student/new?studyCenter=${encodeURIComponent(centerName || '')}&studyCenterId=${userCenterId || ''}&redirect=/center-dashboard`} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[12px] font-black shadow-md hover:scale-105 transition-transform no-underline">
                                Add New STUDENT
                            </Link>
                        </div>
                        <div className="p-8 flex-1 flex flex-col justify-center text-center space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[18px] font-black text-[#1d2129]">Manage STUDENTS</h2>
                                    <p className="text-[12px] text-gray-500 font-medium tracking-tight">Track, monitor, and manage your student entries</p>
                                </div>
                            </div>
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <GraduationCap size={40} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Direct STUDENT Enrollment</h4>
                                <p className="text-gray-500 text-sm max-w-sm mx-auto">Skip the admission process and add student records directly to your roster.</p>
                            </div>
                            <div className="flex gap-4 justify-center pt-4">
                                <Link to="/student" className="text-blue-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                    View All STUDENTS <ArrowRight size={14} />
                                </Link>
                                <span className="text-gray-300">|</span>
                                <Link to="/internalmark/new" className="text-indigo-600 font-bold text-[13px] hover:underline flex items-center gap-1">
                                    Quick Submit Marks <UserCheck size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-gradient-to-br from-indigo-700 via-blue-800 to-blue-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-center">
                        <div className="relative z-10 space-y-4">
                            <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Support Portal</span>
                            <h3 className="text-3xl font-black leading-tight">Need assistance with<br />your portal?</h3>
                            <p className="text-white/70 text-[15px] leading-relaxed max-w-[340px]">Our Operations Hub is available to help with data corrections, university documents, or login issues.</p>
                            <div className="pt-4">
                                <button className="bg-white text-blue-900 px-8 py-3 rounded-xl font-black text-[14px] shadow-lg hover:scale-105 active:scale-95 transition-all">
                                    Contact Support Desk
                                </button>
                            </div>
                        </div>
                        <Building2 className="absolute right-[-40px] bottom-[-40px] text-white/5 rotate-12" size={240} />
                    </div>
                </div>

            </div>
        </div>
    );
}
