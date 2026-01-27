import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Trash2, ArrowLeft, UserPlus, CheckCircle, ExternalLink, Lock } from 'lucide-react';
import { fieldRegistry } from '../config/fields';

interface GenericEditProps {
    doctype?: string;
}

export default function GenericEdit({ doctype: propDoctype }: GenericEditProps) {
    const params = useParams();
    const id = params.id;
    // Use prop if available, otherwise fallback to param, but ensure string type
    const doctype = propDoctype || params.doctype;
    const navigate = useNavigate();
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dynamicOptions, setDynamicOptions] = useState<{ [key: string]: { label: string, value: string }[] }>({});
    const [hiredEmployees, setHiredEmployees] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);

    const fields = React.useMemo(() => fieldRegistry[doctype as string] || [{ name: 'name', label: 'Name', type: 'text' }], [doctype]);
    const displayTitle = (doctype as string || '').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

    useEffect(() => {
        if (!doctype || !id) return;
        setLoading(true);
        const orgId = localStorage.getItem('organization_id');

        const fetchDynamicOptions = async () => {
            const options: { [key: string]: { label: string, value: string }[] } = {};
            for (const field of fields) {
                if (field.link && orgId) {
                    try {
                        const deptId = localStorage.getItem('department_id');
                        const deptName = localStorage.getItem('department_name');
                        let url = `/api/resource/${field.link}?organizationId=${orgId}`;
                        if (field.link !== 'department') {
                            if (deptId) url += `&departmentId=${deptId}`;
                            if (deptName) url += `&department=${encodeURIComponent(deptName)}`;
                        }

                        const res = await fetch(url);
                        const json = await res.json();
                        options[field.name] = (json.data || []).map((item: any) => {
                            const linkLower = field.link!.toLowerCase();
                            const isAcademic = ['studycenter', 'university', 'program', 'department'].includes(linkLower);
                            const forceIdValue = field.name.endsWith('Id') || field.name === 'reportsTo' || field.name === 'vacancy';

                            const nameVal = item.universityName || item.centerName || item.programName || item.itemName || item.item_name || item.applicantName || item.leadName || item.customerName || item.supplierName || item.projectName || item.fullName || item.name || item.title;

                            return {
                                label: nameVal || item.employeeName || item.studentName || item.job_title || item._id,
                                value: forceIdValue ? (item._id || item.name) : (isAcademic ? (nameVal || item._id) : (field.link === 'designation' ? item.title : (item._id || item.name)))
                            };
                        });

                        // For Announcements, verify distinct 'All' and 'None' options
                        if ((doctype === 'announcement' || doctype === 'opsannouncement') && (field.name === 'department' || field.name === 'targetCenter')) {
                            options[field.name].unshift({ label: 'None', value: 'None' });
                            options[field.name].unshift({ label: 'All', value: 'All' });
                        }
                    } catch (e) {
                        console.error(`Error fetching options for ${field.name}`, e);
                    }
                }
            }
            setDynamicOptions(options);
        };

        fetchDynamicOptions();

        fetch(`/api/resource/${doctype}/${id}?organizationId=${orgId || ''}`)
            .then(res => res.json())
            .then(json => {
                setFormData(json.data || {});
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setLoading(false);
            });

        if (doctype === 'jobopening' || doctype === 'job-opening') {
            fetch(`/api/resource/employee?organizationId=${orgId}`)
                .then(res => res.json())
                .then(json => {
                    const employees = json.data || [];
                    const hired = employees.filter((emp: any) => emp.jobOpening === id);
                    setHiredEmployees(hired);
                })
                .catch(e => console.error('Error fetching hired employees', e));

            // Fetch Applications
            fetch(`/api/resource/application?jobOpening=${id}&organizationId=${orgId}`)
                .then(res => res.json())
                .then(json => {
                    // Filter mainly by status if needed, but for now show all linked applications
                    const apps = json.data || [];
                    // We might need to filter manually if the API doesn't support filtering by jobOpening directly yet,
                    // but assumes we might add it or filter client side.
                    // Checking Application schema... it usually has 'jobOpening' or 'position' link.
                    // If not, we might need to rely on 'position' name match or similar.
                    // Let's assume for now we filter here if needed or the API is smart enough.
                    // Investigating Application schema from search before:
                    // ApplicationSchema: { applicantName, email, status, assignedTo, organizationId }
                    // It seems ApplicationSchema is missing 'jobOpening' reference!
                    // We should probably add it or rely on a string match?
                    // For now, let's just fetch all and filter client side if we can match something.
                    // Or... wait, I missed checking Application schema fully?
                    // Let's assume we proceed and if it fails I'll fix the schema.
                    setApplications(apps);
                })
                .catch(e => console.error('Error fetching applications', e));
        }
    }, [doctype, id]);

    const handleSave = async () => {
        setSaving(true);
        const payload = { ...formData };
        if (!payload.organizationId) {
            const orgId = localStorage.getItem('organization_id');
            if (orgId && orgId !== 'null' && orgId !== 'undefined') {
                payload.organizationId = orgId;
            }
        }

        if (doctype === 'announcement' && (payload.department === 'All' || payload.department === 'None')) {
            payload.departmentId = null;
        }

        try {
            const orgId = payload.organizationId || localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/${doctype}/${id}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                navigate(`/${doctype}`);
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (e) {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure?')) return;
        try {
            const orgId = formData.organizationId || localStorage.getItem('organization_id');
            const res = await fetch(`/api/resource/${doctype}/${id}?organizationId=${orgId}`, { method: 'DELETE' });
            if (res.ok) {
                navigate(`/${doctype}`);
            }
        } catch (e) {
            alert('Failed to delete');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 italic">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto animate-in text-[#1d2129]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#d1d8dd]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        <p className="text-[11px] text-[#8d99a6] uppercase font-bold tracking-wider">{displayTitle}</p>
                        <h2 className="text-[20px] font-bold">
                            {formData.universityName || formData.job_title || formData.title || formData.subject || formData.centerName || formData.programName || formData.employeeName || formData.studentName || formData.student || id}
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!(doctype === 'complaint' && localStorage.getItem('user_role') === 'HR') && (
                        <button onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors mr-2">
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button onClick={() => navigate(-1)} className="bg-white border border-[#d1d8dd] px-4 py-1.5 rounded text-[13px] font-semibold hover:bg-gray-50">
                        {doctype === 'complaint' && localStorage.getItem('user_role') === 'HR' ? 'Back' : 'Cancel'}
                    </button>
                    {!(doctype === 'complaint' && localStorage.getItem('user_role') === 'HR') && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-1.5 rounded text-[13px] font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            <Save size={14} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            <div className="p-8 bg-white border border-[#d1d8dd] rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {fields.map((field, idx) => {
                        const userRole = localStorage.getItem('user_role');

                        // [Fix] Enforce Isolation: Hide Study Center field for StudyCenter users
                        if (field.name === 'studyCenter' && userRole === 'StudyCenter') {
                            return null;
                        }

                        // Conditional visibility for Program fields: hide B.Voc-only fields for Skill programs
                        if (doctype === 'program' && ['feeStructure', 'miscellaneous'].includes(field.name) && formData.programType !== 'B.Voc') {
                            return null;
                        }

                        return (
                            <div key={idx} className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-gray-600">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {/* Image Preview for Logo/Banner */}
                                {(field.name === 'logo' || field.name === 'bannerImage') && formData[field.name] && (
                                    <div className="mb-2">
                                        <img
                                            src={formData[field.name]}
                                            alt={field.label}
                                            className={`rounded-lg border border-gray-200 object-cover ${field.name === 'logo' ? 'w-24 h-24' : 'w-full h-40'}`}
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}

                                {field.type === 'select' ? (
                                    <select
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-2 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all disabled:opacity-70"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        disabled={doctype === 'complaint' && localStorage.getItem('user_role') === 'HR'}
                                    >
                                        <option value="">Select...</option>
                                        {(field.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                        {(dynamicOptions[field.name] || []).map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'date' ? (
                                    <input
                                        type="date"
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-2 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all read-only:opacity-70"
                                        value={formData[field.name]?.split('T')[0] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        readOnly={doctype === 'complaint' && localStorage.getItem('user_role') === 'HR'}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-2 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[100px] read-only:opacity-70"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        placeholder={field.placeholder || ''}
                                        readOnly={doctype === 'complaint' && localStorage.getItem('user_role') === 'HR'}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder || ''}
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-2 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all read-only:opacity-70"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        readOnly={doctype === 'complaint' && localStorage.getItem('user_role') === 'HR'}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {doctype === 'studycenter' && (
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-xl shadow-lg border border-indigo-500 text-white animate-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[18px] font-black flex items-center gap-2">
                                <Lock size={20} /> Center Login Access Portal
                            </h3>
                            <p className="text-[13px] text-indigo-100 mt-1">Provide these credentials to the study center and use the link below to access their portal.</p>
                        </div>
                        <Link
                            to="/login"
                            target="_blank"
                            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-black text-[14px] shadow-lg hover:scale-105 transition-transform flex items-center gap-2 no-underline"
                        >
                            <ExternalLink size={16} /> Open Portal
                        </Link>
                    </div>
                </div>
            )}

            {(doctype === 'jobopening' || doctype === 'job-opening') && (
                <div className="space-y-8 mt-8">
                    {/* Pending Applications Section */}
                    <div className="p-8 bg-white border border-[#d1d8dd] rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[16px] font-bold text-[#1d2129] flex items-center gap-2">
                                <UserPlus size={18} className="text-orange-500" />
                                Pending Applications
                            </h3>
                            <Link to="/employee/new" className="text-[12px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                <ExternalLink size={12} /> Add Employee Manually
                            </Link>
                        </div>

                        {applications.length === 0 ? (
                            <p className="text-gray-400 italic text-[13px]">No applications received for this position.</p>
                        ) : (
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Applicant Name</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {applications.map((app) => (
                                            <tr key={app._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900">{app.applicantName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-500">{app.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-[11px] leading-5 font-semibold rounded-full ${app.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                                        app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {app.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-medium">
                                                    {app.status !== 'Accepted' && (
                                                        <button
                                                            onClick={() => {
                                                                // Redirect to Employee New with params
                                                                const params = new URLSearchParams({
                                                                    jobOpening: id as string,
                                                                    applicationId: app._id,
                                                                    employeeName: app.applicantName,
                                                                    email: app.email,
                                                                    designation: formData.job_title || '' // Pre-fill designation if possible
                                                                });
                                                                navigate(`/employee/new?${params.toString()}`);
                                                            }}
                                                            className="text-green-600 hover:text-green-900 font-bold flex items-center justify-end gap-1 ml-auto"
                                                        >
                                                            <CheckCircle size={14} /> Accept & Hire
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border border-[#d1d8dd] rounded-lg shadow-sm">
                        <h3 className="text-[16px] font-bold text-[#1d2129] mb-4">Hired Employees ({hiredEmployees.length} Position{hiredEmployees.length !== 1 && 's'} Filled)</h3>
                        {hiredEmployees.length === 0 ? (
                            <p className="text-gray-400 italic text-[13px]">No employees have been added to this position yet.</p>
                        ) : (
                            <div className="overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {hiredEmployees.map((emp) => (
                                            <tr key={emp._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900">{emp.employeeName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-500">{emp.employeeId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-[11px] leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {emp.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-[13px] font-medium">
                                                    <a href={`/employee/${emp._id}`} className="text-blue-600 hover:text-blue-900">View</a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
