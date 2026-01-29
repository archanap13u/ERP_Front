import React, { useState, useEffect } from 'react';
import { X, Check, Layout, Shield, Settings, Info, Building2, Key, Save, AlertCircle, Briefcase, Plus } from 'lucide-react';

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
    title?: string;
    error?: string;
}

const ALL_FEATURES = [
    'Add Employee', 'Employee List', 'Post Vacancy', 'Job Application', 'Employee Transfer',
    'Attendance', 'Recruitment', 'Payroll', 'Employee Lifecycle', 'Shift Management', 'Holidays', 'Announcements',
    'Invoices', 'Payments', 'Expenses', 'General Ledger', 'Taxation', 'Quotations', 'Sales Orders',
    'University', 'Study Center', 'STUDENTS', 'APPLICATIONS', 'Programs', 'Internal Marks',
    'Stock Entry', 'Delivery Note', 'Item Management', 'Purchase Receipt', 'Warehouses', 'Suppliers',
    'Leads', 'Deals', 'Customers', 'Touchpoints',
    'Projects', 'Tasks', 'Timesheets', 'Agile Board',
    'Tickets', 'Issues', 'Warranty Claims', 'Knowledge Base',
    'Asset Tracking', 'Maintenance', 'Depreciation', 'Staff Portal'
];

const MODULES = [
    {
        id: 'HR',
        name: 'HR & Payroll',
        features: [
            'Add Employee', 'Employee List', 'Post Vacancy', 'Job Application', 'Employee Transfer',
            'Attendance', 'Recruitment', 'Payroll', 'Employee Lifecycle', 'Shift Management', 'Holidays', 'Announcements',
            'Employee Complaints', 'Performance', 'Tasks'
        ],
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-100'
    },
    {
        id: 'Finance',
        name: 'Finance & Accounts',
        features: ['Invoices', 'Payments', 'Expenses', 'General Ledger', 'Taxation', 'Announcements', 'Employee List', 'STUDENTS', 'Tasks'],
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
    },
    {
        id: 'Operations',
        name: 'Education Ops',
        features: ['University', 'Study Center', 'APPLICATIONS', 'Programs', 'Internal Marks', 'Employee List', 'Announcements', 'Tasks'],
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-100'
    },
    {
        id: 'Inventory',
        name: 'Inventory & Stock',
        features: ['Stock Entry', 'Delivery Note', 'Item Management', 'Purchase Receipt', 'Warehouses', 'Suppliers', 'Announcements', 'Employee List', 'Tasks'],
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100'
    },
    {
        id: 'CRM',
        name: 'CRM & Sales',
        features: ['Leads', 'Deals', 'Customers', 'Touchpoints', 'Quotations', 'Sales Orders', 'Announcements', 'Employee List', 'Tasks'],
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100'
    },
    {
        id: 'Projects',
        name: 'Projects',
        features: ['Projects', 'Tasks', 'Timesheets', 'Agile Board', 'Announcements', 'Employee List'],
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-100'
    },
    {
        id: 'Support',
        name: 'Helpdesk',
        features: ['Tickets', 'Issues', 'Warranty Claims', 'Knowledge Base', 'Announcements', 'Employee List', 'Tasks'],
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        border: 'border-cyan-100'
    },
    {
        id: 'Assets',
        name: 'Asset Mgmt',
        features: ['Asset Tracking', 'Maintenance', 'Depreciation', 'Announcements', 'Employee List', 'Tasks'],
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-100'
    },
    {
        id: 'Sales',
        name: 'SALES WORKSPACE',
        features: ['Employee List', 'Study Center'],
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-100'
    }
];

