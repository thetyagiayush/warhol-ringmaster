import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, MessageSquare, BarChart3, Activity } from 'lucide-react';
import { PhoneNumbersManager } from '@/components/PhoneNumbersManager';
import { TextBlastManager } from '@/components/TextBlastManager';
import { CallLogsManager } from '@/components/CallLogsManager';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

const CostAnalyticsManager = () => {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const { toast } = useToast();

  const fetchCostBreakdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('https://warhol-backend-mainapp.vercel.app/api/v1/calling/get-cost-breakdown', {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const result = response.data;
      if (!result.success) throw new Error(result.error || 'Failed to fetch cost breakdown');
      setCostData(result.data);
    } catch (err) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Budget must be a positive number',
      });
      return;
    }

    try {
      const response = await axios.post('https://warhol-backend-mainapp.vercel.app/api/v1/calling/update-budget', {
        total_budget: parseFloat(budget)
      });
      const result = response.data;
      if (!result.success) throw new Error(result.error || 'Failed to update budget');
      setCostData(prev => ({ ...prev, total_budget: result.data.total_budget }));
      toast({
        title: 'Success',
        description: 'Budget updated successfully',
      });
      setBudget('');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Analytics</CardTitle>
          <CardDescription>View cost breakdown and manage your budget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchCostBreakdown} disabled={loading}>
                {loading ? 'Loading...' : 'Fetch Costs'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-red-500">{error}</div>
          )}
          {costData && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Phone Numbers</h3>
                <p className="text-muted-foreground">
                  {costData?.phone_numbers?.total_numbers} Total numbers: ${costData?.phone_numbers?.total_cost}
                </p>
                <div className="mt-2 space-y-2">
                  {costData?.phone_numbers?.details.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="truncate">{item.phone_number}: {item.call_stats}</span>
                      <Badge variant="secondary">{item.call_cost}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Calls</h3>
                <div className="mt-2 space-y-2">
                  {costData?.calls?.details.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.phone_number} - {item.total_calls} Calls</span>
                      <Badge variant="secondary">{item.cost}</Badge>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold">
                    <span>Calls total</span>
                    <Badge>${costData?.calls?.total_cost}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">SMS</h3>
                <div className="mt-2 space-y-2">
                  {costData?.sms?.details.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.phone_number}</span>
                      <Badge variant="secondary">{item.cost}</Badge>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold">
                    <span>SMS total</span>
                    <Badge>${costData?.sms?.total_cost}</Badge>
                  </div>
                </div>
              </div>

              {/* Total Spend and Budget */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Total spend</span>
                  <Badge>${costData.total_spend}</Badge>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total budget</span>
                  <Badge>${costData.total_budget}</Badge>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Remaining budget</span>
                  <Badge>${costData.remaining_budget}</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Budget */}
      <Card>
        <CardHeader>
          <CardTitle>Update Budget</CardTitle>
          <CardDescription>Set a new total budget for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">New Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter budget (e.g., 1000.00)"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={updateBudget}>Update Budget</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('numbers');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Twilio Call Management</h1>
            <p className="text-muted-foreground">
              Manage your phone numbers, campaigns, and call analytics
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="numbers" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Numbers
            </TabsTrigger>
            <TabsTrigger value="blast" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Blast
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Call Logs
            </TabsTrigger>
            <TabsTrigger value="cost" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Cost Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="numbers" className="space-y-6">
            <PhoneNumbersManager />
          </TabsContent>

          <TabsContent value="blast" className="space-y-6">
            <TextBlastManager />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <CallLogsManager />
          </TabsContent>

          <TabsContent value="cost" className="space-y-6">
            <CostAnalyticsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;