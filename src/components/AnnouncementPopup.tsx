import React, { useEffect, useState } from 'react';
import { X, Megaphone, Bell, Pin } from 'lucide-react';
import PollWidget from './PollWidget';
import { useLocation } from 'react-router-dom';

export default function AnnouncementPopup() {
    const [announcement, setAnnouncement] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAnnouncements = async () => {
            try {
                const orgId = localStorage.getItem('organization_id');
                const userCenter = localStorage.getItem('study_center_name');
                const userCenterId = localStorage.getItem('study_center_id');
                const userRole = localStorage.getItem('user_role');

                if (!orgId) return;

                const deptId = localStorage.getItem('department_id');
                let deptName = localStorage.getItem('department_name');

                // If user is Admin and on a specific dashboard or feature, force context
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

                // If no department context found but we are for an admin, we should perhaps restrict to 'All' by default to prevent leakage
                // but for now let's just use the determined deptName.

                const baseQuery = `?organizationId=${orgId}`;
                const deptQuery = `${deptId ? `&departmentId=${deptId}` : ''}`;

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

                // Fallback: If no ID in localstorage, find it from centers list (Robustness)
                let resolvedCenterId = userCenterId;
                if (!resolvedCenterId && userCenter) {
                    try {
                        const resCenters = await fetch(`/api/resource/studycenter?organizationId=${orgId}`);
                        const jsonCenters = await resCenters.json();
                        const centers = jsonCenters.data || [];
                        const searchStr = userCenter.trim().toLowerCase();
                        const found = centers.find((c: any) => {
                            const dbName = (c.centerName || '').toString().trim().toLowerCase();
                            const dbUser = (c.username || '').toString().trim().toLowerCase();
                            return dbName === searchStr || dbUser === searchStr;
                        });
                        if (found) resolvedCenterId = found._id;
                    } catch (e) {
                        console.error('Failed to resolve center ID', e);
                    }
                }

                const now = new Date();

                // Filter for popups that target this center or 'All'
                const currentCenter = (userCenter || '').toString().trim().toLowerCase();
                const currentId = (userCenterId || '').toString().toLowerCase();
                const currentResolvedId = (resolvedCenterId || '').toString().toLowerCase();

                const popups = data.filter((ann: any) => {
                    if (ann.targetDepartment === 'None') return false;

                    const target = (ann.targetCenter || ann.targetStudyCenter || '').toString().trim().toLowerCase();

                    if (userRole === 'StudyCenter' && (target === 'none' || !target)) return false;

                    const now = new Date();
                    const startDate = ann.startDate ? new Date(ann.startDate) : null;
                    const endDate = ann.endDate ? new Date(ann.endDate) : null;

                    const isStarted = !startDate || now >= startDate;
                    const isNotExpired = !endDate || now <= endDate;
                    const isVisible = isStarted && isNotExpired;

                    const isAll = target === 'all';
                    const nameMatch = target === currentCenter;
                    const idMatch = !!((currentId && target === currentId) || (currentResolvedId && target === currentResolvedId));
                    const isTargeted = isAll || nameMatch || idMatch;

                    if (isVisible && isTargeted && ann.showAsPopup) {
                        console.log(`[Diagnostic] POPUP MATCH: "${ann.title}" | Target: "${target}" | Reason: ${nameMatch ? 'Exact Name' : 'ID'}`);
                    }

                    return isVisible && isTargeted;

                    const isPopup = ann.showAsPopup === true;

                    // Check if already seen in localStorage
                    const seenAnnouncements = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
                    const isNew = !seenAnnouncements.includes(ann._id);

                    return isVisible && isTargeted && isPopup && isNew;
                });


                if (popups.length > 0) {
                    setAnnouncement(popups[0]); // Show the first unseen popup
                    setIsOpen(true);
                }
            } catch (e) {
                console.error('Error fetching announcement popups:', e);
            }
        };

        checkAnnouncements();
        // Check every 2 minutes for new announcements
        const interval = setInterval(checkAnnouncements, 120000);
        return () => clearInterval(interval);
    }, []);

    const handleClose = () => {
        if (announcement) {
            const seenAnnouncements = JSON.parse(localStorage.getItem('seen_announcements') || '[]');
            seenAnnouncements.push(announcement._id);
            localStorage.setItem('seen_announcements', JSON.stringify(seenAnnouncements));
        }
        setIsOpen(false);
    };

    if (!isOpen || !announcement) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className={`p-1 ${announcement.priority === 'High' ? 'bg-red-500' : 'bg-blue-600'}`} />
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${announcement.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {announcement.pinned ? <Pin size={24} /> : <Megaphone size={24} />}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                            {announcement.priority === 'High' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Urgent</span>
                            )}
                        </div>
                        <p className="text-gray-600 text-[14px] leading-relaxed">
                            {announcement.content || announcement.description}
                        </p>

                        <PollWidget
                            announcement={announcement}
                            voterId={localStorage.getItem('study_center_id') || localStorage.getItem('employee_id') || localStorage.getItem('user_id') || 'unknown'}
                            doctype={localStorage.getItem('user_role') === 'StudyCenter' ? 'opsannouncement' : 'announcement'}
                            onVoteSuccess={(updated: any) => setAnnouncement(updated)}
                        />
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-[14px] transition-colors"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={handleClose}
                            className={`flex-1 text-white font-bold py-2.5 rounded-xl text-[14px] shadow-lg transition-all active:scale-95 ${announcement.priority === 'High' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                        >
                            Acknowledge
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Bell size={12} /> This is an automated notification from {announcement.author || 'Operations'}
                    </p>
                </div>
            </div>
        </div>
    );
}
