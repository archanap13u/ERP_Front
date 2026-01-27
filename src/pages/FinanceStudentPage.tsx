import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Search, Filter } from 'lucide-react';

export default function FinanceStudentPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        fetchStudents();
    }, [activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const orgId = localStorage.getItem('organization_id');
            // Fetch based on tab: pending -> Verified by Ops, active -> Active
            const status = activeTab === 'pending' ? 'Verified by Ops' : 'Approved by Accounts';

            console.log(`[FinancePage] Fetching: /api/resource/student?organizationId=${orgId}&verificationStatus=${status}`);
            const res = await fetch(`/api/resource/student?organizationId=${orgId}&verificationStatus=${status}`);
            const json = await res.json();
            console.log('[FinancePage] Result:', json);
            // Default resource API returns { data: [] }, not always success: true
            setStudents(json.data || []);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, name: string) => {
        if (!window.confirm(`Approve student enrollment for ${name}?`)) return;

        try {
            const orgId = localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/student/${id}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verificationStatus: 'Approved by Accounts',
                    isActive: true
                })
            });

            if (res.ok) {
                // Remove from list immediately
                setStudents(prev => prev.filter(s => s._id !== id));
            } else {
                alert('Failed to approve student');
            }
        } catch (e) {
            console.error(e);
            alert('Error connecting to server');
        }
    };

    return (
        <div className="p-8 text-[#1d2129] pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded">
                        <ArrowLeft size={18} className="text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Student Approvals</h1>
                        <p className="text-sm text-gray-500">Verify and approve student enrollments</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${activeTab === 'pending'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Pending Approval
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${activeTab === 'active'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Active Students
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border border-[#d1d8dd] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-gray-50 border-b border-[#d1d8dd]">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-500">Student Name</th>
                                <th className="px-6 py-3 font-semibold text-gray-500">Center</th>
                                <th className="px-6 py-3 font-semibold text-gray-500">Program</th>
                                <th className="px-6 py-3 font-semibold text-gray-500">Status</th>
                                <th className="px-6 py-3 font-semibold text-gray-500 w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No {activeTab} students found.</td></tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {student.studentName}
                                            <div className="text-xs text-gray-400 font-normal">{student.studentId}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{student.studyCenter || student.centerName || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{student.program || student.programName || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${student.verificationStatus === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {student.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(student._id, student.studentName)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-[11px] font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                                                >
                                                    <CheckCircle size={14} />
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
