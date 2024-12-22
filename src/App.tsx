import { BrowserRouter as Router } from "react-router-dom";
import { useAuthState } from "./hooks/use-auth-state";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Navigation } from "./components/navigation/Navigation";
import { AppRoutes } from "./routes";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  useAuthState();

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="container mx-auto py-6">
              <AppRoutes />
            </main>
            <Toaster />
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;