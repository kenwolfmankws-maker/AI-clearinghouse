import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApprovalLevel {
  level_number: number;
  level_name: string;
  status: 'pending' | 'approved' | 'current' | 'escalated';
  approver_names?: string[];
  approved_by?: string;
  approved_at?: string;
}

interface ApprovalChainProgressProps {
  levels: ApprovalLevel[];
  currentLevel: number;
  escalated?: boolean;
}

export function ApprovalChainProgress({ levels, currentLevel, escalated }: ApprovalChainProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Approval Progress</h4>
        {escalated && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Escalated
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        {levels.map((level, index) => {
          const isCompleted = level.level_number < currentLevel;
          const isCurrent = level.level_number === currentLevel;
          const isPending = level.level_number > currentLevel;
          
          return (
            <div key={level.level_number} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : isCurrent ? (
                  <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                ) : level.status === 'escalated' ? (
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-300" />
                )}
                {index < levels.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{level.level_name}</p>
                  {isCompleted && (
                    <Badge variant="outline" className="text-xs">Approved</Badge>
                  )}
                  {isCurrent && (
                    <Badge className="text-xs">Pending Review</Badge>
                  )}
                </div>
                
                {level.approver_names && level.approver_names.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Approvers: {level.approver_names.join(', ')}
                  </p>
                )}
                
                {level.approved_by && level.approved_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Approved by {level.approved_by} on {new Date(level.approved_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
