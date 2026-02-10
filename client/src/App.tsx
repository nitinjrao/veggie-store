import { Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/common/CustomerLayout';
import AdminLayout from './components/common/AdminLayout';
import HomePage from './pages/customer/HomePage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CartPage from './pages/customer/CartPage';
import FavoritesPage from './pages/customer/FavoritesPage';
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import OrderDetailsPage from './pages/customer/OrderDetailsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminVegetablesPage from './pages/admin/AdminVegetablesPage';
import AdminVegetableFormPage from './pages/admin/AdminVegetableFormPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSharePage from './pages/admin/AdminSharePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
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
  );
}
