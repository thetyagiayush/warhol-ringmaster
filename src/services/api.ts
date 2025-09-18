// API service for communicating with the backend
const API_BASE_URL = 'https://warhol-backend-mainapp.vercel.app/api/v1/calling';

export interface NumberMapping {
  id: number;
  phone_number: string;
  audio_url: string;
  text_content: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  phone_number: string;
  called?: string;
  created_at: string;
}

export interface AddNumberRequest {
  phone_number: string;
  audio_file: string; // base64 encoded
  text_content: string;
}

export const apiService = {
  // Get all phone numbers
  getAllNumbers: async (): Promise<NumberMapping[]> => {
    const response = await fetch(`${API_BASE_URL}/get-all-numbers`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  // Add new phone number
  addNumber: async (request: AddNumberRequest): Promise<NumberMapping> => {
    const response = await fetch(`${API_BASE_URL}/add-number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to add number');
    return data.data;
  },

  // Update text content for a number
  updateTextContent: async (id: number, textContent: string): Promise<NumberMapping> => {
    const response = await fetch(`${API_BASE_URL}/update-text/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text_content: textContent }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update text content');
    return data.data;
  },

  // Update audio file for a number
  updateAudioFile: async (id: number, audioFile: File): Promise<NumberMapping> => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);

    const response = await fetch(`${API_BASE_URL}/update-audio/${id}`, {
      method: 'PUT',
      body: formData,
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update audio file');
    return data.data;
  },

  // Delete a phone number
  deleteNumber: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/delete-number/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete number');
  },

  // Configure webhook for a phone number
  configureWebhook: async (phoneNumber: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/configure-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to configure webhook');
  },

  // Get all call logs
  getAllCallLogs: async (): Promise<CallLog[]> => {
    const response = await fetch(`${API_BASE_URL}/get-logs`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  // Send text blast to selected phone numbers
  sendTextBlast: async (message: string, phoneNumbers: string[]): Promise<{
    sent_count: number;
    failed_count: number;
    results: Array<{phone_number: string; status: string; message_sid: string}>;
    errors: Array<{phone_number: string; status: string; error: string}>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/send-blast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: message,
        phone_numbers: phoneNumbers 
      }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to send text blast');
    return data.data;
  },
};

// Mock data for development
export const mockNumberMappings: NumberMapping[] = [
  {
    id: 1,
    phone_number: '+1234567890',
    audio_url: 'https://example.com/audio1.mp3',
    text_content: 'Thank you for calling! We will get back to you soon.',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    phone_number: '+0987654321',
    audio_url: 'https://example.com/audio2.mp3',
    text_content: 'Your call is important to us. Please expect a follow-up message.',
    created_at: '2024-01-18T14:30:00Z',
  },
];

export const mockCallLogs: CallLog[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    phone_number: '+1111111111',
    called: '+1234567890',
    created_at: '2024-01-20T09:15:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    phone_number: '+2222222222',
    called: '+1234567890',
    created_at: '2024-01-20T11:30:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    phone_number: '+3333333333',
    called: '+0987654321',
    created_at: '2024-01-20T15:45:00Z',
  },
];