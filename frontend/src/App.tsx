/**
 * Foundation owns App.tsx. All 9 routes are pre-registered with placeholders.
 * Unit owners replace only their page components — not this file.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/common';

import CustomerLoginPlaceholder from './pages/customer/CustomerLoginPlaceholder';
import CustomerMenuPlaceholder from './pages/customer/CustomerMenuPlaceholder';
import OrderConfirmPlaceholder from './pages/customer/OrderConfirmPlaceholder';
import OrderHistoryPlaceholder from './pages/customer/OrderHistoryPlaceholder';

import AdminLoginPlaceholder from './pages/admin/AdminLoginPlaceholder';
import DashboardPlaceholder from './pages/admin/DashboardPlaceholder';
import MenuManagePlaceholder from './pages/admin/MenuManagePlaceholder';
import TableManagePlaceholder from './pages/admin/TableManagePlaceholder';

import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/customer/menu" replace />} />

          {/* Customer */}
          <Route path="/customer/login" element={<CustomerLoginPlaceholder />} />
          <Route path="/customer/menu" element={<CustomerMenuPlaceholder />} />
          <Route path="/customer/order/confirm" element={<OrderConfirmPlaceholder />} />
          <Route path="/customer/order/history" element={<OrderHistoryPlaceholder />} />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLoginPlaceholder />} />
          <Route path="/admin/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/admin/menus" element={<MenuManagePlaceholder />} />
          <Route path="/admin/tables" element={<TableManagePlaceholder />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
