import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Save, Smartphone, Monitor } from 'lucide-react';

interface AdvancedAuditFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  actionFilter: string;
  setActionFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  ipFilter: string;
  setIpFilter: (value: string) => void;
  userAgentFilter: string;
  setUserAgentFilter: (value: string) => void;
  onSavePreset: () => void;
  onClearFilters: () => void;
}

export default function AdvancedAuditFilters({
  searchTerm, setSearchTerm, actionFilter, setActionFilter,
  dateFrom, setDateFrom, dateTo, setDateTo,
  ipFilter, setIpFilter, userAgentFilter, setUserAgentFilter,
  onSavePreset, onClearFilters
}: AdvancedAuditFiltersProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Advanced Filters
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSavePreset}>
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="search" className="mb-2 block">Full-Text Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder="Search action details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="action" className="mb-2 block">Action Type</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger id="action">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="api_key">API Keys</SelectItem>
              <SelectItem value="collection">Collections</SelectItem>
              <SelectItem value="organization">Organizations</SelectItem>
              <SelectItem value="member">Members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="userAgent" className="mb-2 block">Device Type</Label>
          <Select value={userAgentFilter} onValueChange={setUserAgentFilter}>
            <SelectTrigger id="userAgent">
              <SelectValue placeholder="All Devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="mobile">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </div>
              </SelectItem>
              <SelectItem value="desktop">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Desktop
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateFrom" className="mb-2 block">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="dateTo" className="mb-2 block">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="ip" className="mb-2 block">IP Address Filter</Label>
          <Input
            id="ip"
            placeholder="e.g., 192.168.1.* or 10.0.*"
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
