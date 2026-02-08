'use client'

import { useState } from 'react';
import {FileUpload} from './components/file-upload';
import { Chat } from './components/chat';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0 || uploading) return;

    const file = files[0]; // Get first file since your API expects single file
    
    // Create FormData and append the PDF
    const formData = new FormData();
    formData.append('pdf', file);

    setUploading(true);
    setMessage('');
    setMessageType('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/upload/pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.text();
        setMessage(data);
        setMessageType('success');
      } else {
        setMessage('Upload failed');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading file');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-100">
      {/* Left Section - Upload */}
      <div className="w-[30vw] min-h-screen bg-gradient-to-br from-white to-slate-50 flex flex-col items-center justify-center px-6 border-r border-slate-200 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">PDF RAG</h1>
          <p className="text-slate-500 text-sm">Upload your document to get started</p>
        </div>

        {/* Upload Component */}
        <div className="w-full max-w-sm mb-6">
          <FileUpload 
            accept=".pdf"
            onFilesSelected={handleFilesSelected}
            disabled={uploading}
            label="Select PDF Document"
            helperText="Drag and drop your PDF here"
          />
        </div>

        {/* Status Messages */}
        {uploading && (
          <div className="w-full max-w-sm flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-900">Processing your document...</p>
          </div>
        )}

        {message && messageType === 'success' && (
          <div className="w-full max-w-sm flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">{message}</p>
              <p className="text-xs text-green-700 mt-1">You can now ask questions about your document</p>
            </div>
          </div>
        )}

        {message && messageType === 'error' && (
          <div className="w-full max-w-sm flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">{message}</p>
              <p className="text-xs text-red-700 mt-1">Please try uploading again</p>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {!uploading && !message && (
          <div className="w-full max-w-sm mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Tips:</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>Supports PDF files up to several hundred pages</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>Ask specific questions for better results</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>Processing is instant once uploaded</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Right Section - Chat */}
      <div className="w-[70vw] min-h-screen bg-white">
        <Chat />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        :global(.animate-fadeIn) {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
