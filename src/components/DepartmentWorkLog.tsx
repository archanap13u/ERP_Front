import React, { useEffect, useState } from 'react';
import { FileText, Search, User, Calendar, Activity, AlertCircle } from 'lucide-react';

interface DepartmentWorkLogProps {
    departmentId?: string;
    isHR?: boolean;
    organizationId: string;
    title?: string;
}

export default function DepartmentWorkLog({ departmentId, isHR, organizationId, title = "Department Work Log" }: DepartmentWorkLogProps) {
    const [reports, setReports] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEmployeeId, setFilterEmployeeId] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch Reports
                let repUrl = `/api/resource/dailyreport?organizationId=${organizationId}`;
                // If not HR, we usually should filter by departmentId on the backend if possible,
                // but let's follow the existing pattern of fetching and filtering client-side if needed,
                // or appending departmentId to the query.
                if (!isHR && departmentId) {
                    repUrl += `&departmentId=${departmentId}`;
                }

                const [repRes, empRes] = await Promise.all([
                    fetch(repUrl),
                    fetch(`/api/resource/employee?organizationId=${organizationId}`)
                ]);

                const [repJson, empJson] = await Promise.all([
                    repRes.json(),
                    empRes.json()
                ]);

                let fetchedReports = repJson.data || [];
                let fetchedEmployees = empJson.data || [];

                // Client-side filtering as fallback or for more specific logic
                if (!isHR && departmentId) {
                    // Ensure we only show employees from this department if we have the list
                    const deptEmployees = fetchedEmployees.filter((e: any) => e.departmentId === departmentId || e.department === departmentId);
                    const deptEmpIds = deptEmployees.map((e: any) => e._id);

                    // If the backend didn't filter strictly, we do it here
                    fetchedReports = fetchedReports.filter((r: any) => deptEmpIds.includes(r.employeeId));
                    setEmployees(deptEmployees);
                } else {
                    setEmployees(fetchedEmployees);
                }

                setReports(fetchedReports);
            } catch (err: any) {
                console.error("Failed to fetch work reports:", err);
                setError("Failed to load work reports.");
            } finally {
                setLoading(false);
            }
        };

        if (organizationId) {
            fetchData();
        }
    }, [departmentId, isHR, organizationId]);

    const filteredReports = reports
        .filter(r => (filterEmployeeId ? r.employeeId === filterEmployeeId : true))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#f0f4f7] bg-[#f9fafb] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-[15px]">{title}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">Recent activity and daily logs</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <select
                            value={filterEmployeeId}
                            onChange={(e) => setFilterEmployeeId(e.target.value)}
                            className="w-full bg-white border border-[#d1d8dd] text-[12px] rounded px-8 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 appearance-none font-bold text-gray-600"
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.employeeName}</option>
                            ))}
                        </select>
                        <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Activity size={12} className="text-gray-300" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-0">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-400 text-[13px] font-medium">Fetching reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="p-16 text-center">
                        <FileText size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-gray-400 italic text-[14px]">No work reports found.</p>
                        {filterEmployeeId && (
                            <button
                                onClick={() => setFilterEmployeeId('')}
                                className="mt-2 text-blue-500 text-[12px] font-bold hover:underline"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredReports.slice(0, 20).map((report, idx) => {
                            const employee = employees.find(e => e._id === report.employeeId);
                            return (
                                <div key={idx} className="p-5 hover:bg-gray-50/50 transition-colors flex gap-5">
                                    <div className="flex-shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
                                            {employee?.employeeName?.charAt(0) || '?'}
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-gray-900">{employee?.employeeName || 'Unknown Employee'}</h4>
                                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1 mt-0.5">
                                                    <Calendar size={10} /> {new Date(report.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black border border-emerald-100">SUBMITTED</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-2 mt-3">
                                            {report.tasks?.map((t: any, i: number) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${t.status === 'Completed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                    <div className="flex-1">
                                                        <span className={`text-[13px] leading-relaxed ${t.status === 'Completed' ? 'text-gray-700 font-medium' : 'text-gray-500 italic'}`}>
                                                            {t.description}
                                                        </span>
                                                        {t.timeSpent && <span className="ml-2 text-[11px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded italic">~{t.timeSpent}h</span>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        {report.blockers && (
                                            <div className="mt-4 flex items-start gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100 border-dashed">
                                                <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                                <p className="text-[12px] text-rose-600 font-medium leading-relaxed">
                                                    <span className="font-black uppercase tracking-tighter mr-1">Blocker:</span> {report.blockers}
                                                </p>
                                            </div>
                                        )}

                                        {report.summary && (
                                            <p className="mt-3 text-[12px] text-gray-400 italic bg-gray-50/30 p-2 rounded-lg border border-gray-100">
                                                {report.summary}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {!loading && filteredReports.length > 20 && (
                <div className="p-3 border-t border-gray-50 bg-gray-50/30 text-center">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest italic">Showing most recent 20 entries</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-[12px] font-bold text-center border-t border-red-100 flex items-center justify-center gap-2">
                    <AlertCircle size={14} /> {error}
                </div>
            )}
        </div>
    );
}
