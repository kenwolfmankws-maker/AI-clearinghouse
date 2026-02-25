import React from 'react';
import { Database, Users, Zap, TrendingUp } from 'lucide-react';

const StatsSection: React.FC = () => {
  const stats = [
    { icon: Database, label: 'AI Models', value: '25+', color: 'text-blue-400' },
    { icon: Users, label: 'Active Users', value: '50K+', color: 'text-purple-400' },
    { icon: Zap, label: 'API Calls/Day', value: '10M+', color: 'text-yellow-400' },
    { icon: TrendingUp, label: 'Uptime', value: '99.9%', color: 'text-green-400' },
  ];

  return (
    <div className="py-16 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className={`w-10 h-10 mx-auto mb-3 ${stat.color}`} />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
