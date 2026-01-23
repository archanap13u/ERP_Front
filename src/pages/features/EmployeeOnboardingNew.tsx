import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Save, ArrowLeft, Building2, Briefcase, User, Mail, Lock, Calendar, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Workspace from '../../components/Workspace';

export default function EmployeeOnboardingNew() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [vacancies, setVacancies] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        employeeName: '',
        email: '',
        password: '',
        department: '',
        departmentId: '',
        designation: '',
        reportsToRole: '', // Changed from reportsTo
        dateOfJoining: new Date().toISOString().split('T')[0],
        status: 'Active',
        vacancy: '', // Linked vacancy
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}` // Temporary auto-gen
    });

    useEffect(() => {
        const orgId = localStorage.getItem('organization_id');
        // Fetch Departments
        fetch(`/api/resource/department?organizationId=${orgId}`)
            .then(res => res.json())
            .then(json => setDepartments(json.data || []))
            .catch(console.error);

        // Fetch Open Job Openings (Vacancies) and calculate remaining positions
        Promise.all([
            fetch(`/api/resource/jobopening?organizationId=${orgId}`).then(r => r.json()),
            fetch(`/api/resource/employee?organizationId=${orgId}`).then(r => r.json())
        ]).then(([jobsJson, empsJson]) => {
            const jobs = jobsJson.data || [];
            const employees = empsJson.data || [];

            // Count hired per vacancy
            const hiredPerVacancy: Record<string, number> = {};
            for (const emp of employees) {
                const jobId = emp.jobOpening?._id || emp.jobOpening;
                if (jobId) {
                    hiredPerVacancy[jobId] = (hiredPerVacancy[jobId] || 0) + 1;
                }
            }

            // Annotate jobs with remaining positions
            const annotatedJobs = jobs.filter((j: any) => j.status === 'Open').map((j: any) => ({
                ...j,
                hired: hiredPerVacancy[j._id] || 0,
                remaining: (j.no_of_positions || 1) - (hiredPerVacancy[j._id] || 0)
            }));

            setVacancies(annotatedJobs);
        }).catch(console.error);

        // Fetch All Designations (will filter client-side or we could fetch on dept change)
        fetch(`/api/resource/designation?organizationId=${orgId}`)
            .then(res => res.json())
            .then(json => setDesignations(json.data || []))
            .catch(console.error);

        // Fetch Potential Managers (All Active Employees)
        fetch(`/api/resource/employee?organizationId=${orgId}&status=Active`)
            .then(res => res.json())
            .then(json => setManagers(json.data || []))
            .catch(console.error);

        // Pre-fill from Query Parameters (e.g. Applicant Acceptance)
        const params = new URLSearchParams(window.location.search);
        const updates: any = {};
        if (params.get('employeeId')) updates.employeeId = params.get('employeeId');
        if (params.get('employeeName')) updates.employeeName = params.get('employeeName');
        if (params.get('email')) updates.email = params.get('email');
        if (params.get('designation')) updates.designation = params.get('designation');
        if (params.get('departmentId')) updates.departmentId = params.get('departmentId');
        if (params.get('vacancy')) updates.vacancy = params.get('vacancy');
        if (params.get('jobOpening')) updates.vacancy = params.get('jobOpening');

        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, []);

    const handleVacancyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vacancyId = e.target.value;
        const vacancy = vacancies.find(v => v._id === vacancyId || v.name === vacancyId);

        if (vacancy) {
            // Auto-fill from Vacancy
            // Use stored departmentId if available, otherwise fallback to name match
            const vacDeptId = vacancy.departmentId?._id || vacancy.departmentId;

            // Find department object to ensure local state consistency
            const dept = departments.find(d =>
                (vacDeptId && d._id === vacDeptId) ||
                d.name === vacancy.department
            );

            setFormData(prev => ({
                ...prev,
                vacancy: vacancyId,
                department: vacancy.department, // Use the name from vacancy as display
                departmentId: dept ? dept._id : (vacDeptId || ''), // Prefer matched ID, then raw ID
                designation: vacancy.job_title
            }));
        } else {
            setFormData(prev => ({ ...prev, vacancy: '' }));
        }
    };

    const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deptId = e.target.value;
        const dept = departments.find(d => d._id === deptId);
        setFormData(prev => ({
            ...prev,
            departmentId: deptId,
            department: dept ? dept.name : '',
            designation: '',
            reportsToRole: '' // Reset
        }));
    };

    // ... (handleSubmit needs to ignore reportsTo logic for now or mapped) ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const orgId = localStorage.getItem('organization_id');

        try {
            const res = await fetch('/api/resource/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    username: formData.employeeId, // Set username to be the same as employeeId
                    jobOpening: formData.vacancy || undefined, // Map vacancy -> jobOpening for backend enforcement
                    organizationId: orgId
                })
            });

            if (res.ok) {
                alert('Employee onboarded successfully!');
                navigate('/employee');
            } else {
                const json = await res.json();
                alert('Error: ' + (json.error || 'Failed to onboard employee'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    // Filter designations based on selected department
    // Designations are now auto-created when vacancies are posted, so we just filter by departmentId
    const filteredDesignations = useMemo(() => {
        if (!formData.departmentId) return designations;

        const selectedDept = departments.find(d => d._id === formData.departmentId);
        const deptName = selectedDept?.name || formData.department;

        // Filter designations that belong to this department (by ID or by matching the department's whitelist)
        const whitelist = selectedDept?.designations || [];

        // Get designations matching by departmentId
        const byDeptId = designations.filter(d => {
            const dId = d.departmentId?._id || d.departmentId;
            return dId && String(dId) === String(formData.departmentId);
        });

        // Also include designations matching the department's whitelist
        const byWhitelist = whitelist.length > 0
            ? designations.filter(d =>
                whitelist.some((w: string) => w?.toLowerCase() === d.title?.toLowerCase())
            )
            : [];

        // Combine and dedupe
        const combined = [...byDeptId];
        const existingTitles = new Set(byDeptId.map(d => d.title?.toLowerCase()));

        for (const d of byWhitelist) {
            if (!existingTitles.has(d.title?.toLowerCase())) {
                combined.push(d);
                existingTitles.add(d.title?.toLowerCase());
            }
        }

        console.log('Onboarding - Filtered Designations for', deptName, ':', combined);
        return combined.length > 0 ? combined : designations;
    }, [formData.departmentId, designations, departments, formData.department]);

    useEffect(() => {
        if (formData.departmentId) {
            console.log('Onboarding - Filtered Designations:', filteredDesignations);
        }
    }, [filteredDesignations, formData.departmentId]);

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Employee Onboarding"
                newHref="/employee"
                newLabel=""
                summaryItems={[]}
                masterCards={[]}
                shortcuts={[]}
            />

            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-600" />
                        Role-Based Onboarding
                    </h3>
                    <Link to="/employee" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-[13px]">
                        <ArrowLeft size={16} /> Cancel
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Vacancy Selection (Optional but Recommended) */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[13px] font-bold text-blue-800 flex items-center gap-2">
                                <Briefcase size={16} /> Link to Vacancy (Job Opening) <span className="text-red-500">*</span>
                            </label>
                            <Link
                                to="/jobopening/new"
                                target="_blank"
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                                <span className="text-lg">+</span> Post New Vacancy
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                required
                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={formData.vacancy}
                                onChange={handleVacancyChange}
                            >
                                <option value="">Select a Vacancy (Required)</option>
                                {vacancies.map(v => (
                                    <option
                                        key={v._id}
                                        value={v._id}
                                        disabled={v.remaining <= 0}
                                    >
                                        {v.job_title} - {v.department} ({v.remaining > 0 ? `${v.remaining} remaining of ${v.no_of_positions}` : 'FILLED'})
                                    </option>
                                ))}
                            </select>
                            <div className="text-[11px] text-blue-600 flex items-center">
                                Selecting a vacancy will automatically fill the Department and Designation for the new employee.
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div>
                        <h4 className="text-[14px] font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                            <User size={16} /> Personal Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. John Doe"
                                    value={formData.employeeName}
                                    onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        required
                                        type="email"
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="john@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Employee ID <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30"
                                        placeholder="EMP-XXXX"
                                        value={formData.employeeId}
                                        onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 italic">This ID will be used for staff portal login.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Login Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        required
                                        type="password"
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Joining Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.dateOfJoining}
                                        onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hierarchy & Role */}
                    <div>
                        <h4 className="text-[14px] font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-2">
                            <Building2 size={16} /> Hierarchy & Role
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.departmentId}
                                    onChange={handleDeptChange}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-medium text-gray-700">Designation <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <select
                                        required
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                        disabled={!formData.departmentId}
                                    >
                                        <option value="">{formData.departmentId ? 'Select Designation' : 'Select Dept First'}</option>
                                        {filteredDesignations.map(d => (
                                            <option key={d._id} value={d.title}>{d.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[13px] font-medium text-gray-700">Reports To (Role/Designation)</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.reportsToRole}
                                    onChange={e => setFormData({ ...formData, reportsToRole: e.target.value })}
                                    disabled={!formData.departmentId}
                                >
                                    <option value="">{formData.departmentId ? 'Select Reporting Role' : 'Select Dept First'}</option>
                                    {filteredDesignations.map(d => (
                                        <option key={d._id} value={d.title}>{d.title}</option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Select the <strong>Designation</strong> that this employee reports to (e.g., Manager).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Link to="/employee" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-[13px] hover:bg-gray-50 transition-all">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                        >
                            {loading ? 'Onboarding...' : <><Save size={16} /> Complete Onboarding</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
