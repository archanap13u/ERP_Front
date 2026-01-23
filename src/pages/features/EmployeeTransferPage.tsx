import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, User, Building2, Briefcase, Save, ArrowLeft, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Workspace from '../../components/Workspace';

export default function EmployeeTransferPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);
    const [vacancies, setVacancies] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [currentDetails, setCurrentDetails] = useState<any>(null);

    const [formData, setFormData] = useState({
        employeeName: '',
        newDepartmentId: '',
        newDesignation: '',
        newReportsTo: '',
        transferDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const orgId = localStorage.getItem('organization_id');

        // Fetch Employees
        fetch(`/api/resource/employee?organizationId=${orgId}&status=Active`)
            .then(res => res.json())
            .then(json => setEmployees(json.data || []))
            .catch(console.error);

        // Fetch Departments
        fetch(`/api/resource/department?organizationId=${orgId}`)
            .then(res => res.json())
            .then(json => setDepartments(json.data || []))
            .catch(console.error);

        // Fetch Designations
        fetch(`/api/resource/designation?organizationId=${orgId}`)
            .then(res => res.json())
            .then(json => setDesignations(json.data || []))
            .catch(console.error);

        // Fetch Vacancies (Job Openings) - their job_titles serve as designations for their departments
        fetch(`/api/resource/jobopening?organizationId=${orgId}`)
            .then(res => res.json())
            .then(json => setVacancies(json.data || []))
            .catch(console.error);

        // Fetch Managers (All Active Employees)
        fetch(`/api/resource/employee?organizationId=${orgId}&status=Active`)
            .then(res => res.json())
            .then(json => setManagers(json.data || []))
            .catch(console.error);
    }, []);

    const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        setSelectedEmployeeId(empId);

        const emp = employees.find(e => e._id === empId);
        if (emp) {
            setCurrentDetails({
                name: emp.employeeName,
                department: emp.department,
                designation: emp.designation,
                reportsTo: emp.reportsTo,
                reportsToRole: emp.reportsToRole // Capture new field
            });
            // Reset form
            setFormData(prev => ({
                ...prev,
                employeeName: emp.employeeName,
                newDepartmentId: '',
                newDesignation: '',
                newReportsTo: ''
            }));
        } else {
            setCurrentDetails(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const selectedDept = departments.find(d => d._id === formData.newDepartmentId);

        try {
            // Get Organization ID
            const storedOrgId = localStorage.getItem('organization_id');
            const orgId = (storedOrgId === 'null' || storedOrgId === 'undefined' || !storedOrgId) ? '' : storedOrgId;

            if (!orgId) {
                alert('Error: Organization ID is missing. Please log out and log in again.');
                setLoading(false);
                return;
            }

            // Update Employee Record
            const res = await fetch(`/api/resource/employee/${selectedEmployeeId}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: orgId, // Ensure backend receives orgId in body
                    employeeName: formData.employeeName,
                    departmentId: formData.newDepartmentId || undefined,
                    department: selectedDept ? selectedDept.name : currentDetails.department,
                    designation: formData.newDesignation || currentDetails.designation,
                    reportsToRole: formData.newReportsTo || currentDetails.reportsToRole
                })
            });

            if (res.ok) {
                alert('Employee transferred successfully!');
                navigate('/employee');
            } else {
                const json = await res.json();
                alert('Error: ' + (json.error || 'Failed to transfer employee'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    // Filter designations based on NEW selected department
    // Designations are now auto-created when vacancies are posted, so we just filter by departmentId
    const filteredDesignations = (() => {
        if (!formData.newDepartmentId) return [];

        // Get designations matching by departmentId
        const byDeptId = designations.filter(d => {
            const deptId = d.departmentId && typeof d.departmentId === 'object'
                ? (d.departmentId as any)._id
                : d.departmentId;
            return String(deptId) === String(formData.newDepartmentId);
        });

        // Also check if the selected department has an embedded designations array (whitelist)
        const selectedDept = departments.find(d => d._id === formData.newDepartmentId);
        const embeddedDesignations = selectedDept?.designations || [];

        // Convert embedded string designations to objects with title property for consistency
        const fromDeptEmbedded = embeddedDesignations.map((title: string, idx: number) => ({
            _id: `embedded-${idx}`,
            title: title
        }));

        // Combine both sources, avoiding duplicates
        const combined = [...byDeptId];
        const existingTitles = new Set(byDeptId.map(d => d.title?.toLowerCase()));

        for (const embedded of fromDeptEmbedded) {
            if (!existingTitles.has(embedded.title?.toLowerCase())) {
                combined.push(embedded);
                existingTitles.add(embedded.title?.toLowerCase());
            }
        }

        return combined;
    })();

    return (
        <div className="space-y-8 pb-20 text-[#1d2129]">
            <Workspace
                title="Employee Transfer"
                newHref="/employee"
                newLabel="Add Employee"
                summaryItems={[]}
                masterCards={[]}
                shortcuts={[]}
            />

            <div className="max-w-5xl mx-auto bg-white rounded-xl border border-[#d1d8dd] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#d1d8dd] bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-2">
                        <ArrowLeftRight size={20} className="text-blue-600" />
                        Internal Transfer
                    </h3>
                    <Link to="/employee" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-[13px]">
                        <ArrowLeft size={16} /> Cancel
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* 1. Select Employee */}
                    <div>
                        <label className="text-[13px] font-bold text-gray-900 mb-2 block">Select Employee to Transfer</label>
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select
                                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedEmployeeId}
                                onChange={handleEmployeeSelect}
                            >
                                <option value="">-- Search Employee --</option>
                                {employees.map(e => (
                                    <option key={e._id} value={e._id}>{e.employeeName} ({e.employeeId})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {currentDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                            {/* Divider Arrow for Desktop */}
                            <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full border border-gray-200">
                                <ArrowLeftRight size={20} className="text-blue-600" />
                            </div>

                            {/* Current Position */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 opacity-75">
                                <h4 className="text-[14px] font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    Current Position
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] text-gray-500 uppercase font-bold">Name</p>
                                        <p className="text-[13px] font-medium text-gray-900">{currentDetails.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-500 uppercase font-bold">Department</p>
                                        <p className="text-[13px] font-medium text-gray-900">{currentDetails.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-500 uppercase font-bold">Designation</p>
                                        <p className="text-[13px] font-medium text-gray-900">{currentDetails.designation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-500 uppercase font-bold">Reports To</p>
                                        <p className="text-[13px] font-medium text-gray-900">
                                            {currentDetails.reportsToRole || (typeof currentDetails.reportsTo === 'object' ? currentDetails.reportsTo?.employeeName : 'N/A')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* New Position Form */}
                            <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
                                <h4 className="text-[14px] font-bold text-blue-800 mb-4 flex items-center gap-2">
                                    Update Details
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-700 mb-1 block">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white focus:ring-2 focus:ring-blue-500"
                                            value={formData.employeeName}
                                            onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                                            placeholder="Employee Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-700 mb-1 block">New Department <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white focus:ring-2 focus:ring-blue-500"
                                            value={formData.newDepartmentId}
                                            onChange={e => setFormData({ ...formData, newDepartmentId: e.target.value, newDesignation: '' })}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(d => (
                                                <option key={d._id} value={d._id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-700 mb-1 block">New Designation</label>
                                        <select
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white focus:ring-2 focus:ring-blue-500"
                                            value={formData.newDesignation}
                                            onChange={e => setFormData({ ...formData, newDesignation: e.target.value })}
                                        >
                                            <option value="">{formData.newDepartmentId ? 'Select Designation' : 'Select Dept To Filter'}</option>
                                            {filteredDesignations.map(d => (
                                                <option key={d._id} value={d.title}>{d.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-700 mb-1 block">New Reporting Role (Designation)</label>
                                        <select
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-[13px] bg-white focus:ring-2 focus:ring-blue-500"
                                            value={formData.newReportsTo} // We'll reuse this state variable but mapping to reportsToRole in submit
                                            onChange={e => setFormData({ ...formData, newReportsTo: e.target.value })}
                                            disabled={!formData.newDepartmentId}
                                        >
                                            <option value="">{formData.newDepartmentId ? 'Select Reporting Role' : 'Select Dept First'}</option>
                                            {filteredDesignations.map(d => (
                                                <option key={d._id} value={d.title}>{d.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentDetails && (
                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                            <Link to="/employee" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-[13px] hover:bg-gray-50 transition-all">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                            >
                                {loading ? 'Transferring...' : <><Save size={16} /> Confirm Transfer</>}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
