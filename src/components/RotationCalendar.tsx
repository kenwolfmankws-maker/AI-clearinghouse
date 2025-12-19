import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface RotationCalendarProps {
  policies: any[];
}

export function RotationCalendar({ policies }: RotationCalendarProps) {
  const getUpcomingExpirations = () => {
    const now = new Date();
    return policies
      .filter(p => p.rotation_enabled && p.next_rotation_date)
      .map(p => ({
        ...p,
        daysUntil: Math.ceil((new Date(p.next_rotation_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .filter(p => p.daysUntil >= 0 && p.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const upcoming = getUpcomingExpirations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Expirations (Next 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming expirations</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{policy.key_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(policy.next_rotation_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={policy.daysUntil <= 7 ? 'destructive' : policy.daysUntil <= 14 ? 'default' : 'secondary'}>
                  <Clock className="h-3 w-3 mr-1" />
                  {policy.daysUntil} days
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
