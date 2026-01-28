import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, Trash2, ArrowLeft, UserPlus, CheckCircle, ExternalLink, Lock, Clock, AlertCircle, Calendar, Flag, User, FileText, PlayCircle, PauseCircle, CheckSquare, XCircle } from 'lucide-react';
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

        const deptId = localStorage.getItem('department_id');
        const userRole = localStorage.getItem('user_role');
        const isGlobalAdmin = ['HR', 'HumanResources', 'SuperAdmin', 'OrganizationAdmin', 'Operations'].includes(userRole || '');

        let fetchUrl = `/api/resource/${doctype}/${id}?organizationId=${orgId || ''}`;
        if (deptId && deptId !== 'undefined' && deptId !== 'null' && !isGlobalAdmin) {
            fetchUrl += `&departmentId=${deptId}`;
        }

        fetch(fetchUrl)
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

        if (doctype === 'task') {
            const userRole = localStorage.getItem('user_role');
            if (userRole === 'Employee') {
                if (payload.status === 'Completed') {
                    payload.status = 'Pending Review';
                    payload.verificationStatus = 'Pending';
                }
                if (payload.status === 'Pending Review' && !payload.completionEvidence) {
                    alert('Please provide Completion Evidence (URL or Description) before submitting for review.');
                    setSaving(false);
                    return;
                }
            } else {
                // Admin/HR/Ops/Finance logic
                if (payload.verificationStatus === 'Approved') {
                    payload.status = 'Completed';
                } else if (payload.verificationStatus === 'Rejected') {
                    payload.status = 'Working';
                }
            }
        }

        try {
            const orgId = payload.organizationId || localStorage.getItem('organization_id');
            const deptId = localStorage.getItem('department_id');
            const userRole = localStorage.getItem('user_role');
            const isGlobalAdmin = ['HR', 'HumanResources', 'SuperAdmin', 'OrganizationAdmin', 'Operations'].includes(userRole || '');

            let saveUrl = `/api/resource/${doctype}/${id}?organizationId=${orgId || ''}`;
            if (deptId && deptId !== 'undefined' && deptId !== 'null' && !isGlobalAdmin) {
                saveUrl += `&departmentId=${deptId}`;
            }

            const res = await fetch(saveUrl, {
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

    // ========== EMPLOYEE TASK DETAIL VIEW ==========
    // Modern, redesigned view for employees viewing their assigned tasks
    const userRole = localStorage.getItem('user_role');
    const currentEmployeeId = localStorage.getItem('employee_id');
    const isAssignedToMe = formData.assignedTo === currentEmployeeId;

    // Debug logging
    console.log('[Task View] userRole:', userRole, 'doctype:', doctype, 'employeeId:', currentEmployeeId, 'assignedTo:', formData.assignedTo, 'isAssignedToMe:', isAssignedToMe);

    // Show modern employee view for employees viewing tasks (assigned to them or not)
    if (doctype === 'task' && userRole === 'Employee') {
        // Calculate deadline info
        const deadline = formData.exp_end_date ? new Date(formData.exp_end_date) : null;
        const today = new Date();
        const daysRemaining = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const isOverdue = daysRemaining !== null && daysRemaining < 0;

        // Status configuration
        const statusConfig: any = {
            'Open': { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, gradient: 'from-gray-400 to-gray-500' },
            'Working': { color: 'bg-blue-100 text-blue-700', icon: PlayCircle, gradient: 'from-blue-500 to-indigo-600' },
            'Pending Review': { color: 'bg-amber-100 text-amber-700', icon: Clock, gradient: 'from-amber-500 to-orange-600' },
            'Completed': { color: 'bg-green-100 text-green-700', icon: CheckCircle, gradient: 'from-green-500 to-emerald-600' },
            'Cancelled': { color: 'bg-red-100 text-red-700', icon: XCircle, gradient: 'from-red-500 to-pink-600' },
            'Overdue': { color: 'bg-red-100 text-red-700', icon: AlertCircle, gradient: 'from-red-600 to-rose-700' }
        };

        const currentStatus = formData.status || 'Open';
        const StatusIcon = statusConfig[currentStatus]?.icon || AlertCircle;

        // Priority colors
        const priorityColors: any = {
            'Low': 'text-gray-500',
            'Medium': 'text-blue-500',
            'High': 'text-orange-500',
            'Urgent': 'text-red-500'
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20">
                <div className="max-w-6xl mx-auto p-6 space-y-6">
                    {/* Hero Section - Task Header */}
                    <div className={`bg-gradient-to-br ${statusConfig[currentStatus]?.gradient || 'from-blue-600 to-indigo-700'} rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <p className="text-white/80 text-xs uppercase font-bold tracking-wider mb-1">Your Task</p>
                                        <h1 className="text-3xl font-bold">{formData.subject || 'Task Details'}</h1>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <StatusIcon size={18} />
                                    <span className="font-bold text-sm">{currentStatus}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-white/70 text-xs font-semibold mb-2">
                                        <User size={14} />
                                        Assigned By
                                    </div>
                                    <p className="font-bold text-lg">{formData.assignedByName || 'Admin'}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-white/70 text-xs font-semibold mb-2">
                                        <Calendar size={14} />
                                        Deadline
                                    </div>
                                    <p className="font-bold text-lg">
                                        {deadline ? deadline.toLocaleDateString() : 'No deadline'}
                                    </p>
                                    {daysRemaining !== null && !isOverdue && (
                                        <p className="text-xs text-white/80 mt-1">{daysRemaining} days remaining</p>
                                    )}
                                    {isOverdue && (
                                        <p className="text-xs text-red-200 font-bold mt-1">⚠️ Overdue by {Math.abs(daysRemaining!)} days</p>
                                    )}
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-white/70 text-xs font-semibold mb-2">
                                        <Flag size={14} />
                                        Priority
                                    </div>
                                    <p className="font-bold text-lg">{formData.priority || 'Medium'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Management Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <CheckSquare className="text-blue-600" size={24} />
                            Update Task Status
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {['Open', 'Working', 'Completed'].map((status) => {
                                const isActive = formData.status === status || (status === 'Completed' && formData.status === 'Pending Review');
                                const StatusBtnIcon = statusConfig[status]?.icon || PlayCircle;

                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFormData({ ...formData, status: status })}
                                        className={`p-4 rounded-xl border-2 transition-all ${isActive
                                            ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                <StatusBtnIcon size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {status === 'Completed' ? 'Submit for Review' : status}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {status === 'Open' && 'Not started yet'}
                                                    {status === 'Working' && 'In progress'}
                                                    {status === 'Completed' && 'Mark as done'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {formData.status === 'Pending Review' && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-center gap-2 text-amber-800">
                                    <Clock size={18} />
                                    <p className="font-semibold">Awaiting Admin Review</p>
                                </div>
                                <p className="text-sm text-amber-700 mt-2">
                                    Your task has been submitted for verification. You'll be notified once it's reviewed.
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                            <select
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-400 outline-none transition-all"
                                value={formData.priority || 'Medium'}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                                    <option key={priority} value={priority}>{priority}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                            <Save size={20} />
                            {saving ? 'Saving Changes...' : 'Save Task Update'}
                        </button>
                    </div>

                    {/* Task Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Description Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText className="text-indigo-600" size={20} />
                                Task Description
                            </h3>
                            <textarea
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[150px] resize-none"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add notes about your progress..."
                            />
                        </div>

                        {/* Task Info Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Task Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-semibold">Task Subject</span>
                                    <span className="text-sm font-bold text-gray-800">{formData.subject}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-semibold">Assigned By</span>
                                    <span className="text-sm font-bold text-gray-800">{formData.assignedByName || 'Admin'}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-semibold">Expected End Date</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {deadline ? deadline.toLocaleDateString() : 'Not set'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm text-gray-600 font-semibold">Current Status</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[currentStatus]?.color}`}>
                                        {currentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Evidence & Admin Feedback */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={24} />
                            Completion Evidence
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Provide proof or description of your completed work. This will be reviewed by the admin.
                        </p>
                        <textarea
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[120px] resize-none mb-6"
                            value={formData.completionEvidence || ''}
                            onChange={(e) => setFormData({ ...formData, completionEvidence: e.target.value })}
                            placeholder="Enter completion evidence: URLs, file references, or description of completed work..."
                        />

                        {formData.adminRemarks && (
                            <div className={`mt-6 p-4 rounded-xl border ${formData.verificationStatus === 'Request Changes' ? 'bg-amber-50 border-amber-200' :
                                formData.verificationStatus === 'Rejected' ? 'bg-red-50 border-red-200' :
                                    'bg-blue-50 border-blue-200'
                                }`}>
                                <h4 className={`text-sm font-bold mb-2 ${formData.verificationStatus === 'Request Changes' ? 'text-amber-800' :
                                    formData.verificationStatus === 'Rejected' ? 'text-red-800' :
                                        'text-blue-800'
                                    }`}>
                                    {formData.verificationStatus === 'Request Changes' ? '⚠️ Required Changes / Instructions' :
                                        formData.verificationStatus === 'Rejected' ? '❌ Reason for Rejection' :
                                            'ℹ️ Admin Feedback'}
                                </h4>
                                <p className={`text-sm whitespace-pre-wrap ${formData.verificationStatus === 'Request Changes' ? 'text-amber-900' :
                                    formData.verificationStatus === 'Rejected' ? 'text-red-900' :
                                        'text-blue-900'
                                    }`}>{formData.adminRemarks}</p>
                            </div>
                        )}

                        {formData.verificationStatus && formData.verificationStatus !== 'Pending' && (
                            <div className={`mt-4 p-4 rounded-xl ${formData.verificationStatus === 'Approved'
                                ? 'bg-green-50 border border-green-200'
                                : formData.verificationStatus === 'Request Changes'
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {formData.verificationStatus === 'Approved' ? (
                                        <CheckCircle className="text-green-600" size={18} />
                                    ) : formData.verificationStatus === 'Request Changes' ? (
                                        <AlertCircle className="text-amber-600" size={18} />
                                    ) : (
                                        <XCircle className="text-red-600" size={18} />
                                    )}
                                    <span className={`font-bold text-sm ${formData.verificationStatus === 'Approved'
                                        ? 'text-green-700'
                                        : formData.verificationStatus === 'Request Changes'
                                            ? 'text-amber-700'
                                            : 'text-red-700'
                                        }`}>
                                        {formData.verificationStatus === 'Request Changes'
                                            ? 'Changes Requested - Please Revise'
                                            : `Task ${formData.verificationStatus}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    // ========== END EMPLOYEE TASK DETAIL VIEW ==========

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



            {/* LEAVE REQUEST APPROVAL WORKFLOW UI */}
            {
                doctype === 'leaverequest' && (
                    <div className="mb-8 p-6 bg-white border border-[#d1d8dd] rounded-lg shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckSquare className="text-blue-600" size={20} />
                            Leave Approval Status
                        </h3>

                        {/* Status Banner */}
                        <div className={`p-4 rounded-xl border mb-6 flex items-center gap-3 ${formData.status === 'Approved' ? 'bg-green-50 border-green-200 text-green-800' :
                            formData.status === 'Rejected' ? 'bg-red-50 border-red-200 text-red-800' :
                                'bg-blue-50 border-blue-200 text-blue-800'
                            }`}>
                            {formData.status === 'Approved' ? <CheckCircle size={20} /> :
                                formData.status === 'Rejected' ? <XCircle size={20} /> :
                                    <Clock size={20} />}
                            <div>
                                <p className="font-bold text-sm uppercase tracking-wide">Current Status</p>
                                <p className="text-lg font-bold">{formData.status}</p>
                            </div>
                        </div>

                        {/* Workflow Actions */}
                        {(() => {
                            const userRole = localStorage.getItem('user_role');
                            const isDeptAdmin = ['DepartmentAdmin', 'HeadOfDepartment', 'OrganizationAdmin', 'Operations', 'HR', 'HumanResources', 'SuperAdmin', 'Finance', 'Inventory', 'CRM', 'Support', 'Assets'].includes(userRole || '');
                            const isHR = ['HR', 'HumanResources', 'SuperAdmin'].includes(userRole || '') || (userRole === 'DepartmentAdmin' && localStorage.getItem('department_name') === 'Human Resources');

                            const currentEmployeeId = localStorage.getItem('employee_id');
                            const isMyRequest = formData.employeeId === currentEmployeeId;

                            // Helper to immediately save status changes
                            const updateStatus = async (newStatus: string, remarksKey?: string, remarksValue?: string) => {
                                setLoading(true); // Re-use loading state or add a specific one
                                try {
                                    const orgId = formData.organizationId || localStorage.getItem('organization_id');
                                    const deptId = localStorage.getItem('department_id');
                                    const userRole = localStorage.getItem('user_role');
                                    const isGlobalAdmin = ['HR', 'HumanResources', 'SuperAdmin', 'OrganizationAdmin', 'Operations'].includes(userRole || '');

                                    let statusUrl = `/api/resource/${doctype}/${id}?organizationId=${orgId || ''}`;
                                    if (deptId && deptId !== 'undefined' && deptId !== 'null' && !isGlobalAdmin) {
                                        statusUrl += `&departmentId=${deptId}`;
                                    }
                                    const payload = {
                                        ...formData,
                                        status: newStatus,
                                        [remarksKey || 'remarks']: remarksValue // Dynamic remarks update
                                    };

                                    const res = await fetch(statusUrl, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload), // Send the updated payload directly
                                    });

                                    if (res.ok) {
                                        // Update local state to reflect change immediately
                                        setFormData(payload);
                                        // Optionally navigate back or show success
                                        alert('Status updated successfully!');
                                        navigate(-1); // Go back to dashboard which mimics "Disappearing" from pending list
                                    } else {
                                        const err = await res.json();
                                        alert(`Error updating status: ${err.error}`);
                                    }
                                } catch (e) {
                                    alert('Failed to update status');
                                    console.error(e);
                                } finally {
                                    setLoading(false);
                                }
                            };

                            // PREVENTION: Cannot approve own request
                            if (isMyRequest && (formData.status === 'Pending Department' || formData.status === 'Pending HR')) {
                                return (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm italic">
                                        Your request is currently {formData.status}. Waiting for independent approval.
                                    </div>
                                );
                            }

                            // DEPT ADMIN ACTIONS
                            if (isDeptAdmin && formData.status === 'Pending Department') {
                                return (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <h4 className="font-bold text-gray-700 text-sm uppercase">Department Admin Actions</h4>
                                        <p className="text-xs text-gray-500">Review the request and approve to move it to HR, or reject it.</p>

                                        <textarea
                                            className="w-full p-3 border rounded text-sm mb-2"
                                            placeholder="Add remarks (optional)..."
                                            value={formData.deptAdminRemarks || ''}
                                            onChange={e => setFormData({ ...formData, deptAdminRemarks: e.target.value })}
                                        />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => updateStatus('Pending HR', 'deptAdminRemarks', formData.deptAdminRemarks)}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 shadow-sm"
                                            >
                                                Approve to HR
                                            </button>
                                            <button
                                                onClick={() => updateStatus('Rejected', 'deptAdminRemarks', formData.deptAdminRemarks)}
                                                className="flex-1 bg-red-100 text-red-700 py-2 rounded font-bold text-sm hover:bg-red-200 shadow-sm"
                                            >
                                                Reject Request
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // HR ACTIONS
                            if (isHR && formData.status === 'Pending HR') {
                                return (
                                    <div className="space-y-4 bg-purple-50 p-4 rounded-xl border border-purple-200">
                                        <h4 className="font-bold text-purple-800 text-sm uppercase">HR Actions</h4>
                                        <p className="text-xs text-purple-600">Final review. Approve to grant leave or reject.</p>

                                        <textarea
                                            className="w-full p-3 border rounded text-sm mb-2"
                                            placeholder="Add HR remarks..."
                                            value={formData.hrRemarks || ''}
                                            onChange={e => setFormData({ ...formData, hrRemarks: e.target.value })}
                                        />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => updateStatus('Approved', 'hrRemarks', formData.hrRemarks)}
                                                className="flex-1 bg-green-600 text-white py-2 rounded font-bold text-sm hover:bg-green-700 shadow-sm"
                                            >
                                                Final Approve
                                            </button>
                                            <button
                                                onClick={() => updateStatus('Rejected', 'hrRemarks', formData.hrRemarks)}
                                                className="flex-1 bg-red-100 text-red-700 py-2 rounded font-bold text-sm hover:bg-red-200 shadow-sm"
                                            >
                                                Reject Final
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return null; // No actions for others or other states
                        })()}
                    </div>
                )
            }

            {/* Standard Form Fields (Read-Only Logic Applied Below) */}
            <div className="p-8 bg-white border border-[#d1d8dd] rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {fields.map((field, idx) => {
                        const userRole = localStorage.getItem('user_role');

                        // [Fix] Enforce Isolation: Hide Study Center field for StudyCenter users
                        if (field.name === 'studyCenter' && userRole === 'StudyCenter') {
                            return null;
                        }

                        // Conditional visibility for Program fields: hide B.Voc-only fields for Skill programs
                        if (doctype === 'leaverequest') {
                            const isAdmin = ['DepartmentAdmin', 'HR', 'Operations', 'Finance', 'SuperAdmin', 'OrganizationAdmin', 'HumanResources', 'HeadOfDepartment'].includes(userRole || '');
                            const isEmployee = userRole === 'Employee';
                            const currentEmployeeId = localStorage.getItem('employee_id');
                            const isMyRequest = formData.employeeId === currentEmployeeId;

                            if (isAdmin) {
                                // Admins should not edit core leave details, only use the approval workflow
                                field.readOnly = true;
                            } else if (isEmployee) {
                                // Employees can only edit their own requests and only if still pending dept approval
                                if (!isMyRequest || formData.status !== 'Pending Department') {
                                    field.readOnly = true;
                                }
                            }
                        }

                        // Specific logic for Tasks completion workflow
                        if (doctype === 'task') {
                            const isAdmin = ['DepartmentAdmin', 'HR', 'Operations', 'Finance', 'SuperAdmin', 'OrganizationAdmin'].includes(userRole || '');
                            const isEmployee = userRole === 'Employee';

                            // Get the currently logged-in employee ID
                            const currentEmployeeId = localStorage.getItem('employee_id');
                            const isAssignedToMe = formData.assignedTo === currentEmployeeId;

                            if (isEmployee) {
                                // Employees can only edit tasks assigned to them
                                if (!isAssignedToMe) {
                                    // If not assigned to this employee, make all fields read-only
                                    field.readOnly = true;
                                } else {
                                    // Employee editing their own task
                                    // Read-only fields for employees: admin controls and assignment details
                                    if (['verificationStatus', 'adminRemarks', 'assignedTo', 'assignedBy', 'subject', 'exp_end_date', 'assignedToName', 'assignedByName'].includes(field.name)) {
                                        field.readOnly = true;
                                    }
                                    // Editable fields: status, description, completionEvidence, priority
                                }
                            }

                            if (isAdmin && ['completionEvidence'].includes(field.name)) {
                                // Admins can see and edit completion evidence if needed
                            }
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
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const newData = { ...formData, [field.name]: val };

                                            // Sync Assigned To name for Tasks
                                            if (doctype === 'task' && field.name === 'assignedTo' && field.link === 'employee') {
                                                const selectedEmp = (dynamicOptions[field.name] || []).find(
                                                    (opt: any) => opt.value === val
                                                );
                                                if (selectedEmp) {
                                                    newData.assignedToName = selectedEmp.label;
                                                }
                                            }
                                            setFormData(newData);
                                        }}
                                        disabled={(doctype === 'complaint' && localStorage.getItem('user_role') === 'HR') || (field as any).readOnly}
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
                                        readOnly={(doctype === 'complaint' && localStorage.getItem('user_role') === 'HR') || (field as any).readOnly}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-2 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[100px] read-only:opacity-70"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        placeholder={field.placeholder || ''}
                                        readOnly={(doctype === 'complaint' && localStorage.getItem('user_role') === 'HR') || (field as any).readOnly}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder || ''}
                                        className="w-full bg-[#f0f4f7] border border-[#d1d8dd] rounded px-3 py-2 text-[13px] focus:bg-white focus:border-blue-400 outline-none transition-all read-only:opacity-70"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        readOnly={(doctype === 'complaint' && localStorage.getItem('user_role') === 'HR') || (field as any).readOnly}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Admin Evidence Review Section for Tasks */}
            {
                doctype === 'task' && ['DepartmentAdmin', 'HR', 'Operations', 'Finance', 'SuperAdmin', 'OrganizationAdmin'].includes(localStorage.getItem('user_role') || '') && formData.completionEvidence && (
                    <div className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-600 rounded-xl">
                                <CheckCircle className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Employee Completion Evidence</h3>
                                <p className="text-sm text-gray-600">Submitted by {formData.assignedToName || 'Employee'}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 mb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Evidence / Proof of Work</label>
                            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-sm text-gray-800 min-h-[100px] whitespace-pre-wrap">
                                {formData.completionEvidence || 'No evidence provided yet'}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Verification Status</label>
                            <select
                                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:bg-white focus:border-blue-400 outline-none transition-all"
                                value={formData.verificationStatus || 'Pending'}
                                onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                            >
                                <option value="Pending">⏳ Pending Review</option>
                                <option value="Approved">✅ Approved</option>
                                <option value="Rejected">❌ Rejected</option>
                                <option value="Request Changes">🔄 Request Changes</option>
                            </select>

                            {formData.verificationStatus === 'Approved' && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                                    <CheckCircle size={16} />
                                    <span className="text-xs font-semibold">Task will be marked as Completed</span>
                                </div>
                            )}
                            {formData.verificationStatus === 'Rejected' && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                    <XCircle size={16} />
                                    <span className="text-xs font-semibold">Task will be returned to Working status</span>
                                </div>
                            )}
                            {formData.verificationStatus === 'Request Changes' && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
                                    <AlertCircle size={16} />
                                    <span className="text-xs font-semibold">Employee will be asked to revise and resubmit</span>
                                </div>
                            )}
                        </div>

                        {formData.verificationStatus && formData.verificationStatus !== 'Pending' && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <label className="text-sm font-bold text-gray-700 mb-3 block">
                                    {formData.verificationStatus === 'Request Changes' ? 'Required Changes / Instructions' :
                                        formData.verificationStatus === 'Rejected' ? 'Reason for Rejection' :
                                            'Admin Remarks (Optional)'}
                                </label>
                                <textarea
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:bg-white focus:border-blue-400 outline-none transition-all min-h-[100px] resize-none"
                                    value={formData.adminRemarks || ''}
                                    onChange={(e) => setFormData({ ...formData, adminRemarks: e.target.value })}
                                    placeholder={
                                        formData.verificationStatus === 'Request Changes' ? "Please list the specific changes required..." :
                                            formData.verificationStatus === 'Rejected' ? "Explain why this task was rejected..." :
                                                "Add any optional feedback..."
                                    }
                                />
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-between p-4 bg-blue-100 rounded-xl">
                            <div className="flex items-center gap-2 text-blue-800">
                                <AlertCircle size={18} />
                                <span className="text-sm font-semibold">Remember to save your verification and remarks</span>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save Verification'}
                            </button>
                        </div>
                    </div>
                )
            }

            {
                doctype === 'studycenter' && (
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
                )
            }

            {
                (doctype === 'jobopening' || doctype === 'job-opening') && (
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
                )
            }
        </div >
    );
}
