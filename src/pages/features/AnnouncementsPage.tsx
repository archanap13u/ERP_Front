import React, { useEffect, useState } from 'react';
import { Megaphone, Bell, Pin, ArrowRight, Users, Edit, Trash2, Building2 } from 'lucide-react';
import PollWidget from '../../components/PollWidget';
import Workspace from '../../components/Workspace';
import { Link, useLocation } from 'react-router-dom';

interface AnnouncementsPageProps {
    doctype?: string;
}

export default function AnnouncementsPage({ doctype: propDoctype }: AnnouncementsPageProps) {
    const params = new URLSearchParams(useLocation().search);
    const doctype = propDoctype || 'announcement';
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'archive'>('active');
    const [userCenterId, setUserCenterId] = useState(localStorage.getItem('study_center_id'));
    const userRole = localStorage.getItem('user_role');
    const userCenterName = localStorage.getItem('study_center_name');
    const location = useLocation();

    const queryDeptName = params.get('department');
    const queryDeptId = params.get('departmentId');


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const res = await fetch(`/api/resource/announcement/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAnnouncements(prev => prev.filter(a => a._id !== id));
            } else {
                alert('Failed to delete announcement');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting announcement');
        }
    };

    // Targeted Filtering for Study Centers
    const filteredAnnouncements = announcements.filter(ann => {
        const now = new Date();
        const start = ann.startDate ? new Date(ann.startDate) : null;
        const end = ann.endDate ? new Date(ann.endDate) : null;

        let isTimeActive = true;
        if (filter === 'active') {
            isTimeActive = !!((!start || now >= start) && (!end || now <= end));
        } else if (filter === 'archive') {
            isTimeActive = !!(end && now > end);
        }

        if (userRole === 'StudyCenter') {
            const target = (ann.targetStudyCenter || ann.targetCenter || '').toString().trim().toLowerCase();
            const currentCenter = (userCenterName || '').toString().trim().toLowerCase();
            const currentId = (userCenterId || '').toString().toLowerCase();

            if (target === 'none' || !target) return false;

            const nameMatch = target === currentCenter;
            const idMatch = !!(currentId && (target === currentId));

            const isTargeted = nameMatch || idMatch;

            if (isTimeActive && isTargeted) {
                console.log(`[Diagnostic] PAGE MATCH: "${ann.title}" | Target: "${target}" | Reason: ${nameMatch ? 'Exact Name' : 'ID'}`);
            }

            return isTimeActive && isTargeted;
        }

        return isTimeActive;
    });



    // Unified Effect for Data Fetching and ID Resolution
    useEffect(() => {
        const resolveId = async () => {
            if (userRole === 'StudyCenter' && !userCenterId && userCenterName) {
                const orgId = localStorage.getItem('organization_id');
                console.log(`[Diagnostic] AnnouncementsPage Resolve for "${userCenterName}"`);
                try {
                    const res = await fetch(`/api/resource/studycenter?organizationId=${orgId || ''}`);
                    const json = await res.json();
                    const centers = json.data || [];

                    const searchStr = userCenterName.trim().toLowerCase();
                    const found = centers.find((c: any) => {
                        const dbName = (c.centerName || '').toString().trim().toLowerCase();
                        const dbUser = (c.username || '').toString().trim().toLowerCase();
                        return dbName === searchStr || dbUser === searchStr;
                    });

                    if (found) {
                        console.log('[Diagnostic] Resolved ID:', found._id);
                        setUserCenterId(found._id);
                    }
                } catch (e) {
                    console.error('[Diagnostic] Resolve Error:', e);
                }
            }
        };

        const fetchData = async () => {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptIdFromStorage = localStorage.getItem('department_id');
                const deptNameFromStorage = localStorage.getItem('department_name');

                let deptId = queryDeptId || deptIdFromStorage;
                let deptName = queryDeptName || deptNameFromStorage;

                if (userRole === 'StudyCenter' || doctype === 'opsannouncement') {
                    // Centers only see Ops announcements by default, or if explicitly requested as opsannouncement
                    const res = await fetch(`/api/resource/opsannouncement?organizationId=${orgId || ''}&studyCenter=${encodeURIComponent(userCenterName || '')}`);
                    const json = await res.json();
                    console.log(`[Diagnostic] Fetched ${json.data?.length || 0} Ops Announcements`);
                    setAnnouncements(json.data || []);
                } else {
                    const query = `?organizationId=${orgId || ''}${deptId ? `&departmentId=${deptId}` : ''}${deptName ? `&department=${encodeURIComponent(deptName)}` : ''}`;
                    const res = await fetch(`/api/resource/announcement${query}`);
                    const json = await res.json();
                    setAnnouncements(json.data || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const run = async () => {
            await resolveId();
            await fetchData();
        };
        run();
    }, [userRole, userCenterId, userCenterName, queryDeptName, queryDeptId]);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Announcements"
                newHref="/announcement/new"
                newLabel="Post Announcement"
                summaryItems={[
                    { label: 'Total Announcements', value: loading ? '...' : announcements.length || 0, color: 'text-blue-500', doctype: 'announcement' },
                    { label: 'Recent Posts', value: loading ? '...' : announcements.slice(0, 5).length, color: 'text-emerald-500', doctype: 'announcement' },
                ]}
                masterCards={[
                    { label: 'All Announcements', icon: Megaphone, count: announcements.length || 0, href: '/announcement' },
                    { label: 'Notifications', icon: Bell, count: 'View', href: '/notifications' },
                ]}
                shortcuts={[
                    { label: 'Post Announcement', href: '/announcement/new' },
                    { label: 'View Archive', href: '/announcement' },
                ]}
            />

            <div className="max-w-6xl mx-auto space-y-4">
                <div className="flex gap-4 border-b border-gray-200 pb-2 mb-4">
                    <button
                        onClick={() => setFilter('active')}
                        className={`text-[14px] font-bold pb-2 ${filter === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active Announcements
                    </button>
                    <button
                        onClick={() => setFilter('archive')}
                        className={`text-[14px] font-bold pb-2 ${filter === 'archive' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Archived (Expired)
                    </button>
                </div>

                {filteredAnnouncements.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
                        <Megaphone className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-gray-900 font-bold mb-1">No {filter === 'active' ? 'Active' : 'Archived'} Announcements</h3>
                        <p className="text-gray-500 text-[13px] mb-4">
                            {filter === 'active' ? 'Post your first announcement to keep everyone informed.' : 'Expired announcements will appear here.'}
                        </p>
                        {filter === 'active' && (
                            <Link to="/announcement/new" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-[13px] hover:bg-blue-700">
                                Create Announcement
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredAnnouncements.map((announcement, idx) => (
                        <div key={idx} className={`bg-white p-6 rounded-xl border ${announcement.priority === 'High' ? 'border-red-200 bg-red-50/30' : 'border-[#d1d8dd]'} shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${announcement.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {announcement.pinned ? <Pin size={20} /> : <Megaphone size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="text-[16px] font-bold text-[#1d2129]">{announcement.title || 'Untitled Announcement'}</h4>
                                        <p className="text-[11px] text-gray-500">
                                            Posted {announcement.posting_date ? new Date(announcement.posting_date).toLocaleDateString() : 'Recently'}
                                            {announcement.endDate && ` • Expires: ${new Date(announcement.endDate).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>
                                {announcement.pinned && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">Pinned</span>
                                )}
                                <div className="flex gap-2 ml-4">
                                    <Link to={`/announcement/${announcement._id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </Link>
                                    <button onClick={() => handleDelete(announcement._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[13px] text-gray-700 mb-4">{announcement.description || announcement.content || 'No description available.'}</p>

                            {/* Poll Rendering */}
                            {announcement.type === 'Poll' && (
                                <PollWidget
                                    announcement={announcement}
                                    voterId={localStorage.getItem('employee_id') || localStorage.getItem('user_id') || 'unknown'}
                                    doctype={doctype}
                                    onVoteSuccess={(updated: any) => {
                                        setAnnouncements(prev => prev.map(a => a._id === updated._id ? updated : a));
                                    }}
                                />
                            )}

                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    <Building2 size={12} /> {announcement.targetStudyCenter || announcement.targetCenter || 'All Centers'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-[16px] font-bold mb-4">Quick Actions</h4>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/announcement/new" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                            Post New Announcement
                        </Link>
                        <Link to="/announcement" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                            View All
                        </Link>
                    </div>
                </div>
                <Megaphone className="absolute right-[-20px] bottom-[-20px] text-white/10" size={120} />
            </div>
        </div>
    );
}
