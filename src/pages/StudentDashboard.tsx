import React, { useEffect, useState } from 'react';
import { BookOpen, MapPin, GraduationCap, School, User, Mail, Phone, Calendar, Info, FileText, ExternalLink } from 'lucide-react';

export default function StudentDashboard() {
    const [name, setName] = useState('');
    const [student, setStudent] = useState<any>(null);
    const [program, setProgram] = useState<any>(null);
    const [university, setUniversity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        const userId = localStorage.getItem('user_id');
        const orgId = localStorage.getItem('organization_id');
        setName(storedName || 'Student');

        async function fetchData() {
            if (!userId || !orgId) {
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch Student Profile
                const stuRes = await fetch(`/api/resource/student/${userId}?organizationId=${orgId}`);
                const stuJson = await stuRes.json();

                if (stuJson.data) {
                    const stu = stuJson.data;
                    setStudent(stu);

                    // 2. Fetch Program Details
                    if (stu.program) {
                        const progRes = await fetch(`/api/resource/program?programName=${encodeURIComponent(stu.program)}&organizationId=${orgId}`);
                        const progJson = await progRes.json();
                        if (progJson.data?.length > 0) {
                            setProgram(progJson.data[0]);
                        }
                    }

                    // 3. Fetch University Details
                    if (stu.university) {
                        const uniRes = await fetch(`/api/resource/university?universityName=${encodeURIComponent(stu.university)}&organizationId=${orgId}`);
                        const uniJson = await uniRes.json();
                        if (uniJson.data?.length > 0) {
                            setUniversity(uniJson.data[0]);
                        }
                    }
                }
            } catch (e) {
                console.error('Error fetching student dashboard data:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto text-[#1d2129]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {name}</h1>
                    <p className="text-gray-500 mt-1 font-medium">Your Academic Overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-[#d1d8dd] flex items-center gap-3 shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${student?.isActive ? 'bg-emerald-500' : 'bg-orange-400'}`}></div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Status</p>
                            <p className="text-[13px] font-bold text-gray-700">{student?.verificationStatus || 'Active'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-[#d1d8dd] rounded-xl shadow-sm overflow-hidden">
                        <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-10 mb-4">
                                <div className="w-20 h-20 bg-white rounded-xl border-4 border-white shadow-md flex items-center justify-center text-blue-600">
                                    <User size={40} />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{student?.studentName}</h2>
                            <p className="text-sm font-semibold text-blue-600 mt-1 uppercase tracking-wider">{student?.studentId || 'ID Pending'}</p>

                            <div className="mt-6 space-y-4">
                                {student?.email && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span className="text-[13px] font-medium">{student.email}</span>
                                    </div>
                                )}
                                {student?.phone && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        <span className="text-[13px] font-medium">{student.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span className="text-[13px] font-medium">Enrolled: {student?.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#f0f4f7] p-5 rounded-xl border border-[#d1d8dd]">
                        <h4 className="text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Info size={14} className="text-blue-500" />
                            Study Center
                        </h4>
                        <div className="space-y-2">
                            <p className="text-[14px] font-bold text-gray-800">{student?.studyCenter || 'University Main Campus'}</p>
                            <div className="flex items-center gap-2 text-gray-500">
                                <MapPin size={12} />
                                <span className="text-[12px] font-medium">Assigned Learning Center</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Program & University Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Program Section */}
                    <div className="bg-white border border-[#d1d8dd] rounded-xl shadow-sm p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                    <GraduationCap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">My Academic Program</h3>
                                    <p className="text-[13px] text-gray-500 font-medium">Detailed course information</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                                {program?.programType || 'Course'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Program Name</p>
                                <p className="text-[15px] font-bold text-gray-800">{program?.programName || student?.program || 'Not Assigned'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
                                <p className="text-[15px] font-bold text-gray-800">{program?.duration} {program?.durationUnit || 'Years'}</p>
                            </div>
                        </div>

                        <div className="border-t border-[#f0f4f7] pt-6">
                            <h4 className="text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FileText size={16} className="text-indigo-500" />
                                Syllabus & Curriculum
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 border border-[#e5e9ec]">
                                {program?.syllabus ? (
                                    <div className="text-[14px] text-gray-700 leading-relaxed">
                                        {program.syllabus.startsWith('http') ? (
                                            <a
                                                href={program.syllabus}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                                            >
                                                <ExternalLink size={14} /> View Syllabus Document
                                            </a>
                                        ) : (
                                            <div className="whitespace-pre-wrap font-medium">
                                                {program.syllabus}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-[13px] text-gray-400 italic">Syllabus details will be updated by your coordinator shortly.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* University Section */}
                    <div className="bg-white border border-[#d1d8dd] rounded-xl shadow-sm p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <School size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">University Affiliation</h3>
                                <p className="text-[13px] text-gray-500 font-medium">Accreditation & Information</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Affiliated Institution</p>
                                    <p className="text-[15px] font-bold text-gray-800">{university?.universityName || student?.university || 'Connecting...'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accreditations</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(university?.accreditations || university?.accreditation || 'UGC, NAAC').split(',').map((acc: string, idx: number) => (
                                            <span key={idx} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 uppercase">
                                                {acc.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {university?.description && (
                                <div className="space-y-2 pt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">About University</p>
                                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                                        {university.description}
                                    </p>
                                </div>
                            )}

                            {university?.facilities && university.facilities.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Campus Facilities</p>
                                    <div className="flex flex-wrap gap-2">
                                        {university.facilities.map((facility: string, idx: number) => (
                                            <span key={idx} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 text-[11px] text-gray-600 font-bold">
                                                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                                {facility}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

