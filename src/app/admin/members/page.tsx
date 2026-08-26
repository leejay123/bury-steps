import { prisma } from "@/lib/db";
import { displayName, requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { DeleteMemberButton } from "./delete-member-button";
import { AdminPageIntro } from "../admin-page-intro";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const admin = await requireAdmin();

  const members = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { attendances: true, walksCreated: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageIntro
        description="Everyone who has signed up. Removing someone deletes their login and clock-in records. Walks they created stay with the group."
        title="Members"
      />
      {members.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Clock-ins</TableHead>
              <TableHead className="text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const name = displayName(member);
              const isYou = member.id === admin.id;
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {name}
                    {isYou ? <span className="ml-2 text-xs text-muted-foreground">You</span> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role === "ADMIN" ? "Organiser" : "Member"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDate(member.createdAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {member._count.attendances}
                  </TableCell>
                  <TableCell className="text-right">
                    {isYou ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <DeleteMemberButton
                        attendanceCount={member._count.attendances}
                        name={name}
                        userId={member.id}
                        walkCount={member._count.walksCreated}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
