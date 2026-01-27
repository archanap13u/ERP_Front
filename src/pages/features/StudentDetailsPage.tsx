import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, MapPin, GraduationCap, ArrowLeft, Edit, Mail, CheckCircle, Info, Phone, Calendar, Building2, FileText, Check, X, ExternalLink } from 'lucide-react';
import Workspace from '../../components/Workspace';

export default function StudentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const userRole = localStorage.getItem('user_role');
    const isOps = userRole === 'Operations' || userRole === 'SuperAdmin';
    const isFinance = userRole === 'Finance' || userRole === 'SuperAdmin';

    useEffect(() => {
        async function fetchStudent() {
            try {
                const res = await fetch(`/api/resource/student/${id}`);
                const json = await res.json();
                if (json.data) {
                    setStudent(json.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchStudent();
    }, [id]);

    const handleAction = async (status: string, message: string) => {
        if (!confirm(message)) return;
        setActionLoading(true);
        try {
            const body: any = { verificationStatus: status };
            if (status === 'Approved by Accounts') body.isActive = true;
            if (status === 'Verified by Ops') body.isActive = false;

            const res = await fetch(`/api/resource/student/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const json = await res.json();
                setStudent(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500 italic">Loading student details...</div>;
    if (!student) return <div className="p-12 text-center text-red-500">Student not found.</div>;

    return (
        <div className="pb-20 bg-gray-50 min-h-screen text-[#1d2129]">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 pt-8 pb-6 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <Link to={isOps ? "/ops-dashboard" : (isFinance ? "/finance" : "/student")} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <Link to={`/student/${id}/edit`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 px-4 py-2 border border-gray-200 rounded-lg transition-all font-bold text-sm bg-white">
                                <Edit size={16} /> Edit Profile
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-100 rounded-2xl shadow-sm flex items-center justify-center text-blue-600 font-bold text-4xl border-4 border-white">
                                {student.studentName?.[0].toUpperCase() || 'S'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-2 text-gray-900">
                                    {student.studentName}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
                                    <span className="flex items-center gap-1.5"><Building2 size={16} className="text-blue-500" /> {student.studyCenter || 'No Study Center'}</span>
                                    <span className="flex items-center gap-1.5"><GraduationCap size={16} className="text-indigo-500" /> {student.program || 'No Program'}</span>
                                    <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${student.verificationStatus === 'Approved by Accounts' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        student.verificationStatus === 'Verified by Ops' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-orange-50 text-orange-700 border-orange-100'
                                        }`}>
                                        <CheckCircle size={14} /> {student.verificationStatus || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Workflow Actions */}
                        <div className="flex items-center gap-3">
                            {isOps && (!student.verificationStatus || student.verificationStatus === 'Pending' || student.verificationStatus === 'Processing') && (
                                <button
                                    onClick={() => handleAction('Verified by Ops', 'Approve and verify this student record for Finance?')}
                                    disabled={actionLoading}
                                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Check size={18} /> Approve Record
                                </button>
                            )}
                            {isFinance && student.verificationStatus === 'Verified by Ops' && (
                                <button
                                    onClick={() => handleAction('Approved by Accounts', 'Final approval for this student enrollment?')}
                                    disabled={actionLoading}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle size={18} /> Approve Enrollment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <User size={20} className="text-blue-500" /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <DetailItem label="Full Name" value={student.studentName} />
                                <DetailItem label="Email Address" value={student.email} icon={<Mail size={14} />} />
                                <DetailItem label="Phone Number" value={student.phone} icon={<Phone size={14} />} />
                                <DetailItem label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Not provided'} icon={<Calendar size={14} />} />
                                <DetailItem label="Gender" value={student.gender} />
                                <DetailItem label="Address" value={student.address} icon={<MapPin size={14} />} />
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <GraduationCap size={20} className="text-indigo-500" /> Academic & Center Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <DetailItem label="University" value={student.university} />
                                <DetailItem label="Program" value={student.program} />
                                <DetailItem label="Study Center" value={student.studyCenter} />
                                <DetailItem label="Enrollment Date" value={new Date(student.enrollmentDate).toLocaleDateString()} />
                                <DetailItem label="Class" value={student.class} />
                                <DetailItem label="Section" value={student.section} />
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                                <FileText size={20} className="text-emerald-500" /> Uploaded Documents / Credentials
                            </h3>
                            <div className="space-y-4">
                                {student.paymentReceipt ? (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 group hover:border-blue-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded shadow-sm text-emerald-600">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-900">Payment Receipt</p>
                                                <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{student.paymentReceipt}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={student.paymentReceipt}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <ExternalLink size={14} /> View Document
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                                        <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Status Summary */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Info size={18} className="text-blue-500" /> Approval Status
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Application Status</span>
                                    <span className="text-gray-900 font-bold text-sm">{student.verificationStatus || 'Pending'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Active Record</span>
                                    <span className={student.isActive ? 'text-emerald-600 font-bold text-sm' : 'text-red-600 font-bold text-sm'}>
                                        {student.isActive ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500 text-sm">Last Updated</span>
                                    <span className="text-gray-900 font-medium text-sm">
                                        {new Date(student.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-gray-900 mb-4">Guardian Details</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Guardian Name</p>
                                    <p className="text-[13px] font-bold text-gray-900">{student.guardianName || 'Not provided'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Guardian Phone</p>
                                    <p className="text-[13px] font-bold text-gray-900">{student.guardianPhone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2">
                {icon && <span className="text-gray-300">{icon}</span>}
                <p className="text-[14px] font-bold text-gray-900">{value || '—'}</p>
            </div>
        </div>
    );
}
