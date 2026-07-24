import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Navbar from "./Components/Shared/NavBar";
import Footer from "./Components/Shared/Footer";
import ScrollToTop from "./Components/Shared/ScrollToTop";
import ProtectedRoute from "./Components/Shared/ProtectedRoute";

import HomePage from "./Pages/HomePage";
import Shop from "./Pages/Shop";
import ProductDetail from "./Pages/ProductDetail";
import SearchPage from "./Pages/SearchPage";
import CollectionsPage from "./Pages/CollectionsPage";
import CollectionDetail from "./Pages/CollectionDetail";
import CartPage from "./Pages/CartPage";
import Checkout from "./Pages/Checkout";
import OrderConfirmation from "./Pages/OrderConfirmation";
import Wishlist from "./Pages/Wishlist";
import AboutPage from "./Pages/AboutPage";
import ContactPage from "./Pages/ContactPage";
import FAQ from "./Pages/FAQ";
import ShippingReturns from "./Pages/ShippingReturns";
import Account from "./Pages/Account";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import NotFound from "./Pages/NotFound";

import AdminLayout from "./Components/Admin/AdminLayout";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import AdminProducts from "./Components/Admin/AdminProducts";
import AdminCategories from "./Components/Admin/AdminCategories";
import AdminCollections from "./Components/Admin/AdminCollections";
import AdminCoupons from "./Components/Admin/AdminCoupons";
import AdminCustomers from "./Components/Admin/AdminCustomers";
import AdminDeliveryAreas from "./Components/Admin/AdminDeliveryAreas";
import AdminUsers from "./Components/Admin/AdminUsers";
import AdminOrders from "./Components/Admin/AdminOrders";
import AdminContactMessages from "./Components/Admin/AdminContactMessages.jsx";

// Slow, quiet cross-fade + lift between storefront pages.
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// The public storefront shell — header, animated pages, footer.
function Storefront() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><HomePage /></Page>} />
            <Route path="/products" element={<Page><Shop /></Page>} />
            <Route path="/products/:id" element={<Page><ProductDetail /></Page>} />
            <Route path="/search" element={<Page><SearchPage /></Page>} />
            <Route path="/collections" element={<Page><CollectionsPage /></Page>} />
            <Route path="/collections/:slug" element={<Page><CollectionDetail /></Page>} />
            <Route path="/cart" element={<Page><CartPage /></Page>} />
            <Route path="/checkout" element={<Page><Checkout /></Page>} />
            <Route path="/order/:id" element={<Page><OrderConfirmation /></Page>} />
            <Route path="/wishlist" element={<Page><Wishlist /></Page>} />
            <Route path="/about" element={<Page><AboutPage /></Page>} />
            <Route path="/contact" element={<Page><ContactPage /></Page>} />
            <Route path="/faq" element={<Page><FAQ /></Page>} />
            <Route path="/shipping-returns" element={<Page><ShippingReturns /></Page>} />
            <Route path="/account" element={<Page><Account /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/register" element={<Page><Register /></Page>} />
            <Route path="*" element={<Page><NotFound /></Page>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#17130E",
            color: "#F3EFE6",
            borderRadius: 0,
            fontSize: 13,
            letterSpacing: "0.02em",
          },
        }}
      />
      <Routes>
        {/* Admin — own layout shell, gated by role */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/collections" element={<AdminCollections />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/delivery-areas" element={<AdminDeliveryAreas />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/contacts" element={<AdminContactMessages />} />
          </Route>
        </Route>

        {/* Everything else — the public storefront */}
        <Route path="*" element={<Storefront />} />
      </Routes>
    </Router>
  );
}
