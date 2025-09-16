import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CallLog, apiService } from '@/services/api';
import axios from 'axios';

export function CallLogsManager() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [uniqueNumbers, setUniqueNumbers] = useState<CallLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const fetchCallLogs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://warhol-backend-main-app.vercel.app//api/v1/calling/get-logs');
      const allLogs = response?.data?.data || [];
      setLogs(allLogs);
      
      // Get unique phone numbers with their latest call date
      const uniqueNumbersMap = new Map<string, CallLog>();
      allLogs.forEach((log: CallLog) => {
        const existing = uniqueNumbersMap.get(log.phone_number);
        if (!existing || new Date(log.created_at) > new Date(existing.created_at)) {
          uniqueNumbersMap.set(log.phone_number, log);
        }
      });
      setUniqueNumbers(allLogs);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch call logs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = uniqueNumbers.filter(log => 
    log.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['From', 'To', 'Call Date', 'Call Time'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.phone_number,
        log.called || 'N/A',
        new Date(log.created_at).toLocaleDateString(),
        new Date(log.created_at).toLocaleTimeString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredLogs.length} call logs to CSV.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Logs
            </CardTitle>
            <CardDescription>
              View unique caller numbers and their latest call times
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phone numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Latest Call Date</TableHead>
                <TableHead>Latest Call Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading call logs...
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.phone_number}</Badge>
                    </TableCell>
                    <TableCell>{log.called || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {filteredLogs.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No call logs found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}