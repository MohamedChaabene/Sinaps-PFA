import { apiRequest } from './client';
import { UploadResponse } from '../types/api';

export interface MobileFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export async function uploadMobileFile(file: MobileFile): Promise<UploadResponse> {
  const formData = new FormData();

  // In React Native, files are attached via a dictionary with uri, name, and type
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  return apiRequest<UploadResponse>('/upload', {
    method: 'POST',
    body: formData,
  });
}
