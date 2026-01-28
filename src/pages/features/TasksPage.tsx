import React, { useEffect, useState } from 'react';
import { CheckSquare, ArrowRight, User, Calendar } from 'lucide-react';
import Workspace from '../../components/Workspace';
import { Link } from 'react-router-dom';

export default function TasksPage() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const orgId = localStorage.getItem('organization_id');
                const deptId = localStorage.getItem('department_id');

                let queryParams = `?organizationId=${orgId || ''}`;
                if (deptId) {
                    queryParams += `&departmentId=${deptId}`;
                }

                const res = await fetch(`/api/resource/task${queryParams}`);
                const json = await res.json();
                const data = json.data || [];

                setCounts({
                    total: data.length,
                    open: data.filter((t: any) => t.status === 'Open' || t.status === 'Working').length,
                    overdue: data.filter((t: any) => t.status === 'Overdue').length,
                });

                setTasks(data.slice(0, 10));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Task Management"
                newHref="/task/new"
                newLabel="New Task"
                summaryItems={[
                    { label: 'Total Tasks', value: loading ? '...' : counts.total || 0, color: 'text-blue-500', doctype: 'task' },
                    { label: 'Open', value: loading ? '...' : counts.open || 0, color: 'text-emerald-500', doctype: 'task' },
                    { label: 'Overdue', value: loading ? '...' : counts.overdue || 0, color: 'text-red-500', doctype: 'task' },
                ]}
                masterCards={[
                    { label: 'All Tasks', icon: CheckSquare, count: counts.total || 0, href: '/task' },
                    { label: 'My Tasks', icon: User, count: 'View', href: '/task?my_tasks=true' },
                ]}
                shortcuts={[
                    { label: 'Create Task', href: '/task/new' },
                    { label: 'My Open Tasks', href: '/task?status=Open&my_tasks=true' },
                ]}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                            <CheckSquare size={18} className="text-orange-600" />
                            Recent Tasks
                        </h3>
                        <Link to="/task" className="text-blue-600 text-[12px] font-medium hover:underline flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {tasks.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic text-[13px]">No tasks found.</div>
                        ) : (
                            tasks.map((task, idx) => (
                                <Link
                                    to={`/task/${task._id}`}
                                    key={idx}
                                    className={`p-4 transition-colors flex items-center justify-between block no-underline ${task.verificationStatus === 'Rejected' ? 'bg-red-50 hover:bg-red-100' :
                                            task.verificationStatus === 'Approved' ? 'bg-green-50 hover:bg-green-100' :
                                                'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded">
                                            <CheckSquare size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#1d2129]">{task.subject || 'Task Subject'}</p>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                <span>{task.project || 'No Project'}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {task.exp_end_date ? new Date(task.exp_end_date).toLocaleDateString() : 'No Date'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                            task.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {task.status || 'Open'}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-[16px] font-bold mb-4">Task Actions</h4>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/task/new" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-[13px] font-medium backdrop-blur-sm transition-colors no-underline">
                            Add New Task
                        </Link>
                    </div>
                </div>
                <CheckSquare className="absolute right-[-20px] bottom-[-20px] text-white/10" size={120} />
            </div>
        </div>
    );
}
