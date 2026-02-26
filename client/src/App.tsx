import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/common/CustomerLayout';
import AdminLayout from './components/common/AdminLayout';
import StaffLayout from './components/common/StaffLayout';

// Lazy load all pages
const HomePage = lazy(() => import('./pages/customer/HomePage'));
const CustomerLoginPage = lazy(() => import('./pages/customer/CustomerLoginPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const FavoritesPage = lazy(() => import('./pages/customer/FavoritesPage'));
const FridgeOrdersPage = lazy(() => import('./pages/customer/FridgeOrdersPage'));
const FridgeOrderDetailPage = lazy(() => import('./pages/customer/FridgeOrderDetailPage'));
const FridgeOrderConfirmationPage = lazy(
  () => import('./pages/customer/FridgeOrderConfirmationPage')
);
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminVegetablesPage = lazy(() => import('./pages/admin/AdminVegetablesPage'));
const AdminVegetableFormPage = lazy(() => import('./pages/admin/AdminVegetableFormPage'));
const AdminFridgeOrdersPage = lazy(() => import('./pages/admin/AdminFridgeOrdersPage'));
const AdminFridgeOrderDetailPage = lazy(() => import('./pages/admin/AdminFridgeOrderDetailPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminCustomerDetailPage = lazy(() => import('./pages/admin/AdminCustomerDetailPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminSharePage = lazy(() => import('./pages/admin/AdminSharePage'));
const AdminStaffPage = lazy(() => import('./pages/admin/AdminStaffPage'));
const AdminPickupPointsPage = lazy(() => import('./pages/admin/AdminPickupPointsPage'));
const AdminFridgeInventoryPage = lazy(() => import('./pages/admin/AdminFridgeInventoryPage'));
const StaffLoginPage = lazy(() => import('./pages/staff/StaffLoginPage'));
const ProducerDashboardPage = lazy(() => import('./pages/producer/ProducerDashboardPage'));
const ProducerOrdersPage = lazy(() => import('./pages/producer/ProducerOrdersPage'));
const ProducerFridgesPage = lazy(() => import('./pages/producer/ProducerFridgesPage'));
const SupplierDashboardPage = lazy(() => import('./pages/supplier/SupplierDashboardPage'));
const TransporterDashboardPage = lazy(() => import('./pages/transporter/TransporterDashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Customer routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/orders" element={<FridgeOrdersPage />} />
          <Route path="/orders/:id" element={<FridgeOrderDetailPage />} />
          <Route path="/orders/:id/confirmation" element={<FridgeOrderConfirmationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="vegetables" element={<AdminVegetablesPage />} />
          <Route path="vegetables/new" element={<AdminVegetableFormPage />} />
          <Route path="vegetables/:id/edit" element={<AdminVegetableFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminFridgeOrdersPage />} />
          <Route path="orders/:id" element={<AdminFridgeOrderDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="pickup-points" element={<AdminPickupPointsPage />} />
          <Route path="fridges/:id/inventory" element={<AdminFridgeInventoryPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="share" element={<AdminSharePage />} />
        </Route>

        {/* Staff routes */}
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route path="/producer" element={<StaffLayout />}>
          <Route index element={<ProducerDashboardPage />} />
          <Route path="orders" element={<ProducerOrdersPage />} />
          <Route path="fridges" element={<ProducerFridgesPage />} />
        </Route>
        <Route path="/supplier" element={<StaffLayout />}>
          <Route index element={<SupplierDashboardPage />} />
        </Route>
        <Route path="/transporter" element={<StaffLayout />}>
          <Route index element={<TransporterDashboardPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
