'use client'

import { useState } from 'react';
import {FileUpload} from './components/file-upload';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0 || uploading) return;

    const file = files[0]; // Get first file since your API expects single file
    
    // Create FormData and append the PDF
    const formData = new FormData();
    formData.append('pdf', file);

    setUploading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/upload/pdf', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.text();
        setMessage(data);
      } else {
        setMessage('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="min-h-screen w-screen flex">
        <div className="w-[30vw] min-h-screen flex items-center justify-center">
          <div className="w-full px-4">
            <FileUpload 
              accept=".pdf"
              onFilesSelected={handleFilesSelected}
              disabled={uploading}
            />
            {uploading && (
              <p className="mt-4 text-center text-sm text-blue-600">Uploading...</p>
            )}
            {message && (
              <p className="mt-4 text-center text-sm text-green-600">{message}</p>
            )}
          </div>
        </div>
        <div className="w-[70vw] min-h-screen border-l-2">
          hi2 
        </div>
      </div>
    </div>
  );
}
