import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

interface ReportHistoryFiltersProps {
  reports: any[];
  onFilterChange: (filtered: any[]) => void;
}

export function ReportHistoryFilters({ reports, onFilterChange }: ReportHistoryFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportType, setReportType] = useState<string>('all');
  const [minCompliance, setMinCompliance] = useState<string>('');
  const [maxViolations, setMaxViolations] = useState<string>('');

  useEffect(() => {
    applyFilters();
  }, [dateFrom, dateTo, reportType, minCompliance, maxViolations, reports]);

  const applyFilters = () => {
    let filtered = [...reports];

    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.generated_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.generated_at) <= dateTo);
    }
    if (reportType !== 'all') {
      filtered = filtered.filter(r => r.report_format === reportType);
    }
    if (minCompliance) {
      filtered = filtered.filter(r => (r.compliance_rate || 0) >= parseFloat(minCompliance));
    }
    if (maxViolations) {
      filtered = filtered.filter(r => (r.policy_violations || 0) <= parseInt(maxViolations));
    }

    onFilterChange(filtered);
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setReportType('all');
    setMinCompliance('');
    setMaxViolations('');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Select'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'Select'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Min Compliance %</Label>
            <Input
              type="number"
              placeholder="e.g., 80"
              value={minCompliance}
              onChange={(e) => setMinCompliance(e.target.value)}
            />
          </div>

          <div>
            <Label>Max Violations</Label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={maxViolations}
              onChange={(e) => setMaxViolations(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
