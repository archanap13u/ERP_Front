import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminAnalytics from './pages/superadmin/Analytics';
import SuperAdminOrganizations from './pages/superadmin/Organizations';
import SuperAdminOrganizationDetails from './pages/superadmin/OrganizationDetails';
import SuperAdminNewOrganization from './pages/superadmin/NewOrganization';
import SuperAdminEditOrganization from './pages/superadmin/EditOrganization';
import SuperAdminLicenses from './pages/superadmin/Licenses';
import SuperAdminSettings from './pages/superadmin/Settings';
import SuperAdminUsers from './pages/superadmin/Users';
import DeskLayout from './layouts/DeskLayout';
import OrganizationDashboard from './pages/OrganizationDashboard';
import DepartmentDetails from './pages/DepartmentDetails';
import GenericList from './pages/GenericList';
import GenericNew from './pages/GenericNew';
import GenericEdit from './pages/GenericEdit';
import HRDashboard from './pages/HRDashboard';
import StudentDashboard from './pages/StudentDashboard';
import OpsDashboard from './pages/OpsDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Departments from './pages/Departments';
import DepartmentPanel from './pages/DepartmentPanel';
import CenterDashboard from './pages/CenterDashboard';

// HR Pages
import AttendancePage from './pages/features/AttendancePage';
import RecruitmentPage from './pages/features/RecruitmentPage';
import PayrollPage from './pages/features/PayrollPage';
import EmployeeLifecyclePage from './pages/features/EmployeeLifecyclePage';
import EmployeeOnboardingNew from './pages/features/EmployeeOnboardingNew';
import EmployeeTransferPage from './pages/features/EmployeeTransferPage';
import EmployeeOffboardingPage from './pages/features/EmployeeOffboardingPage';
import ShiftManagementPage from './pages/features/ShiftManagementPage';
import HolidaysPage from './pages/features/HolidaysPage';
import AnnouncementsPage from './pages/features/AnnouncementsPage';
import NotificationsPage from './pages/features/NotificationsPage';

// Finance Pages
import InvoicesPage from './pages/features/InvoicesPage';
import PaymentsPage from './pages/features/PaymentsPage';
import ExpensesPage from './pages/features/ExpensesPage';
import GeneralLedgerPage from './pages/features/GeneralLedgerPage';
import TaxationPage from './pages/features/TaxationPage';
import QuotationsPage from './pages/features/QuotationsPage';
import DepartmentReportsPage from './pages/features/DepartmentReportsPage';
import DepartmentReportDetail from './pages/features/DepartmentReportDetail';


// Sales & CRM Pages
import SalesOrdersPage from './pages/features/SalesOrdersPage';
import LeadsPage from './pages/features/LeadsPage';
import DealsPage from './pages/features/DealsPage';
import CustomersPage from './pages/features/CustomersPage';
import TouchpointsPage from './pages/features/TouchpointsPage';
import SuppliersPage from './pages/features/SuppliersPage';

// Operations/Education Pages
import UniversityPage from './pages/features/UniversityPage';
import UniversityDetailsPage from './pages/features/UniversityDetailsPage';
import StudyCenterPage from './pages/features/StudyCenterPage';
import ApplicationsPage from './pages/features/ApplicationsPage';
import StudentRecordsPage from './pages/features/StudentRecordsPage';
import StudentDetailsPage from './pages/features/StudentDetailsPage';
import ProgramsPage from './pages/features/ProgramsPage';
import InternalMarksPage from './pages/features/InternalMarksPage';

// Inventory Pages
import StockEntryPage from './pages/features/StockEntryPage';
import DeliveryNotePage from './pages/features/DeliveryNotePage';
import ItemManagementPage from './pages/features/ItemManagementPage';
import PurchaseReceiptPage from './pages/features/PurchaseReceiptPage';
import WarehousesPage from './pages/features/WarehousesPage';

