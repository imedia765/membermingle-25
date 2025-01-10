import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface PaymentDueDateProps {
  dueDate?: string;
  color: string;
}

export const PaymentDueDate = ({ dueDate, color }: PaymentDueDateProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'January 1st, 2025';
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch (e) {
      return 'January 1st, 2025';
    }
  };

  return (
    <div className="mt-3">
      <div
        className={cn(
          "w-full px-4 py-2 text-left font-medium bg-dashboard-card border border-dashboard-cardBorder rounded",
          !dueDate && "text-muted-foreground"
        )}
      >
        <span className={`${color} font-semibold`}>
          Due: {formatDate(dueDate)}
        </span>
      </div>
    </div>
  );
};