import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsFiltersProps {
  onFilterChange: (filters: any) => void;
  availableKeys: string[];
  availableComponents: string[];
}

export function AnalyticsFilters({ onFilterChange, availableKeys, availableComponents }: AnalyticsFiltersProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  const applyFilters = () => {
    onFilterChange({
      startDate,
      endDate,
      apiKeys: selectedKeys,
      components: selectedComponents,
    });
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedKeys([]);
    setSelectedComponents([]);
    onFilterChange({});
  };

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleComponent = (component: string) => {
    setSelectedComponents(prev => 
      prev.includes(component) ? prev.filter(c => c !== component) : [...prev, component]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filter Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PP') : 'Start'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PP') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>API Keys</Label>
          <div className="flex flex-wrap gap-1">
            {availableKeys.map(key => (
              <Badge
                key={key}
                variant={selectedKeys.includes(key) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleKey(key)}
              >
                {key}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Components</Label>
          <div className="flex flex-wrap gap-1">
            {availableComponents.map(comp => (
              <Badge
                key={comp}
                variant={selectedComponents.includes(comp) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleComponent(comp)}
              >
                {comp}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={applyFilters} size="sm" className="flex-1">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
