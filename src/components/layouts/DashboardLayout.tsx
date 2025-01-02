import { Footer } from "@/components/Footer";
import { Grid2x2, Grid3x3, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Grid2x2 className="h-4 w-4" />
            <span className="sr-only">2x2 Grid</span>
          </Button>
          <Button variant="outline" size="icon">
            <Grid3x3 className="h-4 w-4" />
            <span className="sr-only">3x3 Grid</span>
          </Button>
          <Button variant="outline" size="icon">
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Layout Grid</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
    </div>
  );
};