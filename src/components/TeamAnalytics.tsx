import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TeamAnalyticsProps {
  members: any[];
  usageData: any[];
}

export const TeamAnalytics = ({ members, usageData }: TeamAnalyticsProps) => {
  const memberUsage = members.map(member => {
    const usage = usageData.filter(u => u.user_id === member.user_id);
    return {
      email: member.email,
      calls: usage.length,
      cost: usage.reduce((sum, u) => sum + (u.cost || 0), 0)
    };
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Team Usage Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={memberUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="email" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="calls" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Member Usage Details</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>API Calls</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberUsage.map((m, i) => (
              <TableRow key={i}>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.calls}</TableCell>
                <TableCell>${m.cost.toFixed(2)}</TableCell>
                <TableCell>{members[i]?.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
