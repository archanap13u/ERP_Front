import React, { useEffect, useState } from 'react';
import { Bell, Megaphone, Pin, Clock, User } from 'lucide-react';
import PollWidget from '../../components/PollWidget';
import Workspace from '../../components/Workspace';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCenterId, setUserCenterId] = useState(localStorage.getItem('study_center_id'));

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const orgId = localStorage.getItem('organization_id');
                const userCenter = localStorage.getItem('study_center_name');
                const userRole = localStorage.getItem('user_role');

                if (!orgId) return;

                const deptIdFromStorage = localStorage.getItem('department_id');
                const deptNameFromStorage = localStorage.getItem('department_name');

                let deptId = deptIdFromStorage;
                let deptName = deptNameFromStorage;

                // Fallback for Admins
                if (!deptName && (userRole === 'OrganizationAdmin' || userRole === 'SuperAdmin')) {
                    const path = location.pathname;
                    if (path.startsWith('/hr') || path.startsWith('/employee') || path.startsWith('/jobopening') || path.startsWith('/attendance') || path.startsWith('/holiday')) {
                        deptName = 'Human Resources';
                    } else if (path.startsWith('/ops-dashboard') || path.startsWith('/student') || path.startsWith('/university') || path.startsWith('/program') || path.startsWith('/studycenter')) {
                        deptName = 'Operations';
                    } else if (path.startsWith('/finance') || path.startsWith('/salesinvoice') || path.startsWith('/payment') || path.startsWith('/expense')) {
                        deptName = 'Finance';
                    }
                }

                const baseQuery = `?organizationId=${orgId}`;
                const deptQuery = `${deptId ? `&departmentId=${deptId}` : ''}${deptName ? `&department=${encodeURIComponent(deptName)}` : ''}`;

                // Determine distinct resource for Study Centers
                let data = [];
                if (userRole === 'StudyCenter') {
                    // For Centers, we only fetch Operations announcements now
                    const res = await fetch(`/api/resource/opsannouncement${baseQuery}`);
                    const json = await res.json();
                    data = json.data || [];
                } else {
                    const res = await fetch(`/api/resource/announcement${baseQuery}${deptQuery}`);
                    const json = await res.json();
                    data = json.data || [];
                }

                const now = new Date();

                // Filter for announcements that target this center or 'All'
                // and are currently active
                const currentCenter = (userCenter || '').toString().trim().toLowerCase();
                const currentId = (userCenterId || '').toString().toLowerCase();

                const filtered = data.filter((ann: any) => {
                    const target = (ann.targetCenter || '').toString().trim().toLowerCase();
                    if (userRole === 'StudyCenter' && (target === 'none' || !target)) return false;

                    const now = new Date();
                    const startDate = ann.startDate ? new Date(ann.startDate) : null;
                    const endDate = ann.endDate ? new Date(ann.endDate) : null;

                    const isStarted = !startDate || now >= startDate;
                    const isNotExpired = !endDate || now <= endDate;
                    const isVisible = isStarted && isNotExpired;

                    const nameMatch = target === currentCenter;
                    const idMatch = !!(currentId && (target === currentId));
                    const roleMatch = userRole === 'Operations' || userRole === 'DepartmentAdmin';

                    const isTargeted = nameMatch || idMatch || roleMatch;

                    if (isVisible && isTargeted) {
                        console.log(`[Diagnostic] NOTIFICATION MATCH: "${ann.title}" | Target: "${target}" | Reason: ${roleMatch ? 'Role' : (nameMatch ? 'Exact Name' : 'ID')}`);
                    }

                    return isVisible && isTargeted;
                }).sort((a: any, b: any) => {
                    // Sort pinned first, then by date desc
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return new Date(b.posting_date || b.createdAt).getTime() - new Date(a.posting_date || a.createdAt).getTime();
                });

                console.log(`[Diagnostic] Center: "${userCenter}" | ID: "${userCenterId}" | Raw: ${data.length} | Filtered: ${filtered.length}`);
                if (data.length > 0) {
                    console.log('[Diagnostic] Announcement Target Examples:', data.slice(0, 3).map((a: any) => `"${a.targetCenter}"`));
                }
                setNotifications(filtered);
            } catch (e) {
                console.error('Error fetching notifications:', e);
            } finally {
                setLoading(false);
            }
        };

        // Resolve Center ID if missing
        const resolveId = async () => {
            const userRole = localStorage.getItem('user_role');
            const userCenterName = localStorage.getItem('study_center_name');
            const currentOrgId = localStorage.getItem('organization_id');

            console.log(`[Resolve ID] Starting for: "${userCenterName}" (Role: ${userRole}, Org: ${currentOrgId})`);

            if (userRole === 'StudyCenter' && !userCenterId && userCenterName) {
                try {
                    const res = await fetch(`/api/resource/studycenter?organizationId=${currentOrgId || ''}`);
                    const json = await res.json();
                    const centers = json.data || [];

                    console.log('[Diagnostic] DB Centers List:', centers.map((c: any) => `L:"${c.centerName}" ID:"${c._id}" U:"${c.username}"`));

                    const searchStr = userCenterName.trim().toLowerCase();
                    const found = centers.find((c: any) => {
                        const dbName = (c.centerName || '').toString().trim().toLowerCase();
                        const dbUser = (c.username || '').toString().trim().toLowerCase();
                        return dbName === searchStr || dbUser === searchStr;
                    });

                    if (found) {
                        console.log('[Diagnostic] Resolve SUCCESS:', found.centerName, '->', found._id);
                        setUserCenterId(found._id);
                        localStorage.setItem('study_center_id', found._id);
                        return found._id;
                    } else {
                        console.warn('[Diagnostic] Resolve FAILED for:', userCenterName);
                    }
                } catch (e) {
                    console.error('[Diagnostic] Resolve ERROR:', e);
                }
            }
            return userCenterId;
        };

        const execute = async () => {
            await resolveId();
            await fetchNotifications();
        };

        execute();
    }, [userCenterId]);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Notifications"
                summaryItems={[
                    { label: 'Unread Alerts', value: notifications.filter(n => !JSON.parse(localStorage.getItem('seen_announcements') || '[]').includes(n._id)).length, color: 'text-orange-500', doctype: 'announcement' },
                    { label: 'Total for You', value: notifications.length, color: 'text-blue-500', doctype: 'announcement' },
                ]}
                masterCards={[]}
                shortcuts={[]}
                hideActions={true}
            />

            <div className="max-w-4xl mx-auto space-y-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
                        <Bell className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-gray-900 font-bold mb-1">No New Notifications</h3>
                        <p className="text-gray-500 text-[13px]">
                            You're all caught up! Check back later for center updates.
                        </p>
                    </div>
                ) : (
                    notifications.map((notification, idx) => {
                        const isSeen = JSON.parse(localStorage.getItem('seen_announcements') || '[]').includes(notification._id);
                        return (
                            <div key={idx} className={`bg-white p-5 rounded-xl border border-[#d1d8dd] shadow-sm hover:shadow-md transition-all relative overflow-hidden ${!isSeen ? 'border-l-4 border-l-blue-600' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl shrink-0 ${notification.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {notification.pinned ? <Pin size={20} /> : <Megaphone size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 className="text-[15px] font-bold text-[#1d2129]">{notification.title}</h4>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={10} /> {new Date(notification.posting_date || notification.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                                            {notification.content || notification.description}
                                        </p>

                                        <PollWidget
                                            announcement={notification}
                                            voterId={localStorage.getItem('study_center_id') || localStorage.getItem('employee_id') || localStorage.getItem('user_id') || 'unknown'}
                                            doctype={localStorage.getItem('user_role') === 'StudyCenter' ? 'opsannouncement' : 'announcement'}
                                            onVoteSuccess={(updated: any) => {
                                                setNotifications(prev => prev.map(p => p._id === updated._id ? updated : p));
                                            }}
                                        />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                                                    <User size={10} /> {notification.author || 'Operations'}
                                                </span>
                                                {notification.targetCenter !== 'All' && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold">
                                                        {notification.targetCenter}
                                                    </span>
                                                )}
                                            </div>
                                            {!isSeen && (
                                                <button
                                                    onClick={() => {
                                                        const seen = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
                                                        seen.push(notification._id);
                                                        localStorage.setItem('seen_announcements', JSON.stringify(seen));
                                                        setNotifications([...notifications]); // Trigger re-render
                                                    }}
                                                    className="text-[11px] font-bold text-blue-600 hover:underline"
                                                >
                                                    Mark as Read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
