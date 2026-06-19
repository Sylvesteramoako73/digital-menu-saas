import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PublicMenuPage from "./pages/PublicMenuPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AuthGuard from "./components/auth/AuthGuard";
import { isSubdomainMode } from "./lib/auth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <DashboardPage />
          </AuthGuard>
        }
      />
      <Route path="/menu/:slug" element={<PublicMenuPage />} />
      <Route path="/menu/:slug/item/:itemId" element={<ItemDetailPage />} />
      <Route path="/menu/:slug/cart" element={<CartPage />} />
      <Route path="/menu/:slug/checkout" element={<CheckoutPage />} />
      <Route path="/order/:orderId/confirmation" element={<OrderConfirmationPage />} />
      <Route
        path="/"
        element={isSubdomainMode() ? <PublicMenuPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/item/:itemId"
        element={isSubdomainMode() ? <ItemDetailPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/cart"
        element={isSubdomainMode() ? <CartPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/checkout"
        element={isSubdomainMode() ? <CheckoutPage /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