// Projects Pages
import ProjectsPage from './pages/features/ProjectsPage';
import TasksPage from './pages/features/TasksPage';
import TimesheetsPage from './pages/features/TimesheetsPage';
import AgileBoardPage from './pages/features/AgileBoardPage';

// Support Pages
import TicketsPage from './pages/features/TicketsPage';
import IssuesPage from './pages/features/IssuesPage';
import WarrantyClaimsPage from './pages/features/WarrantyClaimsPage';
import KnowledgeBasePage from './pages/features/KnowledgeBasePage';

// Assets Pages
import AssetTrackingPage from './pages/features/AssetTrackingPage';
import MaintenancePage from './pages/features/MaintenancePage';
import DepreciationPage from './pages/features/DepreciationPage';

// LMS Pages
import ExamPage from './pages/lms/ExamPage';
import ResultPage from './pages/lms/ResultPage';

// Placeholder for other pages - to be implemented
const Placeholder = ({ title }: { title: string }) => (
    <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">{title} Placeholder</h1>
        <p className="text-gray-600">This page is currently under migration.</p>
    </div>
);

import FinanceStudentPage from './pages/FinanceStudentPage';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/department-login" element={<Login />} />
                    <Route path="/finance-students" element={<FinanceStudentPage />} />

                    {/* Super Admin Routes */}
                    <Route path="/superadmin" element={<SuperAdminLayout />}>
                        <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
                        <Route path="dashboard" element={<SuperAdminDashboard />} />
                        <Route path="analytics" element={<SuperAdminAnalytics />} />
                        <Route path="organizations" element={<SuperAdminOrganizations />} />
                        <Route path="organizations/:id" element={<SuperAdminOrganizationDetails />} />
                        <Route path="organizations/new" element={<SuperAdminNewOrganization />} />
                        <Route path="organizations/:id/edit" element={<SuperAdminEditOrganization />} />
                        <Route path="licenses" element={<SuperAdminLicenses />} />
                        <Route path="settings" element={<SuperAdminSettings />} />
                        <Route path="users" element={<SuperAdminUsers />} />
                    </Route>

                    {/* Desk Routes */}
                    <Route element={<DeskLayout />}>
                        <Route path="/organization-dashboard" element={<OrganizationDashboard />} />
                        <Route path="/organization/departments" element={<Departments />} />
                        <Route path="/department/:id" element={<DepartmentPanel />} />
                        <Route path="/organization/department/:id" element={<DepartmentDetails />} />
                        <Route path="/hr" element={<HRDashboard />} />
                        <Route path="/finance" element={<FinanceDashboard />} />
                        <Route path="/ops-dashboard" element={<OpsDashboard />} />
                        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                        <Route path="/student-dashboard" element={<StudentDashboard />} />
                        <Route path="/center-dashboard" element={<CenterDashboard />} />
                        {/* HR Module */}
                        <Route path="/attendance" element={<AttendancePage />} />
                        <Route path="/job-opening" element={<RecruitmentPage />} />
                        <Route path="/payroll-entry" element={<PayrollPage />} />
                        <Route path="/employee-onboarding" element={<EmployeeLifecyclePage />} />
                        <Route path="/employee/new" element={<EmployeeOnboardingNew />} />
                        <Route path="/employee-transfer" element={<EmployeeTransferPage />} />
                        <Route path="/employee-exit" element={<EmployeeOffboardingPage />} />
                        <Route path="/shift-assignment" element={<ShiftManagementPage />} />
                        <Route path="/holiday-list" element={<HolidaysPage />} />
                        <Route path="/announcement" element={<AnnouncementsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/department-reports" element={<DepartmentReportsPage />} />
                        <Route path="/department-reports/:id" element={<DepartmentReportDetail />} />

                        {/* Finance Module */}
                        <Route path="/sales-invoice" element={<InvoicesPage />} />
                        <Route path="/payment-entry" element={<PaymentsPage />} />
                        <Route path="/expense-claim" element={<ExpensesPage />} />
                        <Route path="/journal-entry" element={<GeneralLedgerPage />} />
                        <Route path="/sales-taxes-and-charges-template" element={<TaxationPage />} />
                        <Route path="/quotation" element={<QuotationsPage />} />

                        {/* Sales & CRM Module */}
                        <Route path="/sales-order" element={<SalesOrdersPage />} />
                        <Route path="/lead" element={<LeadsPage />} />
                        <Route path="/crm-deal" element={<DealsPage />} />
                        <Route path="/customer" element={<CustomersPage />} />
                        <Route path="/contact" element={<TouchpointsPage />} />
                        <Route path="/supplier" element={<SuppliersPage />} />

                        {/* Operations/Education Module */}
                        <Route path="/university" element={<UniversityPage />} />
                        <Route path="/university/new" element={<GenericNew doctype="university" />} />
                        <Route path="/university/:id" element={<UniversityDetailsPage />} />
                        <Route path="/university/:id/edit" element={<GenericEdit doctype="university" />} />
                        <Route path="/studentapplicant" element={<ApplicationsPage />} />
                        <Route path="/branch" element={<StudyCenterPage />} />
                        <Route path="/studycenter" element={<StudyCenterPage />} />
                        <Route path="/studycenter/new" element={<GenericNew doctype="studycenter" />} />
                        <Route path="/studycenter/:id" element={<GenericEdit doctype="studycenter" />} />
                        <Route path="/student" element={<StudentRecordsPage />} />
                        <Route path="/student/new" element={<GenericNew doctype="student" />} />
                        <Route path="/student/:id" element={<StudentDetailsPage />} />
                        <Route path="/student/:id/edit" element={<GenericEdit doctype="student" />} />
                        <Route path="/program" element={<ProgramsPage />} />
                        <Route path="/program/:id/edit" element={<GenericEdit doctype="program" />} />
                        <Route path="/internalmark" element={<InternalMarksPage />} />
                        <Route path="/internalmark/new" element={<GenericNew doctype="internalmark" />} />
                        <Route path="/internalmark/new" element={<GenericNew doctype="internalmark" />} />
                        <Route path="/internalmark/:id/edit" element={<GenericEdit doctype="internalmark" />} />

                        {/* LMS Routes */}
                        <Route path="/student/exams" element={<ExamPage />} />
                        <Route path="/student/results" element={<ResultPage />} />

                        {/* Inventory Module */}
                        <Route path="/stockentry" element={<StockEntryPage />} />
                        <Route path="/deliverynote" element={<DeliveryNotePage />} />
                        <Route path="/item" element={<ItemManagementPage />} />
                        <Route path="/purchasereceipt" element={<PurchaseReceiptPage />} />
                        <Route path="/warehouse" element={<WarehousesPage />} />

                        {/* Projects Module */}
                        <Route path="/project" element={<ProjectsPage />} />
                        <Route path="/task" element={<TasksPage />} />
                        <Route path="/timesheet" element={<TimesheetsPage />} />
                        <Route path="/agile-board" element={<AgileBoardPage />} />

                        {/* Support Module */}
                        <Route path="/issue" element={<TicketsPage />} />
                        <Route path="/issue-tracker" element={<IssuesPage />} />
                        <Route path="/warrantyclaim" element={<WarrantyClaimsPage />} />
                        <Route path="/helparticle" element={<KnowledgeBasePage />} />

                        {/* Assets Module */}
                        <Route path="/asset" element={<AssetTrackingPage />} />
                        <Route path="/assetmaintenance" element={<MaintenancePage />} />
                        <Route path="/depreciation" element={<DepreciationPage />} />

                        <Route path="/complaint" element={<GenericList doctype="complaint" />} /> {/* Use GenericList for HR view for now, maybe custom later */}

                        <Route path="/:doctype" element={<GenericList />} />
                        <Route path="/:doctype/new" element={<GenericNew />} />
                        <Route path="/:doctype/:id" element={<GenericEdit />} />
                    </Route>


                </Routes>
            </div>
        </Router>
    );
}

export default App;
