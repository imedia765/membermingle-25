import { Member } from "@/components/members/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MemberSearchResultsProps {
  members: Member[] | null;
  onSelectMember: (member: Member) => void;
}

export function MemberSearchResults({ members, onSelectMember }: MemberSearchResultsProps) {
  if (!members || members.length === 0) return null;

  return (
    <ScrollArea className="h-[200px] rounded-md border">
      <div className="p-4 space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
            onClick={() => onSelectMember(member)}
          >
            <div>
              <p className="font-medium">{member.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {member.member_number} • {member.email}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}