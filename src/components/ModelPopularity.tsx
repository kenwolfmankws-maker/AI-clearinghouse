import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { exportChartAsSVG } from '@/lib/chartExport';

interface ModelPopularityProps {
  logs: any[];
}


export function ModelPopularity({ logs }: ModelPopularityProps) {
  const getModelData = () => {
    const modelCounts: { [key: string]: number } = {};
    
    logs.forEach(log => {
      modelCounts[log.model_name] = (modelCounts[log.model_name] || 0) + 1;
    });

    return Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const data = getModelData();

  return (
    <Card className="bg-slate-900/50 border-slate-700" id="model-popularity-chart">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Most Popular Models</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => exportChartAsSVG('model-popularity-chart', 'model-popularity.svg')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="model" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
