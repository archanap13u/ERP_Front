import React, { useEffect, useState } from 'react';
import {
    CalendarDays,
    Sun,
    ArrowRight,
    Calendar,
    Gift
} from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link } from 'react-router-dom';

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptName = localStorage.getItem('department_name');
                let url = `/api/resource/holiday?organizationId=${orgId || ''}`;

                const res = await fetch(url);
                const json = await res.json();

                const data = json.data || [];
                const now = new Date();
                const upcoming = data.filter((h: any) => new Date(h.date) > now);

                setHolidays(upcoming.slice(0, 10));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const deptName = localStorage.getItem('department_name') || '';
    const userRole = localStorage.getItem('user_role') || '';
    const deptPanelType = localStorage.getItem('department_panel_type') || '';
    const isHR = ['SuperAdmin', 'OrganizationAdmin', 'HR'].includes(userRole) || deptPanelType === 'HR' || /^(Human Resources|HR)$/i.test(deptName);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Holiday Management"
                newHref={isHR ? "/holiday/new" : undefined}
                newLabel={isHR ? "Add Holiday" : undefined}
                summaryItems={[
                    { label: 'Upcoming Holidays', value: loading ? '...' : holidays.length || 0, color: 'text-orange-500', doctype: 'holiday' },
                    { label: 'This Month', value: loading ? '...' : '0', color: 'text-blue-500', doctype: 'holiday' },
                ]}
                masterCards={[
                    { label: 'All Holidays', icon: CalendarDays, count: holidays.length || 0, href: '/holiday' },
                    { label: 'Holiday List', icon: Calendar, count: 'Manage', href: '/holiday-list' },
                ]}
                shortcuts={[
                    isHR ? { label: 'Add Holiday', href: '/holiday/new' } : null,
                    { label: 'View Holiday List', href: '/holiday' },
                ].filter(Boolean) as any}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <Sun size={18} className="text-orange-600" />
                            Upcoming Holidays
                        </h3>
                        <Link to="/holiday" className="text-blue-600 text-[12px] font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {holidays.length === 0 ? (
                            <div className="p-12 text-center">
                                <Gift className="mx-auto text-gray-300 mb-4" size={48} />
                                <h3 className="text-gray-900 font-bold mb-1">No Upcoming Holidays</h3>
                                <p className="text-gray-500 text-[13px] mb-4">The holiday calendar is currently empty.</p>
                                {isHR && (
                                    <Link to="/holiday/new" className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-[13px] hover:bg-orange-700 transition-colors">
                                        Add First Holiday
                                    </Link>
                                )}
                            </div>
                        ) : (
                            holidays.map((holiday, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-center min-w-[60px]">
                                            <p className="text-[20px] font-bold leading-none">{holiday.date ? new Date(holiday.date).getDate() : '-'}</p>
                                            <p className="text-[10px] font-medium uppercase mt-1">
                                                {holiday.date ? new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#1d2129]">{holiday.description || holiday.holidayName || 'Unnamed Holiday'}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {holiday.date ? new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[11px] font-bold rounded-full">
                                        {holiday.weekly_off ? 'Weekly Off' : 'Holiday'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-[16px] font-bold mb-4">Holiday Quick Actions</h4>
                        <div className="flex flex-wrap gap-3">
                            {isHR && (
                                <Link to="/holiday/new" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                                    Add New Holiday
                                </Link>
                            )}
                            <Link to="/holiday" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                                View Full Calendar
                            </Link>
                        </div>
                    </div>
                    <CalendarDays className="absolute right-[-20px] bottom-[-20px] text-white/10" size={120} />
                </div>
            </div>
        </div>
    );
}