export default function DepartmentModal({ isOpen, onClose, onSave, initialData, title, error }: DepartmentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        username: '',
        password: '',
        panelType: 'Generic',
        features: [] as string[],
        designations: [] as string[]
    });

    const [allDesignations, setAllDesignations] = useState<any[]>([]);
    const [newDesigInput, setNewDesigInput] = useState('');
    const [addingDesig, setAddingDesig] = useState(false);

    const fetchDesignations = () => {
        const orgId = localStorage.getItem('organization_id');
        if (orgId) {
            fetch(`/api/resource/designation?organizationId=${orgId}`)
                .then(res => res.json())
                .then(json => setAllDesignations(json.data || []))
                .catch(err => console.error('Error fetching designations:', err));
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    code: initialData.code || '',
                    username: initialData.username || '',
                    password: initialData.password || '',
                    panelType: initialData.panelType || 'Generic',
                    features: initialData.features || [],
                    designations: initialData.designations || []
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    username: '',
                    password: '',
                    panelType: 'Generic',
                    features: [],
                    designations: []
                });
            }

            // Fetch all designations for the organization
            fetchDesignations();
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const toggleFeature = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    const toggleModule = (module: typeof MODULES[0]) => {
        const isAllActive = module.features.every(f => formData.features.includes(f));
        let newFeats = [...formData.features];

        if (isAllActive) {
            newFeats = newFeats.filter(f => !module.features.includes(f));
        } else {
            newFeats = [...new Set([...newFeats, ...module.features])];
        }

        setFormData(prev => ({
            ...prev,
            features: newFeats,
            panelType: isAllActive ? 'Generic' : module.id
        }));
    };

    const toggleDesignation = (title: string) => {
        setFormData(prev => ({
            ...prev,
            designations: prev.designations.includes(title)
                ? prev.designations.filter(d => d !== title)
                : [...prev.designations, title]
        }));
    };

    const handleQuickAdd = async () => {
        if (!newDesigInput.trim()) return;
        const orgId = localStorage.getItem('organization_id');
        if (!orgId) return;

        setAddingDesig(true);
        const titles = newDesigInput.split(',').map(t => t.trim()).filter(t => t);

        try {
            for (const title of titles) {
                // Check if already exists in allDesignations
                const exists = allDesignations.find(d => d.title.toLowerCase() === title.toLowerCase());
                if (!exists) {
                    await fetch('/api/resource/designation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title,
                            level: 1,
                            organizationId: orgId,
                            departmentName: formData.name
                        })
                    });
                }

                // Add to selected designations if not already there
                setFormData(prev => ({
                    ...prev,
                    designations: prev.designations.includes(title) ? prev.designations : [...prev.designations, title]
                }));
            }

            setNewDesigInput('');
            fetchDesignations();
        } catch (e) {
            console.error(e);
        } finally {
            setAddingDesig(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-[24px] font-black text-[#1d2129] tracking-tight">{title || (initialData ? 'Edit Department Portal' : 'New Department Portal')}</h2>
                            <p className="text-[13px] text-gray-500 font-medium">Configure workspace identities and functional scope</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mx-10 mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} />
                        <p className="text-[13px] font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        <div className="space-y-6">
                            <h3 className="text-[14px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Settings size={16} /> Identity & Code
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-tight mb-2 ml-1">Department Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="e.g. Finance & Operations"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-tight mb-2 ml-1">Internal Code</label>
                                    <input
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="e.g. FIN-OPS"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[14px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Key size={16} /> Admin Credentials
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-tight mb-2 ml-1">Portal Username</label>
                                    <input
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="Login username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-tight mb-2 ml-1">Portal Password</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-[15px] font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="Login password"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module Presets */}
                    <div className="space-y-6">
                        <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                            <Layout size={16} /> Functional Scopes (Presets)
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {MODULES.map(module => {
                                const isActive = module.features.every(f => formData.features.includes(f));
                                return (
                                    <button
                                        key={module.id}
                                        type="button"
                                        onClick={() => toggleModule(module)}
                                        className={`p-5 rounded-[2rem] border-2 transition-all text-left group ${isActive
                                            ? `${module.bg} ${module.border} border-blue-500 shadow-xl shadow-blue-50`
                                            : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[13px] font-black tracking-tighter ${isActive ? module.color : 'text-gray-900 group-hover:text-blue-600'}`}>
                                                {module.name}
                                            </span>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200'
                                                }`}>
                                                {isActive && <Check size={12} strokeWidth={4} />}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold leading-tight">
                                            {module.features.length} Features included in this scope
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feature Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between ml-1">
                            <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={16} /> Component Granularity
                            </h3>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, features: ALL_FEATURES })}
                                    className="text-[11px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, features: [] })}
                                    className="text-[11px] font-black text-gray-400 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-all"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {ALL_FEATURES.filter(feat => {
                                if (formData.panelType === 'Sales') return feat === 'Employee List' || feat === 'Study Center';
                                return true;
                            }).map(feat => {
                                const isActive = formData.features.includes(feat);
                                return (
                                    <button
                                        key={feat}
                                        type="button"
                                        onClick={() => toggleFeature(feat)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                            : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
                                            }`}
                                    >
                                        <span className={`text-[11px] font-black tracking-tight ${isActive ? 'text-white' : 'text-[#1d2129]'}`}>{feat}</span>
                                        {isActive && <Check size={14} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Designation Mapping */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between ml-1">
                            <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase size={16} /> Departmental Designations
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                    <input
                                        type="text"
                                        placeholder="Add new (comma separated)..."
                                        value={newDesigInput}
                                        onChange={e => setNewDesigInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickAdd())}
                                        className="bg-transparent border-none outline-none text-[12px] font-bold px-3 w-48 placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleQuickAdd}
                                        disabled={addingDesig}
                                        className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="h-8 w-[1px] bg-gray-100 mx-2" />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, designations: allDesignations.map(d => d.title) })}
                                    className="text-[11px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, designations: [] })}
                                    className="text-[11px] font-black text-gray-400 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-all"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {allDesignations.length === 0 ? (
                            <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center italic text-gray-400 text-[13px]">
                                No designations found for your organization. Please add some first.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {allDesignations.map(desig => {
                                    const isActive = formData.designations.includes(desig.title);
                                    return (
                                        <button
                                            key={desig._id}
                                            type="button"
                                            onClick={() => toggleDesignation(desig.title)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                                                }`}
                                        >
                                            <span className={`text-[11px] font-black tracking-tight ${isActive ? 'text-white' : 'text-[#1d2129]'}`}>{desig.title}</span>
                                            {isActive && <Check size={14} strokeWidth={3} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-[11px] text-gray-400 italic ml-1">
                            Only selected designations will be available when adding staff in this department's panel.
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-10 py-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                        <Info size={18} />
                        <span className="text-[12px] font-bold">Portal changes sync instantly to associated users</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            type="button"
                            className="px-8 py-4 rounded-[1.5rem] text-[15px] font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            type="button"
                            className="bg-blue-600 text-white px-10 py-4 rounded-[1.5rem] text-[15px] font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center gap-2"
                        >
                            <Save size={20} />
                            {initialData ? 'Update Workspace' : 'Launch Workspace'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
