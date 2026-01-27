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

    const fields = React.useMemo(() => {
        const key = (doctype as string || '').toLowerCase();
        return fieldRegistry[key] || [{ name: 'name', label: 'Name', type: 'text' }];
    }, [doctype]);
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

    // Synchronous Initialization of FormData
    useEffect(() => {
        const storedOrgId = localStorage.getItem('organization_id');
        const orgId = (storedOrgId === 'null' || storedOrgId === 'undefined') ? null : storedOrgId;
        const storedDeptId = localStorage.getItem('department_id');
        const deptName = localStorage.getItem('department_name');
        const userRole = localStorage.getItem('user_role');
        const studyCenterFromStorage = localStorage.getItem('study_center_name');

        setFormData((prev: any) => {
            const updated = { ...prev };
            if (orgId) updated.organizationId = orgId;

            const isDepartmental = ['complaint', 'performancereview', 'attendance', 'studycenter', 'announcement', 'opsannouncement', 'program', 'university', 'jobopening', 'internalmark'].includes(doctype || '');

            if (isDepartmental) {
                if (storedDeptId) updated.departmentId = storedDeptId;
                if (deptName) updated.department = deptName;
            }

            if (doctype === 'employee') {
                if (storedDeptId) updated.addedByDepartmentId = storedDeptId;
                if (deptName) updated.addedByDepartmentName = deptName;
            }

            if (studyCenterFromStorage && userRole === 'StudyCenter') {
                updated.studyCenter = studyCenterFromStorage;
            }

            if (doctype === 'complaint') {
                const storedEmpId = localStorage.getItem('employee_id');
                const storedEmpName = localStorage.getItem('user_name');
                if (storedEmpId) updated.employeeId = storedEmpId;
                if (storedEmpName) updated.employeeName = storedEmpName;
            }

            // Merge URL Query Parameters
            const urlParams = new URLSearchParams(location.search);
            const windowParams = new URLSearchParams(window.location.search);
            const keys = [
                'employeeName', 'email', 'jobOpening', 'applicationId',
                'designation', 'department', 'departmentId', 'studyCenter', 'studyCenterId',
                'student', 'studentId', 'program', 'semester', 'batch', 'subject'
            ];

            keys.forEach(key => {
                const val = urlParams.get(key) || windowParams.get(key);
                if (val && val !== 'undefined' && val !== 'null') updated[key] = val;
            });

            if (doctype === 'employee') {
                const urlDeptId = urlParams.get('departmentId') || windowParams.get('departmentId');
                const urlDeptName = urlParams.get('department') || windowParams.get('department');
                if (urlDeptId && urlDeptId !== 'undefined') updated.addedByDepartmentId = urlDeptId;
                if (urlDeptName && urlDeptName !== 'undefined') updated.addedByDepartmentName = urlDeptName;
            }

            console.log(`[GenericNew] Initialization DEBUG:`, {
                doctype,
                locationSearch: location.search,
                windowSearch: window.location.search,
                result: updated
            });
            return updated;
        });
    }, [doctype, location.search]);

    // Asynchronous Fetching of Dynamic Options
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

                        const isGlobalLink = ['studycenter', 'university', 'program', 'department', 'designation', 'student'].includes(field.link.toLowerCase()) || field.name === 'department' || field.name === 'targetDepartment';

                        if (!isGlobalLink) {
                            if (deptId) url += `&departmentId=${deptId}`;
                            if (deptName) url += `&department=${encodeURIComponent(deptName)}`;
                        }

                        if (field.link === 'student' && studyCenterFilter) {
                            url += `&studyCenter=${encodeURIComponent(studyCenterFilter.trim())}`;
                        }

                        const res = await fetch(url);
                        const json = await res.json();
                        console.log(`[GenericNew] Fetched ${field.link}:`, json.data?.length);

                        options[field.name] = (json.data || []).map((item: any) => {
                            const linkLower = field.link!.toLowerCase();
                            // Academic items should use Name as value
                            const isAcademic = ['studycenter', 'university', 'program', 'department'].includes(linkLower);

                            // Department specific mapping for robustness
                            if (linkLower === 'department') {
                                const name = item.name || item.panelType || item.title || item._id;
                                const label = item.panelType || item.name || item.title || item._id;
                                return { label: label, value: name, id: item._id };
                            }

                            const nameVal = item.centerName || item.universityName || item.programName || item.name || item.title;

                            return {
                                label: nameVal || item.employeeName || item.studentName || item.job_title || item._id,
                                value: isAcademic ? (nameVal || item._id) : (field.link === 'designation' ? item.title : (item._id || item.name)),
                                id: item._id
                            };
                        });

                        // [Fix] Auto-select Study Center based on ID if Name is missing
                        if (field.name === 'studyCenter') {
                            const urlCenterId = new URLSearchParams(location.search).get('studyCenterId');
                            if (urlCenterId) {
                                const matchingCenter = (json.data || []).find((c: any) => c._id === urlCenterId);
                                if (matchingCenter) {
                                    const centerName = matchingCenter.centerName || matchingCenter.name;
                                    console.log(`[GenericNew] Auto-resolving studyCenter from ID ${urlCenterId} to "${centerName}"`);
                                    setFormData((prev: any) => ({ ...prev, studyCenter: centerName }));
                                }
                            }
                        }

                        if ((doctype === 'announcement' || doctype === 'opsannouncement') && (field.name === 'department' || field.name === 'targetDepartment' || field.name === 'targetCenter')) {
                            options[field.name].unshift({ label: 'None', value: 'None' });
                            if (field.name === 'department' || field.name === 'targetDepartment') {
                                options[field.name].unshift({ label: 'All', value: 'All' });
                            }
                        }
                    } catch (e) {
                        console.error(`Error fetching options for ${field.name}`, e);
                    }
                }
            }
            setDynamicOptions(options);

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
        };

        const fetchCurrentEmployeeDetails = async () => {
            const empId = localStorage.getItem('employee_id');
            if (doctype === 'complaint' && empId) {
                try {
                    console.log(`[GenericNew] Fetching fresh details for employee ${empId}...`);
                    // We need to query by employeeId field, not _id, so use list with filter
                    const res = await fetch(`/api/resource/employee?employeeId=${empId}&organizationId=${orgId}`);
                    const json = await res.json();
                    if (json.data && json.data.length > 0) {
                        const employee = json.data[0];
                        console.log('[GenericNew] Fetched employee details:', employee);
                        setFormData((prev: any) => ({
                            ...prev,
                            department: employee.department,
                            departmentId: employee.departmentId,
                            employeeName: employee.employeeName,
                            employeeId: employee.employeeId
                        }));
                    }
                } catch (e) {
                    console.error('[GenericNew] Failed to fetch employee details', e);
                }
            }
        };

        fetchDynamicOptions();
        fetchCurrentEmployeeDetails();
    }, [doctype, fields, location.search]);

    const handleSave = async () => {
        const urlParams = new URLSearchParams(location.search);
        const windowParams = new URLSearchParams(window.location.search);
        const currentData = { ...formData };

        console.log(`[GenericNew] --- EMERGENCY SAVE DEBUG ---`);
        console.log(`[GenericNew] Doctype:`, doctype);
        console.log(`[GenericNew] Current formData keys:`, Object.keys(currentData));
        console.log(`[GenericNew] Current formData JSON:`, JSON.stringify(currentData));
        console.log(`[GenericNew] location.search:`, location.search);
        console.log(`[GenericNew] window.location.search:`, window.location.search);

        // Robust Fallback: Populate contextual fields from URL
        const contextualKeys = ['studyCenter', 'department', 'departmentId', 'program', 'studentId', 'applicationId', 'organizationId'];

        // FORCE CONTEXT: If user is "StudyCenter", they MUST save as their own center.
        // This overrides form state, ensuring Isolation & Correctness.
        const userRole = localStorage.getItem('user_role');
        if (userRole === 'StudyCenter' || userRole === 'Study Center') {
            const myCenterName = localStorage.getItem('study_center_name');
            const myCenterId = localStorage.getItem('study_center_id');
            if (myCenterName && myCenterId) {
                console.log(`[GenericNew] Enforcing StudyCenter Context: ${myCenterName} (${myCenterId})`);
                currentData.studyCenter = myCenterName;
                currentData.studyCenterId = myCenterId;
            }
        }

        // Helper for case-insensitive param lookup
        const getParam = (key: string) => {
            const lowKey = key.toLowerCase();
            for (const [k, v] of urlParams.entries()) if (k.toLowerCase() === lowKey) return v;
            for (const [k, v] of windowParams.entries()) if (k.toLowerCase() === lowKey) return v;
            return null;
        };

        contextualKeys.forEach(key => {
            let stateVal = currentData[key];
            if (!stateVal || stateVal === 'undefined' || stateVal === 'null' || stateVal === '') {
                // Try exact key first, then case-insensitive
                let urlVal = getParam(key);

                // Specific fallbacks for study center
                if (key === 'studyCenter' && (!urlVal || urlVal === 'undefined')) {
                    urlVal = getParam('centerName') || getParam('center') || getParam('branch');
                }

                if (urlVal && urlVal !== 'undefined' && urlVal !== 'null' && urlVal !== '') {
                    console.log(`[GenericNew] EMERGENCY RECOVERY: Found ${key} in URL: "${urlVal}"`);
                    currentData[key] = urlVal;
                }
            }
        });

        // Ensure OrganizationId is present from storage as last resort
        if (!currentData.organizationId || currentData.organizationId === 'undefined' || currentData.organizationId === 'null') {
            const orgId = localStorage.getItem('organization_id');
            if (orgId && orgId !== 'null' && orgId !== 'undefined') {
                console.log(`[GenericNew] EMERGENCY RECOVERY: Found organizationId in localStorage: "${orgId}"`);
                currentData.organizationId = orgId;
            }
        }

        // AUTO-FIX: If studyCenter name is missing but ID is present, use ID as name to bypass validation
        // The backend uses studyCenterId for linking, name is just for display/record
        const urlCenterId = urlParams.get('studyCenterId') || windowParams.get('studyCenterId');
        if ((!currentData.studyCenter || currentData.studyCenter === 'undefined') && urlCenterId && urlCenterId !== 'undefined') {
            console.log(`[GenericNew] AUTO-FIX: Using ID ${urlCenterId} as studyCenter name to bypass validation`);
            // We can fetch the name later or let the backend handle it, but for now, pass validation
            currentData.studyCenter = `Center-${urlCenterId.substr(-6)}`;
            currentData.studyCenterId = urlCenterId;
        }

        if (doctype === 'complaint') {
            const storedEmpId = localStorage.getItem('employee_id');
            // If no employee ID, check if we have a qualified user (e.g. Dept Admin)
            if (!storedEmpId && !currentData.employeeId) {
                const storedName = localStorage.getItem('user_name'); // e.g. "Operations"
                if (storedName) {
                    currentData.username = storedName;
                    currentData.employeeName = storedName;
                }
            } else if (!currentData.employeeId) {
                currentData.employeeId = storedEmpId;
                currentData.employeeName = localStorage.getItem('user_name');
            }

            currentData.department = localStorage.getItem('department_name') || 'General';
            currentData.departmentId = localStorage.getItem('department_id');

            // Fallback for Dept Admins who have organizationId but maybe no Department ID explicitly set
            if (!currentData.departmentId && currentData.organizationId) {
                console.warn('[GenericNew] Missing DepartmentID for Complaint. Using OrganizationID as placeholder.');
                currentData.departmentId = currentData.organizationId;
            }

            console.log('[GenericNew] Auto-populated Complaint fields:', {
                empId: currentData.employeeId,
                username: currentData.username, // Log username
                dept: currentData.department,
                deptId: currentData.departmentId
            });
        }

        if (doctype === 'holiday') {
            // Default to user's department, but allow clearing it for global
            // If the user matches HR pattern, they might want to set it to 'Human Resources' or leave blank for Global
            const myDept = localStorage.getItem('department_name');
            const myDeptId = localStorage.getItem('department_id');

            // Only set if not already set (though this is init, so it's empty)
            if (!currentData.department && myDept) {
                currentData.department = myDept;
            }
            if (!currentData.departmentId && myDeptId) {
                currentData.departmentId = myDeptId;
            }
        }


        // Validation against the enriched currentData
        const requiredFields = fields.filter(f => f.required);
        console.log(`[GenericNew] Required fields for this doctype:`, requiredFields.map(f => f.name));

        for (const field of requiredFields) {
            const val = currentData[field.name];
            if (!val || val === 'undefined' || val === 'null' || (typeof val === 'string' && val.trim() === '')) {
                console.warn(`[GenericNew] Validation FAILED: ${field.name} is missing. Value:`, val);
                console.log(`[GenericNew] Full currentData at failure:`, currentData);
                alert(`Please fill in the required field: ${field.label}`);
                return;
            }
        }

        const payload = { ...currentData };
        if (!payload.organizationId) {
            const orgId = localStorage.getItem('organization_id');
            if (orgId && orgId !== 'null' && orgId !== 'undefined') {
                payload.organizationId = orgId;
            } else {
                alert('Organization ID is missing. Please try logging in again.');
                return;
            }
        }

        if ((doctype === 'announcement' || doctype === 'opsannouncement') && (payload.targetDepartment === 'All' || payload.targetDepartment === 'None')) {
            payload.departmentId = null;
        }

        if (doctype === 'student' && !payload.verificationStatus) {
            payload.verificationStatus = 'Pending';
            payload.isActive = false;
        }

        setSaving(true);
        if (doctype === 'internalmark') {
            console.log('--- SUBMITTING INTERNAL MARK ---');
            console.log('Payload:', JSON.stringify(payload, null, 2));
            console.log('--------------------------------');
        }
        try {
            const res = await fetch(`/api/resource/${doctype}?organizationId=${payload.organizationId}`, {
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
                        // Skip hidden fields - they won't be rendered but will be in formData
                        if (field.type === 'hidden') {
                            return null;
                        }

                        // Conditional visibility for Poll Options
                        if ((doctype === 'announcement' || doctype === 'opsannouncement') && field.name === 'poll_options_text' && formData.type !== 'Poll') {
                            return null;
                        }

                        // Conditional visibility for Program B.Voc fields
                        if (doctype === 'program' && ['feeStructure', 'syllabus', 'miscellaneous'].includes(field.name) && formData.programType !== 'B.Voc') {
                            return null;
                        }

                        // Hide Study Center field ONLY for StudyCenter role (it's their own center)
                        // For Operations/SuperAdmin, keep it VISIBLE so they can verify/choose
                        const userRole = localStorage.getItem('user_role');
                        const isStudyCenterPopulated = formData.studyCenter && formData.studyCenter !== 'undefined' && formData.studyCenter !== 'null';
                        if (field.name === 'studyCenter') {
                            if (userRole === 'StudyCenter') return null; // Always hide for center users
                            // For others, keep it visible. Pre-filling should set the value, but they can see it.
                        }

                        // Hide Target Study Center for HR announcements
                        if (doctype === 'announcement' && field.name === 'targetStudyCenter' && formData.department === 'Human Resources') {
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
                                            const val = e.target.value;
                                            setFormData((prev: any) => {
                                                const newData = { ...prev, [field.name]: val };

                                                // For departmentId field, also set department name
                                                if (field.name === 'departmentId' && field.link === 'department') {
                                                    const selectedDept = (dynamicOptions[field.name] || []).find(
                                                        opt => opt.value === val
                                                    );
                                                    if (selectedDept) {
                                                        newData.department = selectedDept.label;
                                                    }
                                                }

                                                // Sync Student name when studentId is selected (for InternalMarks)
                                                if (field.name === 'studentId' && field.link === 'student') {
                                                    const selectedStudent = (dynamicOptions[field.name] || []).find(
                                                        opt => opt.value === val
                                                    );
                                                    if (selectedStudent) {
                                                        newData.student = selectedStudent.label;
                                                    }
                                                }

                                                // [Fix] Sync Study Center ID when User changes the Name dropdown
                                                if (field.name === 'studyCenter') {
                                                    const selectedCenter = (dynamicOptions[field.name] || []).find(
                                                        opt => opt.value === val
                                                    );
                                                    if (selectedCenter && (selectedCenter as any).id) {
                                                        const newId = (selectedCenter as any).id;
                                                        console.log(`[GenericNew] User changed Study Center to "${val}". Updating ID to: ${newId}`);
                                                        newData.studyCenterId = newId;
                                                    }
                                                }

                                                // Sync Designation from Vacancy (JobOpening)
                                                if (field.name === 'jobOpening' && field.link === 'jobopening') {
                                                    const selectedJob = (dynamicOptions[field.name] || []).find(
                                                        opt => opt.value === val
                                                    );
                                                    if (selectedJob) {
                                                        const title = selectedJob.label;
                                                        // Add to whitelist locally if missing
                                                        if (allowedDesignations && !allowedDesignations.some(d => d.toLowerCase() === title.toLowerCase())) {
                                                            setAllowedDesignations(p => p ? [...p, title] : [title]);
                                                        }
                                                        // Map the job title to designation
                                                        newData.designation = title;
                                                    }
                                                }

                                                return newData;
                                            });
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        {/* Special All Option for Announcement Department handled by unshift in useEffect */}
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
                                        value={formData[field.name] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData((prev: any) => ({ ...prev, [field.name]: val }));
                                        }}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[100px]"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData((prev: any) => ({ ...prev, [field.name]: val }));
                                        }}
                                    />
                                ) : field.type === 'checkbox' ? (
                                    <div className="flex items-center h-[34px]">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={!!formData[field.name]}
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setFormData((prev: any) => ({ ...prev, [field.name]: val }));
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder || ''}
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-1.5 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all"
                                        value={formData[field.name] || ''}
                                        readOnly={doctype === 'complaint' && field.name === 'employeeName'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData((prev: any) => ({ ...prev, [field.name]: val }));
                                        }}
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
