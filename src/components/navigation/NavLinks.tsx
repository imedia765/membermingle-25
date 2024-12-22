import { Link } from "react-router-dom";

export function NavLinks() {
  return (
    <nav className="hidden md:flex items-center space-x-4">
      <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
        Home
      </Link>
      <Link to="/terms" className="text-sm font-medium transition-colors hover:text-primary">
        Terms
      </Link>
      <Link to="/collector-responsibilities" className="text-sm font-medium transition-colors hover:text-primary">
        Collector Info
      </Link>
      <Link to="/medical-examiner-process" className="text-sm font-medium transition-colors hover:text-primary">
        Medical Process
      </Link>
      <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary">
        Admin
      </Link>
    </nav>
  );
}