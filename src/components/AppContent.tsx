import { useAuthState } from "../hooks/use-auth-state";
import { Navigation } from "./navigation/Navigation";
import { AppRoutes } from "../routes";
import { Toaster } from "./ui/toaster";

export function AppContent() {
  useAuthState();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-6">
        <AppRoutes />
      </main>
      <Toaster />
    </div>
  );
}