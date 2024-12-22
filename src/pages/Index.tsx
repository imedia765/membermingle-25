import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to MemberMingle</h1>
        <p className="text-xl text-muted-foreground">
          Your comprehensive platform for member management and collection services
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate("/login")}>Login</Button>
          <Button variant="outline" onClick={() => navigate("/register")}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}