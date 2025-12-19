import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { chatHistoryService, ChatTag } from '@/lib/chatHistoryService';
import { tagAnalyticsExport, ExportOptions } from '@/lib/tagAnalyticsExport';
import { Loader2, TrendingUp, Tags, Merge, Edit, Download, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ScheduledTagReports } from './ScheduledTagReports';


export default function TagAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [tagStats, setTagStats] = useState<any[]>([]);
  const [usageOverTime, setUsageOverTime] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<ChatTag[]>([]);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergeTarget, setMergeTarget] = useState('');
  const [renameTagId, setRenameTagId] = useState('');
  const [newName, setNewName] = useState('');
  
  // Export state
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [exportMetrics, setExportMetrics] = useState({
    tagStats: true,
    usageOverTime: true,
    topTags: true,
    distribution: true,
  });


  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const [stats, usage, tags] = await Promise.all([
      chatHistoryService.getTagAnalytics(),
      chatHistoryService.getTagUsageOverTime(),
      chatHistoryService.getTags()
    ]);
    
    setTagStats(stats || []);
    setAllTags(tags);
    
    // Process usage over time data
    const timeData = processUsageOverTime(usage);
    setUsageOverTime(timeData);
    
    setLoading(false);
  };

  const processUsageOverTime = (data: any[]) => {
    const grouped = data.reduce((acc: any, item: any) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = {};
      const tagName = item.chat_tags.name;
      acc[date][tagName] = (acc[date][tagName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, tags]) => ({
      date,
      ...tags
    }));
  };

  const handleMergeTags = async () => {
    if (selectedForMerge.length === 0 || !mergeTarget) {
      toast.error('Select tags to merge and a target tag');
      return;
    }

    const success = await chatHistoryService.mergeTags(selectedForMerge, mergeTarget);
    if (success) {
      toast.success('Tags merged successfully');
      setSelectedForMerge([]);
      setMergeTarget('');
      loadAnalytics();
    } else {
      toast.error('Failed to merge tags');
    }
  };

  const handleRenameTag = async () => {
    if (!renameTagId || !newName.trim()) {
      toast.error('Enter a new tag name');
      return;
    }

    const success = await chatHistoryService.renameTag(renameTagId, newName);
    if (success) {
      toast.success('Tag renamed successfully');
      setRenameTagId('');
      setNewName('');
      loadAnalytics();
    } else {
      toast.error('Failed to rename tag');
    }
  };

  const handleExport = () => {
    const options: ExportOptions = {
      format: exportFormat,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      metrics: exportMetrics,
    };

    if (exportFormat === 'csv') {
      tagAnalyticsExport.exportToCSV(tagStats, usageOverTime, options);
      toast.success('CSV report downloaded successfully');
    } else {
      tagAnalyticsExport.exportToPDF(tagStats, usageOverTime, options);
      toast.success('PDF report downloaded successfully');
    }
  };

  const toggleMetric = (metric: keyof typeof exportMetrics) => {
    setExportMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="analytics" className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Tag Analytics</h2>
          <p className="text-muted-foreground">Insights into your tag usage</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Merge className="h-4 w-4 mr-2" />
                Merge Tags
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Merge Tags</DialogTitle>
                <DialogDescription>
                  Select tags to merge into a target tag
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Tags to Merge</Label>
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                    {allTags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedForMerge.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedForMerge([...selectedForMerge, tag.id]);
                            } else {
                              setSelectedForMerge(selectedForMerge.filter(id => id !== tag.id));
                            }
                          }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Target Tag</Label>
                  <Select value={mergeTarget} onValueChange={setMergeTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags.filter(t => !selectedForMerge.includes(t.id)).map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleMergeTags} className="w-full">Merge Tags</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Rename Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Tag</DialogTitle>
                <DialogDescription>
                  Select a tag and enter a new name
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Tag</Label>
                  <Select value={renameTagId} onValueChange={setRenameTagId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags.map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>New Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter new tag name"
                  />
                </div>
                <Button onClick={handleRenameTag} className="w-full">Rename Tag</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Tag Analytics</DialogTitle>
                <DialogDescription>
                  Choose format, date range, and metrics to export
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(v: 'csv' | 'pdf') => setExportFormat(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PP') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PP') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label>Metrics to Include</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tagStats"
                        checked={exportMetrics.tagStats}
                        onCheckedChange={() => toggleMetric('tagStats')}
                      />
                      <label htmlFor="tagStats" className="text-sm">Tag Statistics</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="topTags"
                        checked={exportMetrics.topTags}
                        onCheckedChange={() => toggleMetric('topTags')}
                      />
                      <label htmlFor="topTags" className="text-sm">Top 10 Tags</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="usageOverTime"
                        checked={exportMetrics.usageOverTime}
                        onCheckedChange={() => toggleMetric('usageOverTime')}
                      />
                      <label htmlFor="usageOverTime" className="text-sm">Usage Over Time</label>
                    </div>
                  </div>
                </div>

                <Button onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TabsList>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Total Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{tagStats.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Used Tag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tagStats.length > 0 ? tagStats.sort((a, b) => b.conversationCount - a.conversationCount)[0]?.name : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">
                {tagStats.length > 0 ? `${tagStats.sort((a, b) => b.conversationCount - a.conversationCount)[0]?.conversationCount} conversations` : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg Tags per Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {tagStats.length > 0 ? (tagStats.reduce((sum, t) => sum + t.conversationCount, 0) / tagStats.length).toFixed(1) : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tag Usage Distribution</CardTitle>
              <CardDescription>Number of conversations per tag</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tagStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversationCount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tag Distribution</CardTitle>
              <CardDescription>Proportion of conversations by tag</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tagStats.slice(0, 6)}
                    dataKey="conversationCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {tagStats.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {usageOverTime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tag Usage Over Time</CardTitle>
              <CardDescription>Daily tag assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {allTags.slice(0, 5).map((tag, index) => (
                    <Line
                      key={tag.id}
                      type="monotone"
                      dataKey={tag.name}
                      stroke={COLORS[index % COLORS.length]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="scheduled">
        <ScheduledTagReports />
      </TabsContent>
    </Tabs>
  );
}

