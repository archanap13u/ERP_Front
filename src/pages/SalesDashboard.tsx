import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    Plus,
    Clock,
    Building2,
    ArrowRight,
    Edit,
    Megaphone,
    BadgeDollarSign,
    Briefcase,
    Target,
    Handshake,
    FileText,
    PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Workspace from '../components/Workspace';
import CustomizationModal from '../components/CustomizationModal';

export default function SalesDashboard() {
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [features, setFeatures] = useState<string[]>([]);
    const [contextData, setContextData] = useState<{ id?: string, name?: string }>({});

    const deptId = localStorage.getItem('department_id');
    const orgId = localStorage.getItem('organization_id');

    useEffect(() => {
        const storedFeatures = localStorage.getItem('user_features');
        if (storedFeatures) {
            try {
                setFeatures(JSON.parse(storedFeatures));
            } catch (e) {
                console.error(e);
            }
        }

        async function fetchData() {
            if (!orgId) return;
            try {
                const resDept = await fetch(`/api/resource/department?organizationId=${orgId}`);
                const jsonDept = await resDept.json();
                const fetchedDepts = jsonDept.data || [];

                let contextDept = fetchedDepts.find((d: any) => d.panelType === 'Sales');
                let effectiveDeptId = deptId || contextDept?._id;
                let effectiveDeptName = localStorage.getItem('department_name') || contextDept?.name;

                setContextData({ id: effectiveDeptId, name: effectiveDeptName });

                const baseUrl = `/api/resource`;
                const params = `?organizationId=${orgId}`;
                const deptParams = `${params}${effectiveDeptId ? `&departmentId=${effectiveDeptId}` : ''}`;

                const fetchPromises = [
                    fetch(`${baseUrl}/lead${params}`).then(r => r.json()),
                    fetch(`${baseUrl}/crm-deal${params}`).then(r => r.json()),
                    fetch(`${baseUrl}/quotation${params}`).then(r => r.json()),
                    fetch(`${baseUrl}/sales-order${params}`).then(r => r.json()),
                    fetch(`${baseUrl}/announcement${params}${effectiveDeptId ? `&departmentId=${effectiveDeptId}` : ''}`).then(r => r.json()),
                    fetch(`${baseUrl}/employee${deptParams}`).then(r => r.json())
                ];

                if (effectiveDeptId) {
                    fetchPromises.push(fetch(`${baseUrl}/department/${effectiveDeptId}?organizationId=${orgId}`).then(r => r.json()));
                }

                const results = await Promise.all(fetchPromises);
                const [jsonLeads, jsonDeals, jsonQuots, jsonOrders, jsonAnn, jsonEmp] = results;
                const jsonFeatures = effectiveDeptId ? results[6] : null;

                setLeads(jsonLeads.data?.slice(0, 5) || []);
                setDeals(jsonDeals.data?.slice(0, 5) || []);
                setAnnouncements(jsonAnn.data?.slice(0, 3) || []);

                setCounts({
                    lead: jsonLeads.data?.length || 0,
                    deal: jsonDeals.data?.length || 0,
                    quotation: jsonQuots.data?.length || 0,
                    order: jsonOrders.data?.length || 0,
                    employee: jsonEmp.data?.length || 0
                });

                if (jsonFeatures?.data?.features) {
                    setFeatures(jsonFeatures.data.features);
                    localStorage.setItem('user_features', JSON.stringify(jsonFeatures.data.features));
                }

            } catch (e) {
                console.error("[Sales Dashboard] Fetch failed:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [orgId, deptId]);

    const handleSaveFeatures = async (newFeatures: string[]) => {
        try {
            const res = await fetch(`/api/resource/department/${deptId}?organizationId=${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: newFeatures })
            });

            if (res.ok) {
                localStorage.setItem('user_features', JSON.stringify(newFeatures));
                setFeatures(newFeatures);
                setIsCustomizing(false);
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <Workspace
                title="Sales & Growth Workspace"
                newHref="/lead/new"
                newLabel="New Lead"
                onCustomize={() => setIsCustomizing(true)}
                summaryItems={[
                    { label: 'Total Leads', value: loading ? '...' : counts.lead || 0, color: 'text-blue-600', doctype: 'lead' },
                    { label: 'Active Deals', value: loading ? '...' : counts.deal || 0, color: 'text-red-600', doctype: 'crm-deal' },
                    { label: 'Quotations', value: loading ? '...' : counts.quotation || 0, color: 'text-emerald-600', doctype: 'quotation' },
                    { label: 'Sales Orders', value: loading ? '...' : counts.order || 0, color: 'text-purple-600', doctype: 'sales-order' },
                ]}
                masterCards={[
                    { label: 'Leads', icon: Target, count: '', href: '/lead', color: 'bg-blue-50 text-blue-600' },
                    { label: 'Deals', icon: Handshake, count: '', href: '/crm-deal', color: 'bg-red-50 text-red-600' },
                    { label: 'Quotations', icon: FileText, count: '', href: '/quotation', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Sales Orders', icon: BadgeDollarSign, count: '', href: '/sales-order', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Customers', icon: Users, count: '', href: '/customer', color: 'bg-indigo-50 text-indigo-600' },
                ]}
                shortcuts={[
                    { label: 'New Lead', href: '/lead/new' },
                    { label: 'Create Quotation', href: '/quotation/new' },
                    { label: 'New Sales Order', href: '/sales-order/new' },
                    { label: 'Sales Analytics', href: '#' },
                    { label: 'My Department Staff', href: `/employee?departmentId=${contextData.id || ''}` },
                ]}
            />

            <CustomizationModal
                isOpen={isCustomizing}
                onClose={() => setIsCustomizing(false)}
                currentFeatures={features}
                onSave={handleSaveFeatures}
                title="Sales Portal Customization"
            />

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Leads Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Target size={20} />
                            </div>
                            Recent Leads
                        </h3>
                        <Link to="/lead" className="text-blue-600 text-[13px] font-medium hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-4 flex-1">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl" />)}
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic">No recent leads found.</div>
                        ) : (
                            leads.map((lead, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-transparent hover:border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                            {lead.leadName?.charAt(0) || 'L'}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#1d2129]">{lead.leadName}</p>
                                            <p className="text-[12px] text-gray-500">{lead.status}</p>
                                        </div>
                                    </div>
                                    <Link to={`/lead/${lead._id}`} className="text-gray-400 hover:text-blue-600">
                                        <Edit size={16} />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Deals Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Handshake size={20} />
                            </div>
                            Active Deals
                        </h3>
                        <Link to="/crm-deal" className="text-blue-600 text-[13px] font-medium hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-4 flex-1">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl" />)}
                            </div>
                        ) : deals.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic">No active deals found.</div>
                        ) : (
                            deals.map((deal, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all rounded-xl border border-transparent hover:border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
                                            {deal.title?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-[#1d2129]">{deal.title}</p>
                                            <p className="text-[12px] text-gray-500">{deal.amount ? `₹${deal.amount}` : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                                        {deal.stage}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Announcements Section */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Megaphone size={20} />
                            </div>
                            Announcements
                        </h3>
                    </div>
                    <div className="space-y-6">
                        {announcements.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 italic text-[14px]">No recent announcements.</div>
                        ) : (
                            announcements.map((ann, idx) => (
                                <div key={idx} className="pl-4 border-l-4 border-orange-400">
                                    <h4 className="text-[15px] font-bold text-[#1d2129]">{ann.title}</h4>
                                    <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                                    <p className="text-[11px] text-gray-400 mt-2 uppercase font-black">{new Date(ann.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Analytics Snapshot */}
                <div className="bg-white p-8 rounded-2xl border border-[#d1d8dd] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[18px] font-bold text-[#1d2129] flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                <PieChart size={20} />
                            </div>
                            Performance Snapshot
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Conversion Rate</p>
                            <p className="text-2xl font-black text-blue-600">12.5%</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Growth (MoM)</p>
                            <p className="text-2xl font-black text-emerald-600">+18%</p>
                        </div>
                        <div className="col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-widest mb-1">Staff Strength</p>
                                <p className="text-xl font-black text-blue-900">{counts.employee} Active</p>
                            </div>
                            <Link to={`/employee?departmentId=${contextData.id || ''}`} className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                                <Users size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

