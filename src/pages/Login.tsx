import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, GraduationCap, Shield } from 'lucide-react';

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const deptId = searchParams.get('deptId');
    const [deptName, setDeptName] = useState('');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (deptId) {
            // Optional: Fetch department name details
            // For now we might just show "Department Login"
            fetch(`/api/resource/department/${deptId}?organizationId=${localStorage.getItem('organization_id') || ''}`)
                .then(res => res.json())
                .then(data => {
                    if (data.data) setDeptName(data.data.name);
                })
                .catch(() => { });
        }
    }, [deptId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Clear any stale administrative state before attempting new login
        localStorage.removeItem('department_panel_type');
        localStorage.removeItem('user_features');
        localStorage.removeItem('department_name');
        localStorage.removeItem('department_id');
        localStorage.removeItem('user_name');
        localStorage.removeItem('employee_id');
        localStorage.removeItem('user_id');

        try {
            // First, try super admin authentication
            const superAdminRes = await fetch('/api/auth/superadmin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const superAdminData = await superAdminRes.json();

            if (superAdminData.success) {
                localStorage.setItem('user_role', 'SuperAdmin');
                localStorage.setItem('user_name', superAdminData.user.fullName);
                localStorage.setItem('user_id', superAdminData.user.id);
                localStorage.setItem('user_email', superAdminData.user.email);
                navigate('/superadmin/dashboard');
                return;
            }

            // If super admin login failed, try regular user authentication
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            console.log('[Login] 📥 Response data:', data);

            if (data.success) {
                console.log('[Login] ✓ Success! Role:', data.user.role);
                localStorage.setItem('user_role', data.user.role);
                localStorage.setItem('user_name', data.user.name);
                localStorage.setItem('user_id', data.user.id || data.user._id);

                // CRITICAL: Store employee_id for Employee role
                if (data.user.employeeId) {
                    console.log('[Login] 💾 Storing employee_id:', data.user.employeeId);
                    localStorage.setItem('employee_id', data.user.employeeId);
                } else {
                    console.warn('[Login] ⚠️  No employeeId in response for role:', data.user.role);
                }

                if (data.user.organizationId) localStorage.setItem('organization_id', data.user.organizationId);
                if (data.user.departmentId) localStorage.setItem('department_id', data.user.departmentId);
                if (data.user.panelType) localStorage.setItem('department_panel_type', data.user.panelType);
                else localStorage.removeItem('department_panel_type'); // Clear if not provided (e.g. Employee)

                if (data.user.role === 'StudyCenter') {
                    localStorage.setItem('study_center_id', data.user.id || data.user._id);
                }
                if (data.user.study_center_name) localStorage.setItem('study_center_name', data.user.study_center_name);
                if (data.user.studyCenter) localStorage.setItem('study_center_name', data.user.studyCenter);
                if (data.user.centerName) localStorage.setItem('study_center_name', data.user.centerName); // Fix for studycenter document

                // Fetch department details to ensure we have the correct department_name for isolation (ALL roles with deptId)
                if (data.user.departmentId) {
                    try {
                        const deptRes = await fetch(`/api/resource/department/${data.user.departmentId}?organizationId=${data.user.organizationId}`);
                        const deptJson = await deptRes.json();
                        if (deptJson.data?.name) {
                            localStorage.setItem('department_name', deptJson.data.name);
                        }
                        if (deptJson.data?.features) {
                            localStorage.setItem('user_features', JSON.stringify(deptJson.data.features));
                        }
                    } catch (e) {
                        console.error('Error fetching department details during login:', e);
                    }
                }

                // --- SPECIAL HANDLING: EMPLOYEE ---
                if (data.user.role === 'Employee') {
                    console.log('[Login] 👩‍💼 Detected Employee role. Navigating to /employee-dashboard');
                    navigate('/employee-dashboard', { replace: true });
                }
                else if (data.user.role === 'HR') {
                    console.log('[Login] 🤝 Detected HR role. Navigating to /hr');
                    navigate('/hr', { replace: true });
                }
                else if (data.user.role === 'Operations') {
                    console.log('[Login] ⚙️ Detected Operations role. Navigating to /ops-dashboard');
                    navigate('/ops-dashboard', { replace: true });
                }
                else if (data.user.role === 'Finance') {
                    console.log('[Login] 💰 Detected Finance role. Navigating to /finance');
                    navigate('/finance', { replace: true });
                }
                else if (data.user.role === 'OrganizationAdmin') {
                    console.log('[Login] 🏫 Detected OrganizationAdmin. Navigating to /organization-dashboard');
                    navigate('/organization-dashboard');
                } else if (data.user.role === 'Student') {
                    console.log('[Login] 🎓 Detected Student. Navigating to /student-dashboard');
                    navigate('/student-dashboard');
                } else if (data.user.role === 'StudyCenter') {
                    console.log('[Login] 🏢 Detected StudyCenter! ID:', data.user.id, 'Targeting /center-dashboard');
                    navigate('/center-dashboard');
                } else if (data.user.role === 'DepartmentAdmin') {
                    console.log('[Login] 🏗️ Detected DepartmentAdmin role.');
                    // ... rest of the logic ...
                    // Fetch department details to check panelType (already fetched above, but we need the panelType specifically)
                    try {
                        const deptRes = await fetch(`/api/resource/department/${data.user.departmentId}?organizationId=${data.user.organizationId}`);
                        const deptJson = await deptRes.json();
                        const panelType = deptJson.data?.panelType;

                        if (panelType === 'HR') {
                            navigate('/hr');
                        } else if (panelType === 'Operations' || panelType === 'Education') {
                            navigate('/ops-dashboard');
                        } else if (panelType === 'Finance') {
                            navigate('/finance');
                        } else {
                            navigate(`/department/${data.user.departmentId}`);
                        }
                    } catch (e) {
                        navigate(`/department/${data.user.departmentId}`);
                    }
                } else {
                    navigate('/');
                }
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('Connection failed. Please check your backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f5f6] flex items-center justify-center p-4 text-[#1d2129]">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-xl shadow-lg mb-4">
                        <GraduationCap size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">{deptName ? `${deptName} Login` : 'Education ERP Login'}</h1>
                    <p className="text-gray-500 mt-2">{deptName ? 'Access your department dashboard' : 'Access your portal'}</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-[#d1d8dd]">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[13px] font-semibold text-[#626161] mb-2">Username</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f7] border border-[#d1d8dd] rounded-lg text-[14px] focus:bg-white focus:border-blue-400 outline-none transition-all"
                                    placeholder="Employee ID or Email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#626161] mb-2">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f7] border border-[#d1d8dd] rounded-lg text-[14px] focus:bg-white focus:border-blue-400 outline-none transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-red-500 text-[13px] text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-[14px] font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 space-y-4">
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 shadow-inner">
                        <h3 className="text-[12px] font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Shield size={14} /> System Access Information
                        </h3>
                        <div className="grid grid-cols-2 gap-6 text-[11px]">
                            <div className="space-y-1">
                                <p className="font-bold text-blue-700">HR Workspace</p>
                                <p className="text-gray-500">User: <code className="bg-white px-1 rounded">hr_admin</code></p>
                                <p className="text-gray-500">Pass: <code className="bg-white px-1 rounded">admin123</code></p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-blue-700">Operations</p>
                                <p className="text-gray-500">User: <code className="bg-white px-1 rounded">ops_admin</code></p>
                                <p className="text-gray-500">Pass: <code className="bg-white px-1 rounded">admin123</code></p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-blue-700">Finance</p>
                                <p className="text-gray-500">User: <code className="bg-white px-1 rounded">finance</code></p>
                                <p className="text-gray-500">Pass: <code className="bg-white px-1 rounded">admin123</code></p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-blue-100">
                                <p className="font-bold text-blue-700">Organization Admin</p>
                                <p className="text-gray-500 italic">Use your credentials to manage panels</p>
                            </div>
                            <div className="col-span-2 text-[10px] text-gray-400 italic mt-2">
                                * Above are example credentials. Please use the ones set in your dashboard.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
