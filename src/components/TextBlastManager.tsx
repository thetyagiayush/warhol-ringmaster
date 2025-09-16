import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Send, Users, CheckSquare, Square, AlertCircle, CheckCircle, Filter, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CallLog } from '@/services/api';
import axios from 'axios';

interface CustomFilter {
  id: string;
  name: string;
  phoneNumbers: string[];
}

export function TextBlastManager() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allCallLogs, setAllCallLogs] = useState<CallLog[]>([]);
  const [uniqueNumbers, setUniqueNumbers] = useState<string[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [lastSendResult, setLastSendResult] = useState<{
    sent_count: number;
    failed_count: number;
    errors: Array<{phone_number: string; error: string}>;
  } | null>(null);
  
  // Filter states
  const [selectedCalledFilter, setSelectedCalledFilter] = useState<string>('all');
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [selectedCustomFilter, setSelectedCustomFilter] = useState<string>('none');
  const [isCreateFilterOpen, setIsCreateFilterOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterNumbers, setNewFilterNumbers] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCallLogs();
    loadCustomFilters();
  }, []);

  const loadCustomFilters = () => {
    const filters = JSON.parse(localStorage.getItem('customFilters') || '[]');
    setCustomFilters(filters);
  };

  const fetchCallLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await axios.get('https://warhol-backend-main-app.vercel.app/api/v1/calling/get-logs');
      const allLogs: CallLog[] = response?.data?.data || [];
      setAllCallLogs(allLogs);
      
      // Get unique phone numbers and not anonymous number
      const uniquePhoneNumbers = Array.from(new Set(allLogs.map((log) => log.phone_number))).filter(num => num?.toLowerCase() !== 'anonymous');
      setUniqueNumbers(uniquePhoneNumbers);
      // Select all by default
      setSelectedNumbers(uniquePhoneNumbers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch call logs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Get available called numbers for filtering
  const availableCalledNumbers = Array.from(new Set(
    allCallLogs
      .filter(log => log.called && log.called.toLowerCase() !== 'anonymous')
      .map(log => log.called!)
  ));

  // Get filtered phone numbers based on selected filters
  const getFilteredNumbers = () => {
    let filtered = [...uniqueNumbers];
    
    // Filter by called number
    if (selectedCalledFilter !== 'all') {
      const numbersWhoCalledThis = allCallLogs
        .filter(log => log.called === selectedCalledFilter)
        .map(log => log.phone_number);
      filtered = filtered.filter(num => numbersWhoCalledThis.includes(num));
    }
    
    // Filter by custom filter
    if (selectedCustomFilter !== 'none') {
      const customFilter = customFilters.find(f => f.id === selectedCustomFilter);
      if (customFilter) {
        filtered = filtered.filter(num => customFilter.phoneNumbers.includes(num));
      }
    }
    
    return filtered;
  };

  const filteredNumbers = getFilteredNumbers();

  const handleSelectAll = () => {
    if (selectedNumbers.length === filteredNumbers.length) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers([...filteredNumbers]);
    }
  };

  const handleCreateCustomFilter = () => {
    if (!newFilterName.trim()) {
      toast({
        title: 'Missing Filter Name',
        description: 'Please provide a name for the filter.',
        variant: 'destructive',
      });
      return;
    }

    const phoneNumbers = newFilterNumbers
      .split(/[,\n]/)
      .map(num => num.trim())
      .filter(num => num.length > 0);

    if (phoneNumbers.length === 0) {
      toast({
        title: 'No Phone Numbers',
        description: 'Please provide at least one phone number.',
        variant: 'destructive',
      });
      return;
    }

    const newFilter: CustomFilter = {
      id: Date.now().toString(),
      name: newFilterName,
      phoneNumbers
    };

    setCustomFilters([...customFilters, newFilter]);
    setNewFilterName('');
    setNewFilterNumbers('');
    setIsCreateFilterOpen(false);
    
    toast({
      title: 'Filter Created',
      description: `Created filter "${newFilterName}" with ${phoneNumbers.length} numbers.`,
    });
  };

  // Update selected numbers when filters change
  useEffect(() => {
    const filtered = getFilteredNumbers();
    setSelectedNumbers(filtered);
  }, [selectedCalledFilter, selectedCustomFilter, uniqueNumbers, customFilters]);

  const handleNumberToggle = (number: string) => {
    setSelectedNumbers(prev => 
      prev.includes(number) 
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const handleSendBlast = async () => {
    if (!message.trim()) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedNumbers.length === 0) {
      toast({
        title: 'No Recipients Selected',
        description: 'Please select at least one recipient.',
        variant: 'destructive',
      });
      return;
    }

    // Check message length (SMS limit)
    if (message.trim().length > 160) {
      toast({
        title: 'Message Too Long',
        description: 'SMS messages should be 160 characters or less for optimal delivery.',
        variant: 'destructive',
      });
      return;
    }

    const MAX_BATCH_SIZE = 20;
    const batches = [];
    for (let i = 0; i < selectedNumbers.length; i += MAX_BATCH_SIZE) {
      batches.push(selectedNumbers.slice(i, i + MAX_BATCH_SIZE));
    }

    setIsLoading(true);
    setSendProgress(0);
    setCurrentBatch(0);
    setTotalBatches(batches.length);
    setLastSendResult(null);

    let totalSent = 0;
    let totalFailed = 0;
    let allErrors: Array<{phone_number: string; error: string}> = [];

    try {
      for (let i = 0; i < batches.length; i++) {
        setCurrentBatch(i + 1);
        
        const response = await axios.post('https://warhol-backend-main-app.vercel.app/api/v1/calling/send-blast', {
          message: message.trim(),
          phone_numbers: batches[i]
        });
        
        if (response.data.success) {
          const batchResult = response.data.data;
          totalSent += batchResult.sent_count;
          totalFailed += batchResult.failed_count;
          allErrors = [...allErrors, ...batchResult.errors];
          
          // Update progress
          setSendProgress(Math.round(((i + 1) / batches.length) * 100));
          
          // Small delay between batches to avoid overwhelming the server
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          throw new Error(response.data.error || 'Batch failed');
        }
      }

      // Store results for display
      setLastSendResult({
        sent_count: totalSent,
        failed_count: totalFailed,
        errors: allErrors
      });

      // Show summary toast
      if (totalFailed === 0) {
        toast({
          title: 'Text Blast Completed!',
          description: `Successfully sent ${totalSent} messages.`,
        });
      } else {
        toast({
          title: 'Text Blast Completed',
          description: `Sent: ${totalSent}, Failed: ${totalFailed}. Check details below.`,
          variant: totalSent > 0 ? 'default' : 'destructive',
        });
      }
      
      if (totalSent > 0) {
        setMessage('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send text blast. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setSendProgress(0);
      setCurrentBatch(0);
      setTotalBatches(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Text Blast Manager
        </CardTitle>
        <CardDescription>
          Send messages to all numbers that have called your Twilio numbers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Recipients</p>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {isLoadingLogs ? 'Loading...' : `${selectedNumbers.length} of ${uniqueNumbers.length} recipients selected`}
              </p>
              {selectedNumbers.length > 20 && (
                <p className="text-xs text-amber-600">
                  Large batches will be processed in groups of 20 for optimal delivery
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blast-message">Message Content</Label>
          <Textarea
            id="blast-message"
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className={`text-sm ${
            message.length > 160 
              ? 'text-destructive' 
              : message.length > 140 
                ? 'text-yellow-600' 
                : 'text-muted-foreground'
          }`}>
            {message.length}/160 characters
            {message.length > 160 && ' (Too long for SMS)'}
          </p>
        </div>

        {/* Filters Section */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h4 className="text-sm font-medium">Filter Recipients</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filter by Called Number */}
            <div className="space-y-2">
              <Label htmlFor="called-filter" className="text-sm">Filter by Number Called</Label>
              <Select value={selectedCalledFilter} onValueChange={setSelectedCalledFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All numbers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Numbers ({uniqueNumbers.length})</SelectItem>
                  {availableCalledNumbers.map((calledNumber) => {
                    const count = allCallLogs.filter(log => log.called === calledNumber).length;
                    return (
                      <SelectItem key={calledNumber} value={calledNumber}>
                        {calledNumber} ({count} calls)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Recipients ({filteredNumbers.length} after filters):
            </h4>
            {filteredNumbers.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {selectedNumbers.length === filteredNumbers.length ? (
                  <><CheckSquare className="h-4 w-4" /> Unselect All</>
                ) : (
                  <><Square className="h-4 w-4" /> Select All</>
                )}
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {isLoadingLogs ? (
              <p className="text-sm text-muted-foreground">Loading recipients...</p>
            ) : filteredNumbers.length > 0 ? (
              filteredNumbers.map((number, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`number-${index}`}
                    checked={selectedNumbers.includes(number)}
                    onCheckedChange={() => handleNumberToggle(number)}
                  />
                  <label 
                    htmlFor={`number-${index}`} 
                    className="text-sm font-mono cursor-pointer flex-1"
                  >
                    {number}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {uniqueNumbers.length === 0 ? 'No call logs found' : 'No numbers match the selected filters'}
              </p>
            )}
          </div>
        </div>

        {/* Progress indicator during sending */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Sending messages...</span>
              <span>{sendProgress}%</span>
            </div>
            <Progress value={sendProgress} className="w-full" />
            {totalBatches > 1 && (
              <p className="text-sm text-muted-foreground text-center">
                Processing batch {currentBatch} of {totalBatches}
              </p>
            )}
          </div>
        )}

        {/* Results display */}
        {lastSendResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{lastSendResult.sent_count}</strong> messages sent successfully
                </AlertDescription>
              </Alert>
              {lastSendResult.failed_count > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{lastSendResult.failed_count}</strong> messages failed
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {lastSendResult.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Failed Recipients:</h5>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {lastSendResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      <span className="font-mono">{error.phone_number}</span>: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleSendBlast} 
            disabled={isLoading || !message.trim() || selectedNumbers.length === 0 || message.length > 160}
            className="min-w-32"
          >
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Blast
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}