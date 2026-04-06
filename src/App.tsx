import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import ProfitCalculator from "./pages/ProfitCalculator";
import ListProduct from "./pages/ListProduct";
import Pricing from "./pages/Pricing";
import Demo from "./pages/Demo";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Terms from "./pages/Terms";
import Refund from "./pages/Refund";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/calculator" element={<Layout><ProfitCalculator /></Layout>} />
            <Route path="/list-product" element={<Layout><ListProduct /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />

            {/* Dashboard pages - protected + WITH sidebar */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
            <Route path="/products" element={<Layout><Products /></Layout>} />
            <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
