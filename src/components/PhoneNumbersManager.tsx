import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, FileAudio, Edit2, Trash2, Upload, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NumberMapping, mockNumberMappings } from '@/services/api';
import axios from 'axios';

export function PhoneNumbersManager() {
  const [numbers, setNumbers] = useState<NumberMapping[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReplaceAudioOpen, setIsReplaceAudioOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingNumber, setEditingNumber] = useState<NumberMapping | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getAllNumbersHere();
  }, []);

  const getAllNumbersHere = async () => {
    const res = await axios.get('https://warhol-backend-main-app.vercel.app//api/v1/calling/get-all-numbers');
    setNumbers(res?.data?.data);
  };

  const [formData, setFormData] = useState({
    phone_number: '',
    text_content: '',
    audio_file: null as File | null,
  });

  const [editFormData, setEditFormData] = useState({
    text_content: '',
  });

  const [replaceAudioData, setReplaceAudioData] = useState({
    audio_file: null as File | null,
  });

  const handleAddNumber = async () => {
    if (!formData.phone_number || !formData.text_content || !formData.audio_file) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("phone_number", formData.phone_number);
      formDataObj.append("text_content", formData.text_content);

      formDataObj.append("audio_file", formData.audio_file);

      const res = await axios.post(
        "https://warhol-backend-main-app.vercel.app//api/v1/calling/add-number",
        formDataObj,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(res?.data?.data);
      const newNumber: NumberMapping = {
        id: res?.data?.data?.id,
        phone_number: formData.phone_number,
        audio_url: res?.data?.data?.audio_url,
        text_content: formData.text_content,
        created_at: res?.data?.data?.created_at,
      };

      setNumbers([...numbers, newNumber]);
      setFormData({ phone_number: '', text_content: '', audio_file: null });
      setIsDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Phone number added successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add phone number.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = (number: NumberMapping) => {
    const duplicated: NumberMapping = {
      ...number,
      phone_number: '',
    };

    setNumbers([...numbers, duplicated]);
    toast({
      title: 'Campaign Duplicated',
      description: 'Campaign template has been duplicated. Update the phone number.',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, audio_file: file });
    }
  };

  const handleReplaceAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplaceAudioData({ audio_file: file });
    }
  };

  const handleEditClick = (number: NumberMapping) => {
    setEditingNumber(number);
    setEditFormData({ text_content: number.text_content });
    setIsEditDialogOpen(true);
  };

  const handleReplaceAudioClick = (number: NumberMapping) => {
    setEditingNumber(number);
    setReplaceAudioData({ audio_file: null });
    setIsReplaceAudioOpen(true);
  };

  const handleUpdateText = async () => {
    if (!editingNumber || !editFormData.text_content.trim()) {
      toast({
        title: 'Missing Content',
        description: 'Please provide text content.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.put(
        `https://warhol-backend-main-app.vercel.app//api/v1/calling/update-text/${editingNumber.id}`,
        { text_content: editFormData.text_content }
      );

      if (response.data.success) {
        setNumbers(numbers.map(num => 
          num.id === editingNumber.id 
            ? { ...num, text_content: editFormData.text_content }
            : num
        ));
        setIsEditDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Text content updated successfully!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update text content.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceAudio = async () => {
    if (!editingNumber || !replaceAudioData.audio_file) {
      toast({
        title: 'Missing Audio File',
        description: 'Please select an audio file.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("audio_file", replaceAudioData.audio_file);

      const response = await axios.put(
        `https://warhol-backend-main-app.vercel.app//api/v1/calling/update-audio/${editingNumber.id}`,
        formDataObj,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setNumbers(numbers.map(num => 
          num.id === editingNumber.id 
            ? { ...num, audio_url: response.data.data.audio_url }
            : num
        ));
        setIsReplaceAudioOpen(false);
        toast({
          title: 'Success',
          description: 'Audio file replaced successfully!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to replace audio file.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNumber = async (number: NumberMapping) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(
        `https://warhol-backend-main-app.vercel.app//api/v1/calling/delete-number/${number.id}`
      );

      if (response.data.success) {
        setNumbers(numbers.filter(num => num.id !== number.id));
        toast({
          title: 'Success',
          description: 'Phone number deleted successfully!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete phone number.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureWebhook = async (number: NumberMapping) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        'https://warhol-backend-main-app.vercel.app//api/v1/calling/configure-webhook',
        { phone_number: number.phone_number }
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: `Webhook configured successfully for ${number.phone_number}!`,
        });
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to configure webhook.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to configure webhook on Twilio.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Numbers Management
            </CardTitle>
            <CardDescription>
              Manage your Twilio phone numbers and their associated campaigns
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Number
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Phone Number</DialogTitle>
                <DialogDescription>
                  Configure a new Twilio phone number with audio and text content.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1234567890"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="audio">Audio File</Label>
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="text">Follow-up Text Message</Label>
                  <Textarea
                    id="text"
                    placeholder="Enter the text message to send after the call..."
                    value={formData.text_content}
                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNumber} disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Number'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      {/* Edit Text Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Text Content</DialogTitle>
            <DialogDescription>
              Update the follow-up text message for {editingNumber?.phone_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editText">Follow-up Text Message</Label>
              <Textarea
                id="editText"
                placeholder="Enter the text message to send after the call..."
                value={editFormData.text_content}
                onChange={(e) => setEditFormData({ text_content: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateText} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Text'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replace Audio Dialog */}
      <Dialog open={isReplaceAudioOpen} onOpenChange={setIsReplaceAudioOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Replace Audio File</DialogTitle>
            <DialogDescription>
              Upload a new audio file for {editingNumber?.phone_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="replaceAudio">New Audio File</Label>
              <Input
                id="replaceAudio"
                type="file"
                accept="audio/*"
                onChange={handleReplaceAudioFileChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsReplaceAudioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReplaceAudio} disabled={isLoading}>
              {isLoading ? 'Uploading...' : 'Replace Audio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Text Content</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {numbers.map((number) => (
              <TableRow key={crypto.randomUUID()}>
                <TableCell>
                  <Badge variant="secondary">{number.phone_number}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {number.text_content}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileAudio className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Audio file</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(number.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditClick(number)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Text
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReplaceAudioClick(number)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Replace Audio
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConfigureWebhook(number)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure Webhook
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Phone Number</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this phone number ({number.phone_number})? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteNumber(number)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}