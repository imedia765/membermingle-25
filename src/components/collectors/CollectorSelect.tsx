import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CollectorSelectProps {
  collectors: any[];
  selectedCollector: string;
  onCollectorChange: (value: string) => void;
  className?: string;
}

export function CollectorSelect({
  collectors,
  selectedCollector,
  onCollectorChange,
  className = ""
}: CollectorSelectProps) {
  return (
    <Select value={selectedCollector} onValueChange={onCollectorChange}>
      <SelectTrigger className={`bg-[#F1F0FB] border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${className}`}>
        <SelectValue placeholder="Select collector" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Collectors</SelectItem>
        {collectors.map((collector) => (
          <SelectItem key={collector.id} value={collector.id}>
            {collector.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}