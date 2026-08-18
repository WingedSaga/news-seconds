import { Navigate, Route, Routes } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Jokes from './pages/Jokes';
import Weather from './pages/Weather';
import Article from './pages/Article';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Submit from './pages/Submit';
import MyArticles from './pages/MyArticles';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import Support from './pages/Support';
import NotFound from './pages/NotFound';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPending from './pages/admin/AdminPending';
import AdminArticles from './pages/admin/AdminArticles';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminComments from './pages/admin/AdminComments';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSupport from './pages/admin/AdminSupport';
import AdminReports from './pages/admin/AdminReports';
import AdminLogins from './pages/admin/AdminLogins';
import AdminAds from './pages/admin/AdminAds';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jokes" element={<Jokes />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/article/:id" element={<Article />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/support" element={<Support />} />

        <Route
          path="/submit"
          element={
            <ProtectedRoute>
              <Submit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-articles"
          element={
            <ProtectedRoute>
              <MyArticles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <Bookmarks />
            </ProtectedRoute>
          }
        />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Админ-панель: собственный каркас с боковым меню. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pending" element={<AdminPending />} />
        <Route path="articles" element={<AdminArticles />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="logins" element={<AdminLogins />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="ads" element={<AdminAds />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
