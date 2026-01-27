
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, LucideIcon } from 'lucide-react';

interface SummaryItem {
    label: string;
    value: string | number;
    color: string;
    doctype: string;
}

interface MasterCard {
    label: string;
    icon: LucideIcon;
    count: string | number;
    href: string;
    color?: string; // e.g., 'bg-blue-50 text-blue-600'
}

interface WorkspaceProps {
    title: string;
    summaryItems: SummaryItem[];
    masterCards: MasterCard[];
    shortcuts: { label: string; href: string }[];
    onboardingSteps?: { title: string; description: string; completed?: boolean }[];
    newHref?: string;
    newLabel?: string;
    onNewClick?: () => void;
    onCustomize?: () => void;
    hideActions?: boolean;
}

export default function Workspace({ title, summaryItems, masterCards, shortcuts, onboardingSteps, newHref, newLabel, onNewClick, onCustomize, hideActions }: WorkspaceProps) {
    return (
        <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#1d2129]">{title}</h2>
                {!hideActions && (
                    <div className="flex gap-2">
                        <button
                            onClick={onCustomize}
                            className="bg-white border border-[#d1d8dd] px-3 py-1.5 rounded text-[13px] font-semibold text-[#1d2129] hover:bg-gray-50 flex items-center gap-2"
                        >
                            Customize
                        </button>
                        {newHref ? (
                            <Link to={newHref} className="bg-blue-600 text-white px-3 py-1.5 rounded text-[13px] font-semibold hover:bg-blue-700 flex items-center gap-2 no-underline shadow-sm">
                                <Plus size={14} />
                                {newLabel || 'Create New'}
                            </Link>
                        ) : onNewClick ? (
                            <button
                                onClick={onNewClick}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-[13px] font-semibold hover:bg-blue-700 flex items-center gap-2 no-underline shadow-sm"
                            >
                                <Plus size={14} />
                                {newLabel || 'Create New'}
                            </button>
                        ) : (
                            <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-[13px] font-semibold hover:bg-blue-700 flex items-center gap-2 no-underline shadow-sm">
                                <Plus size={14} />
                                {newLabel || 'Create New'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryItems.map((item, i) => (
                    <Link key={i} to={`/${item.doctype}`} className="frappe-card p-4 flex flex-col gap-1 bg-white hover:bg-gray-50 transition-colors no-underline group">
                        <span className={`text-[24px] font-black ${item.color}`}>
                            {item.value === '' ? (
                                <span className="text-[13px] uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">View Details</span>
                            ) : item.value}
                        </span>
                        <span className="text-[13px] text-[#626161] font-bold">{item.label}</span>
                    </Link>
                ))}
            </div>

            <div>
                <h3 className="text-[16px] font-bold text-[#1d2129] mb-4">Masters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {masterCards.map((card, i) => (
                        <Link key={i} to={card.href} className="frappe-card p-4 flex items-center justify-between group cursor-pointer hover:bg-gray-50 bg-white no-underline">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded transition-colors ${card.color || 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                    <card.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[14px] font-medium text-[#1d2129]">{card.label}</p>
                                    {card.count !== '' && (
                                        <p className="text-[12px] text-[#8d99a6]">
                                            {card.count} {typeof card.count === 'number' ? 'records' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-[#d1d8dd] group-hover:text-blue-600 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="frappe-card p-6 bg-white">
                    <h3 className="text-[16px] font-bold text-[#1d2129] mb-4">Your Shortcuts</h3>
                    <div className="space-y-4">
                        {shortcuts.map(link => (
                            <Link key={link.label} to={link.href} className="flex items-center justify-between text-[13px] text-[#626161] hover:text-blue-600 cursor-pointer group pb-2 border-b border-gray-100 last:border-0 no-underline">
                                <span>{link.label}</span>
                                <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        ))}
                    </div>
                </div>

                {onboardingSteps && (
                    <div className="frappe-card p-6 bg-white">
                        <h3 className="text-[16px] font-bold text-[#1d2129] mb-4">Onboarding</h3>
                        <div className="space-y-4">
                            {onboardingSteps.map((step, idx) => (
                                <div key={idx} className={`flex gap-4 ${step.completed ? '' : 'opacity-50'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${step.completed ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-medium text-[#1d2129]">{step.title}</p>
                                        <p className="text-[12px] text-[#8d99a6]">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
