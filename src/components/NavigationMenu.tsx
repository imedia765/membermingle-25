import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { RoleBadge } from "./navigation/RoleBadge";
import { DesktopNav } from "./navigation/DesktopNav";
import { MobileNav } from "./navigation/MobileNav";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function NavigationMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, userRole, logout } = useAuth();

  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PWA Burton
            </span>
          </Link>
          <RoleBadge role={userRole} isLoggedIn={isAuthenticated} />
        </div>

        <DesktopNav 
          isLoggedIn={isAuthenticated} 
          handleLogout={logout} 
        />
        
        <MobileNav 
          isLoggedIn={isAuthenticated}
          handleLogout={logout}
          open={open}
          setOpen={setOpen}
          handleNavigation={handleNavigation}
        />
      </div>
    </nav>
  );
}