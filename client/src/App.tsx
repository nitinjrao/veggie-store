import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/common/CustomerLayout';
import AdminLayout from './components/common/AdminLayout';

// Lazy load all pages
const HomePage = lazy(() => import('./pages/customer/HomePage'));
const CustomerLoginPage = lazy(() => import('./pages/customer/CustomerLoginPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const FavoritesPage = lazy(() => import('./pages/customer/FavoritesPage'));
const OrderConfirmationPage = lazy(() => import('./pages/customer/OrderConfirmationPage'));
const OrderHistoryPage = lazy(() => import('./pages/customer/OrderHistoryPage'));
const OrderDetailsPage = lazy(() => import('./pages/customer/OrderDetailsPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminVegetablesPage = lazy(() => import('./pages/admin/AdminVegetablesPage'));
const AdminVegetableFormPage = lazy(() => import('./pages/admin/AdminVegetableFormPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminCustomerDetailPage = lazy(() => import('./pages/admin/AdminCustomerDetailPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminSharePage = lazy(() => import('./pages/admin/AdminSharePage'));
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
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="vegetables" element={<AdminVegetablesPage />} />
          <Route path="vegetables/new" element={<AdminVegetableFormPage />} />
          <Route path="vegetables/:id/edit" element={<AdminVegetableFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="share" element={<AdminSharePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
