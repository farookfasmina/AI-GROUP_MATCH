import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner, ToastProvider } from './components/ui';
import { AuthProvider, homeFor, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Home from './pages/Home';
import Login from './pages/Login';
import Matches from './pages/Matches';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Preferences from './pages/Preferences';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Sessions from './pages/Sessions';
import VerifyEmail from './pages/VerifyEmail';
import Survey from './pages/Survey';
import AdminEvaluation from './pages/admin/Evaluation';
import AdminGroups from './pages/admin/Groups';
import AdminMatching from './pages/admin/Matching';
import AdminOverview from './pages/admin/Overview';
import AdminSubjects from './pages/admin/Subjects';
import AdminUsers from './pages/admin/Users';

// Signed-in pages. Students finish the setup wizard (consent, subjects, free time) first.
function Protected({ children, admin, needProfile }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !user.is_platform_admin) return <Navigate to={homeFor(user)} replace />;
  if (needProfile && !user.is_platform_admin && !user.profile_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />

            <Route element={<Protected needProfile><Layout /></Protected>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/survey" element={<Survey />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<Protected admin><Layout /></Protected>}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/matching" element={<AdminMatching />} />
              <Route path="/admin/groups" element={<AdminGroups />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/subjects" element={<AdminSubjects />} />
              <Route path="/admin/evaluation" element={<AdminEvaluation />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
