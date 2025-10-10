import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import RegisterRequirement from "./pages/RegisterRequirement";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/error-fallback";

const queryClient = new QueryClient();

const App = () =>
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, errorInfo) => {
    console.error(`Error Boundary caught an error(pathname:${location.pathname + location.search}):`, error, errorInfo);
    setTimeout(() => {
      throw error;
    }, 0);
  }}>

    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/register-requirement" element={<RegisterRequirement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>;


export default App;