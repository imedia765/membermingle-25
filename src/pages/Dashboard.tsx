import { Card } from "@/components/ui/card";
import { MembersList } from "@/components/members/MembersList";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4a9eed] to-[#63b3ff] text-transparent bg-clip-text">
              Dashboard
            </h1>
          </div>

          <Card className="bg-card text-card-foreground p-6">
            <MembersList />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;