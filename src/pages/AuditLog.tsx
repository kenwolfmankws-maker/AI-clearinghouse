import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import AuditLogTimeline from '@/components/AuditLogTimeline';
import AdvancedAuditFilters from '@/components/AdvancedAuditFilters';
import FilterPresetManager from '@/components/FilterPresetManager';

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  created_at: string;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [userAgentFilter, setUserAgentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, dateFrom, dateTo, userAgentFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profiles!audit_logs_user_id_fkey(full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (actionFilter !== 'all') {
        query = query.ilike('action_type', `${actionFilter}%`);
      }

      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        query = query.lte('created_at', new Date(dateTo).toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const matchesIPFilter = (ip: string) => {
    if (!ipFilter) return true;
    const pattern = ipFilter.replace(/\*/g, '.*').replace(/\./g, '\\.');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(ip);
  };

  const matchesUserAgentFilter = (userAgent: string) => {
    if (userAgentFilter === 'all') return true;
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    return userAgentFilter === 'mobile' ? isMobile : !isMobile;
  };

  const filteredLogs = logs.filter(log =>
    (log.action_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.action_type.toLowerCase().includes(searchTerm.toLowerCase())) &&
    matchesIPFilter(log.ip_address) &&
    matchesUserAgentFilter(log.user_agent)
  );

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Action Type', 'Details', 'IP Address', 'User Agent'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user_profiles?.full_name || log.user_profiles?.email || 'Unknown',
      log.action_type,
      log.action_details,
      log.ip_address,
      log.user_agent
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('created')) return 'default';
    if (actionType.includes('deleted') || actionType.includes('revoked')) return 'destructive';
    if (actionType.includes('updated') || actionType.includes('shared')) return 'secondary';
    return 'outline';
  };

  const handleLoadPreset = (filters: any) => {
    setSearchTerm(filters.searchTerm);
    setActionFilter(filters.actionFilter);
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
    setIpFilter(filters.ipFilter);
    setUserAgentFilter(filters.userAgentFilter);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setIpFilter('');
    setUserAgentFilter('all');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <AuditLogTimeline logs={logs} />

      <div className="mt-6">
        <FilterPresetManager
          currentFilters={{ searchTerm, actionFilter, dateFrom, dateTo, ipFilter, userAgentFilter }}
          onLoadPreset={handleLoadPreset}
        />
      </div>

      <AdvancedAuditFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        ipFilter={ipFilter}
        setIpFilter={setIpFilter}
        userAgentFilter={userAgentFilter}
        setUserAgentFilter={setUserAgentFilter}
        onSavePreset={() => {}}
        onClearFilters={handleClearFilters}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No audit logs found</TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.user_profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{log.user_profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeColor(log.action_type)}>{log.action_type}</Badge>
                  </TableCell>
                  <TableCell>{log.action_details}</TableCell>
                  <TableCell className="text-sm text-gray-500">{log.ip_address}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {/mobile|android|iphone|ipad|ipod/i.test(log.user_agent) ? 'Mobile' : 'Desktop'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
