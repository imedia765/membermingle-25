import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Collectors from "./pages/Collectors";
import TermsAndConditions from "./pages/TermsAndConditions";
import CollectorResponsibilities from "./pages/CollectorResponsibilities";
import { Footer } from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/collectors" element={<Collectors />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/collector-responsibilities" element={<CollectorResponsibilities />} />
              </Routes>
            </BrowserRouter>
          </div>
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;