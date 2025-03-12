import axios from 'axios';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'An error occurred while communicating with the server';
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
};