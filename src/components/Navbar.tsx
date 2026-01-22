import React, { useEffect, useState } from 'react';
import { Bell, Search, HelpCircle, Plus } from 'lucide-react';

export default function Navbar() {
    const [name, setName] = useState('Administrator');
    const [initials, setInitials] = useState('AD');

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        if (storedName) {
            setName(storedName);
            setInitials(storedName.split(' ').map(n => n[0]).join('').toUpperCase());
        }
    }, []);

    const role = localStorage.getItem('user_role');

    return (
        <header className="h-11 fixed top-0 right-0 left-0 bg-white border-b border-[#d1d8dd] z-[60] flex items-center justify-between px-4">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white">
                        <span className="text-[14px] font-bold">E</span>
                    </div>
                    <span className="font-bold text-[15px] text-[#1d2129]">EduERP</span>
                </div>
            </div>

            <div className="flex-1 max-w-2xl px-8">
                {role !== 'Employee' && role !== 'Student' && (
                    <div className="flex items-center gap-2 bg-[#f0f4f7] px-3 py-1.5 rounded border border-[#d1d8dd] group focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Search size={14} className="text-[#8d99a6]" />
                        <input
                            type="text"
                            placeholder="Search or type a command"
                            className="bg-transparent border-none outline-none text-[13px] w-full text-[#1d2129] placeholder:text-[#8d99a6]"
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {role !== 'Employee' && role !== 'Student' && (
                    <button className="p-1.5 hover:bg-[#f0f4f7] rounded transition-colors text-[#626161]">
                        <Plus size={18} />
                    </button>
                )}
                <button className="p-1.5 hover:bg-[#f0f4f7] rounded transition-colors text-[#626161]">
                    <HelpCircle size={18} />
                </button>
                <button className="relative p-1.5 hover:bg-[#f0f4f7] rounded transition-colors text-[#626161]">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                </button>
                <div className="w-[1px] h-4 bg-[#d1d8dd] mx-1" />
                <div className="flex items-center gap-2 ml-1 cursor-pointer hover:bg-[#f0f4f7] p-1 rounded transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#f0f4f7] border border-[#d1d8dd] flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-[#1b66ff] flex items-center justify-center text-white text-[10px] font-bold uppercase">
                            {initials}
                        </div>
                    </div>
                    <span className="text-[13px] font-medium text-[#1d2129] hidden sm:block">{name}</span>
                </div>
            </div>
        </header>
    );
}
