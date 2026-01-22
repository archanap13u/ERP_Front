import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Save, Plus, X, Trash2 } from 'lucide-react';
import { fieldRegistry } from '../config/fields';

interface GenericNewProps {
    doctype?: string;
}

export default function GenericNew({ doctype: propDoctype }: GenericNewProps) {
    const params = useParams();
    // Use prop if available, otherwise fallback to param
    const doctype = propDoctype || params.doctype;
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [dynamicOptions, setDynamicOptions] = useState<{ [key: string]: { label: string, value: string }[] }>({});
    const [allowedDesignations, setAllowedDesignations] = useState<string[] | null>(null);

    const fields = React.useMemo(() => fieldRegistry[doctype as string] || [{ name: 'name', label: 'Name', type: 'text' }], [doctype]);
    const displayTitle = (doctype as string || '').replace(/([A-Z])/g, ' $1').trim();

    // Poll options state
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

    // Sync poll options to text area
    useEffect(() => {
        if (doctype === 'announcement' || doctype === 'opsannouncement') {
            const text = pollOptions.filter(o => o.trim()).join('\n');
            setFormData((prev: any) => ({ ...prev, poll_options_text: text }));
        }
    }, [pollOptions, doctype]);

    useEffect(() => {
        const storedOrgId = localStorage.getItem('organization_id');
        const orgId = (storedOrgId === 'null' || storedOrgId === 'undefined') ? null : storedOrgId;
        if (!orgId) return;

        const fetchDynamicOptions = async () => {
            const options: { [key: string]: { label: string, value: string }[] } = {};
            for (const field of fields) {
                if (field.link) {
                    try {
                        const deptId = localStorage.getItem('department_id');
                        const deptName = localStorage.getItem('department_name');
                        let url = `/api/resource/${field.link}?organizationId=${orgId}`;
                        const urlParams = new URLSearchParams(location.search);
                        const studyCenterFilter = urlParams.get('studyCenter') || localStorage.getItem('study_center_name');

                        if (field.link !== 'department' && field.link !== 'student') {
                            if (deptId) url += `&departmentId=${deptId}`;
                            if (deptName) url += `&department=${encodeURIComponent(deptName)}`;
                        }

                        // Apply Center filtering for Students specifically
                        if (field.link === 'student' && studyCenterFilter) {
                            url += `&studyCenter=${encodeURIComponent(studyCenterFilter.trim())}`;
                        }

                        const res = await fetch(url);
                        const json = await res.json();
                        options[field.name] = (json.data || []).map((item: any) => ({
                            label: item.title || item.centerName || item.universityName || item.programName || item.job_title || item.name || item.employeeName || item.studentName || item._id,
                            value: field.link === 'designation' ? item.title : (item._id || item.name)
                        }));

                        // For Announcements, verify distinct 'All' and 'None' options
                        if ((doctype === 'announcement' || doctype === 'opsannouncement') && (field.name === 'department' || field.name === 'targetCenter')) {
                            options[field.name].unshift({ label: 'None', value: 'None' });
                            if (field.name === 'department') {
                                options[field.name].unshift({ label: 'All', value: 'All' });
                            }
                        }
                    } catch (e) {
                        console.error(`Error fetching options for ${field.name}`, e);
                    }
                }
            }
            setDynamicOptions(options);

            // Fetch Department Context for Whitelisting
            const contextDeptId = localStorage.getItem('department_id') || new URLSearchParams(location.search).get('departmentId');
            if (doctype === 'employee' && contextDeptId) {
                try {
                    const resDept = await fetch(`/api/resource/department/${contextDeptId}?organizationId=${orgId}`);
                    const jsonDept = await resDept.json();
                    if (jsonDept.data?.designations?.length > 0) {
                        setAllowedDesignations(jsonDept.data.designations);
                    }
                } catch (e) {
                    console.error('Error fetching department whitelist:', e);
                }
            }

            const storedDeptId = localStorage.getItem('department_id');
            const userRole = localStorage.getItem('user_role');

            setFormData((prev: any) => {
                const updated = { ...prev, organizationId: orgId };
                const deptName = localStorage.getItem('department_name');

                const isDepartmental = ['holiday', 'complaint', 'performancereview', 'attendance', 'studycenter', 'announcement', 'opsannouncement', 'program', 'university', 'jobopening', 'internalmark'].includes(doctype || '');

                if (isDepartmental) {
                    if (storedDeptId) {
                        updated.departmentId = storedDeptId;
                    }
                    // Set department name for data isolation
                    if (deptName) {
                        updated.department = deptName;
                    }
                }

                // Track the source panel for employees specifically
                if (doctype === 'employee') {
                    if (storedDeptId) updated.addedByDepartmentId = storedDeptId;
                    if (deptName) updated.addedByDepartmentName = deptName;
                }

                const studyCenter = localStorage.getItem('study_center_name');
                if (studyCenter && userRole === 'StudyCenter') {
                    updated.studyCenter = studyCenter;
                }

                // Initialize defaults from fields config
                fields.forEach(field => {
                    if (field.default !== undefined && updated[field.name] === undefined) {
                        updated[field.name] = field.default;
                    }
                });

                return updated;
            });
        };

        fetchDynamicOptions();
    }, [doctype]);

    // Pre-fill from Query Params (e.g. from Job Opening Acceptance or Contextual dashboards)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const updates: any = {};

        if (params.get('employeeName')) updates.employeeName = params.get('employeeName');
        if (params.get('email')) updates.email = params.get('email');
        if (params.get('jobOpening')) updates.jobOpening = params.get('jobOpening');
        if (params.get('applicationId')) updates.applicationId = params.get('applicationId');
        if (params.get('designation')) updates.designation = params.get('designation');
        if (params.get('department')) updates.department = params.get('department');
        if (params.get('departmentId')) updates.departmentId = params.get('departmentId');
        if (params.get('studyCenter')) updates.studyCenter = params.get('studyCenter');
        if (params.get('student')) updates.student = params.get('student');
        if (params.get('studentId')) updates.studentId = params.get('studentId');
        if (params.get('program')) updates.program = params.get('program');
        if (params.get('semester')) updates.semester = params.get('semester');
        if (params.get('batch')) updates.batch = params.get('batch');
        if (params.get('subject')) updates.subject = params.get('subject');

        // Track the source panel for employees specifically if passed in URL
        if (doctype === 'employee') {
            if (params.get('departmentId')) updates.addedByDepartmentId = params.get('departmentId');
            if (params.get('department')) updates.addedByDepartmentName = params.get('department');
        }

        if (Object.keys(updates).length > 0) {
            setFormData((prev: any) => ({ ...prev, ...updates }));
        }
    }, [location.search]);

    const handleSave = async () => {
        // Validation
        const requiredFields = fields.filter(f => f.required);
        for (const field of requiredFields) {
            if (!formData[field.name]) {
                alert(`Please fill in the required field: ${field.label}`);
                return;
            }
        }

        if (!formData.organizationId) {
            alert('Organization ID is missing. Please try logging in again.');
            return;
        }

        const payload = { ...formData };
        if ((doctype === 'announcement' || doctype === 'opsannouncement') && (payload.department === 'All' || payload.department === 'None')) {
            payload.departmentId = null;
        }

        setSaving(true);
        if (doctype === 'internalmark') {
            console.log('--- SUBMITTING INTERNAL MARK ---');
            console.log('Payload:', JSON.stringify(payload, null, 2));
            console.log('--------------------------------');
        }
        try {
            const res = await fetch(`/api/resource/${doctype}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                // If linked to an application, update its status
                if (formData.applicationId) {
                    try {
                        const orgId = localStorage.getItem('organization_id');
                        await fetch(`/api/resource/application/${formData.applicationId}?organizationId=${orgId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Accepted' })
                        });
                    } catch (e) {
                        console.error('Failed to update application status', e);
                    }
                }

                const redirectParams = new URLSearchParams(location.search);
                const redirectUrl = redirectParams.get('redirect');

                if (redirectUrl) {
                    navigate(redirectUrl);
                } else if (doctype === 'internalmark' && localStorage.getItem('user_role') === 'StudyCenter') {
                    navigate('/center-dashboard#marks-record');
                } else {
                    navigate(`/${doctype}`);
                }
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed to save record'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to connect to server');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in text-[#1d2129]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#d1d8dd]">
                <div className="flex items-center gap-4">


                    <button
                        onClick={() => {
                            const redirect = new URLSearchParams(location.search).get('redirect');
                            if (redirect) navigate(redirect);
                            else navigate(`/${doctype}`);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-1 text-[11px] text-[#8d99a6] uppercase font-bold tracking-wider">
                            <span>New</span>
                            <span className="hover:text-blue-600 hover:underline cursor-pointer" onClick={() => {
                                const redirect = new URLSearchParams(location.search).get('redirect');
                                if (redirect) navigate(redirect);
                                else navigate(`/${doctype}`);
                            }}>
                                {displayTitle}
                            </span>
                        </div>
                        <h2 className="text-[20px] font-bold flex items-center gap-2">
                            Untitled
                            {formData.department && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter whitespace-nowrap">
                                    {formData.department}
                                </span>
                            )}
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const redirect = new URLSearchParams(location.search).get('redirect');
                            if (redirect) navigate(redirect);
                            else navigate(`/${doctype}`);
                        }}
                        className="bg-white border border-[#d1d8dd] px-4 py-1.5 rounded text-[13px] font-semibold hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-1.5 rounded text-[13px] font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <Save size={14} />
                        {saving ? 'Saving...' : (doctype === 'student' && localStorage.getItem('user_role') === 'StudyCenter' ? 'Send for Verification' : 'Save')}
                    </button>
                </div>
            </div>

            <div className="p-8 bg-white space-y-8 border border-[#d1d8dd] rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {fields.map((field, idx) => {
                        // Conditional visibility for Poll Options
                        if ((doctype === 'announcement' || doctype === 'opsannouncement') && field.name === 'poll_options_text' && formData.type !== 'Poll') {
                            return null;
                        }

                        // Conditional visibility for Program B.Voc fields
                        if (doctype === 'program' && ['feeStructure', 'syllabus', 'miscellaneous'].includes(field.name) && formData.programType !== 'B.Voc') {
                            return null;
                        }

                        // Hide Study Center field if user is a StudyCenter role (it's auto-filled)
                        if (field.name === 'studyCenter' && localStorage.getItem('user_role') === 'StudyCenter') {
                            return null;
                        }

                        // Hide Target Study Center for HR announcements
                        if (doctype === 'announcement' && field.name === 'targetCenter' && formData.department === 'Human Resources') {
                            return null;
                        }

                        // Special UI for Poll Options
                        if (field.name === 'poll_options_text') {
                            return (
                                <div key={idx} className="space-y-1.5 col-span-1 md:col-span-2">
                                    <label className="text-[12px] font-medium text-[#626161] flex items-center gap-2">
                                        Poll Options <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Recommended: 2-5 options</span>
                                    </label>
                                    <div className="space-y-2 bg-[#f8f9fa] p-4 rounded-lg border border-[#ebedef]">
                                        {pollOptions.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">
                                                    {i + 1}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    placeholder={`Option ${i + 1}`}
                                                    className="flex-1 bg-white border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:border-blue-400 outline-none transition-all shadow-sm"
                                                    onChange={(e) => {
                                                        const newOpts = [...pollOptions];
                                                        newOpts[i] = e.target.value;
                                                        setPollOptions(newOpts);
                                                    }}
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button
                                                        onClick={() => {
                                                            const newOpts = pollOptions.filter((_, idx) => idx !== i);
                                                            setPollOptions(newOpts);
                                                        }}
                                                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setPollOptions([...pollOptions, ''])}
                                            className="text-[12px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2 pl-8"
                                        >
                                            <Plus size={14} /> Add Option
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={idx} className="space-y-1.5">
                                <label className="text-[12px] font-medium text-[#626161]">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'select' ? (
                                    <select
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => {
                                            const newData = { ...formData, [field.name]: e.target.value };

                                            // For departmentId field, also set department name
                                            if (field.name === 'departmentId' && field.link === 'department') {
                                                const selectedDept = (dynamicOptions[field.name] || []).find(
                                                    opt => opt.value === e.target.value
                                                );
                                                if (selectedDept) {
                                                    newData.department = selectedDept.label;
                                                }
                                            }

                                            // Sync Student name when studentId is selected (for InternalMarks)
                                            if (field.name === 'studentId' && field.link === 'student') {
                                                const selectedStudent = (dynamicOptions[field.name] || []).find(
                                                    opt => opt.value === e.target.value
                                                );
                                                if (selectedStudent) {
                                                    newData.student = selectedStudent.label;
                                                }
                                            }

                                            setFormData(newData);
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        {/* Special All Option for Announcement Department */}
                                        {doctype === 'announcement' && field.name === 'department' && (
                                            <option value="All">All Departments</option>
                                        )}
                                        {field.options && field.options.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        {(dynamicOptions[field.name] || [])
                                            .filter((opt: any) => {
                                                if (field.name === 'designation' && allowedDesignations) {
                                                    return allowedDesignations.some(d => d.toLowerCase() === opt.label.toLowerCase());
                                                }
                                                return true;
                                            })
                                            .map((opt: any) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                    </select>
                                ) : field.type === 'date' || field.type === 'datetime-local' ? (
                                    <input
                                        type={field.type}
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all"
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[100px]"
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    />
                                ) : field.type === 'checkbox' ? (
                                    <div className="flex items-center h-[34px]">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder || ''}
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all"
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="pt-8 border-t border-gray-100">
                    <p className="text-[11px] text-[#8d99a6] italic">Note: Fields marked with * are mandatory.</p>
                </div>
            </div>
        </div>
    );
}
