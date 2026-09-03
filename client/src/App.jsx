import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingState from './components/common/LoadingState';

import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import BuildingsPage from './pages/registrations/BuildingsPage';
import FansPage from './pages/registrations/FansPage';
import StudentsPage from './pages/registrations/StudentsPage';
import CoordinatorsPage from './pages/registrations/CoordinatorsPage';
import UsersPage from './pages/registrations/UsersPage';
import ClassesPage from './pages/registrations/ClassesPage';
import SubjectsPage from './pages/registrations/SubjectsPage';
import ResultsRegistrationPage from './pages/results/ResultsRegistrationPage';
import ViewResultsPage from './pages/results/ViewResultsPage';
import ReportsPage from './pages/ReportsPage';
import StudentsReportPage from './pages/reports/StudentsReportPage';
import ResultsAllReportPage from './pages/reports/ResultsAllReportPage';
import ResultsByStageReportPage from './pages/reports/ResultsByStageReportPage';
import BooksReportPage from './pages/reports/BooksReportPage';
import StudentReportPage from './pages/reports/StudentReportPage';
import GudoomiyeHomePage from './pages/gudoomiye/GudoomiyeHomePage';
import MasjidStudentReportPage from './pages/gudoomiye/MasjidStudentReportPage';
import NewStudentsReportPage from './pages/gudoomiye/NewStudentsReportPage';
import SummaryReportPage from './pages/gudoomiye/SummaryReportPage';
import OverallStatsReportPage from './pages/gudoomiye/OverallStatsReportPage';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-offwhite dark:bg-gray-900">
        <LoadingState label="Loading..." />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  const fallback = user.userType === 'admin' ? '/dashboard' : user.userType === 'gudoomiye' ? '/gudoomiye' : '/results/view';
  return <Navigate to={fallback} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'student', 'coordinator', 'gudoomiye']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/registrations/buildings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BuildingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations/fans"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations/coordinators"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CoordinatorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations/subjects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results/register"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ResultsRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/view"
          element={
            <ProtectedRoute allowedRoles={['admin', 'student', 'coordinator']}>
              <ViewResultsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
              <StudentsReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/results-all"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
              <ResultsAllReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/results-by-stage"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ResultsByStageReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/books"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BooksReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/student"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gudoomiye"
          element={
            <ProtectedRoute allowedRoles={['admin', 'gudoomiye']}>
              <GudoomiyeHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gudoomiye/masjid-students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'gudoomiye']}>
              <MasjidStudentReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gudoomiye/new-students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'gudoomiye']}>
              <NewStudentsReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gudoomiye/all-students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'gudoomiye']}>
              <StudentsReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gudoomiye/summary"
          element={
            <ProtectedRoute allowedRoles={['admin', 'gudoomiye']}>
              <SummaryReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gudoomiye/overall-stats"
          element={
            <ProtectedRoute allowedRoles={['admin', 'gudoomiye']}>
              <OverallStatsReportPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<RootRedirect />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
