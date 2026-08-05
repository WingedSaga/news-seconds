import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex flex-col lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
