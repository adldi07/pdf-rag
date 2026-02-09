'use client'

import { useState } from 'react';
import { FileUpload } from './components/file-upload';
import { Chat } from './components/chat';
import { CheckCircle, AlertCircle, Clock, FileText, Lock, ArrowRight, ShieldCheck, LayoutDashboard, MessageSquare } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';

import { useAuth } from '@clerk/nextjs';

export default function Home() {
  const { userId } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0 || uploading || !userId) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('userId', userId);

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
    <div className="h-[calc(100vh-48px)] w-full flex bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <SignedOut>
        {/* Modern Premium Landing Page */}
        <div className="flex-1 flex flex-col items-center p-6 lg:p-12 relative overflow-y-auto scrollbar-hide">
          {/* Dynamic Background Elements */}
          <div className="absolute inset-0 bg-[#fafafa] -z-10"></div>
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

          {/* Glassmorphism Card */}
          <div className="relative z-10 max-w-xl w-full my-auto py-8">
            <div className="bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-10 lg:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] text-center animate-fadeIn">

              {/* Icon Container with Gradient */}
              <div className="relative mx-auto w-24 h-24 mb-10 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.05]">
                Master Your docs. <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic">Privately.</span>
              </h1>

              <p className="text-base lg:text-lg text-slate-500 mb-10 leading-relaxed max-w-md mx-auto font-medium">
                The ultimate AI-powered research assistant for your PDF collection. Connect, chat, and uncover insights in seconds.
              </p>

              <div className="max-w-sm mx-auto space-y-6">
                <SignInButton mode="modal">
                  <button className="relative w-full group overflow-hidden bg-slate-900 text-white py-5 rounded-2xl font-bold transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-[0.98]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center justify-center gap-3">
                      Start Chanting <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </SignInButton>

                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="h-[1px] w-8 bg-slate-200"></span>
                  <p className="text-sm font-semibold text-slate-500">
                    New here? {' '}
                    <SignUpButton mode="modal">
                      <button className="text-blue-600 hover:text-indigo-600 transition-colors font-bold underline-offset-4 hover:underline decoration-2">
                        Create free account
                      </button>
                    </SignUpButton>
                  </p>
                  <span className="h-[1px] w-8 bg-slate-200"></span>
                </div>
              </div>

              {/* Feature Tags */}
              <div className="mt-12 pt-8 border-t border-slate-100/60 grid grid-cols-3 gap-2 lg:gap-4">
                <div className="flex flex-col items-center gap-1.5 group">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors duration-300">
                    <CheckCircle className="w-4 lg:w-5 h-4 lg:h-5 text-blue-600" />
                  </div>
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Pure RAG</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 group">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors duration-300">
                    <FileText className="w-4 lg:w-5 h-4 lg:h-5 text-indigo-600" />
                  </div>
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Contextual</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 group">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors duration-300">
                    <ShieldCheck className="w-4 lg:w-5 h-4 lg:h-5 text-emerald-600" />
                  </div>
                  <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Floaties */}
          <div className="absolute top-[20%] right-[15%] w-12 h-12 border-2 border-slate-200 rounded-2xl rotate-12 opacity-20"></div>
          <div className="absolute bottom-[20%] left-[15%] w-8 h-8 bg-slate-200 rounded-full opacity-20"></div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden fixed top-12 left-0 right-0 h-14 bg-white border-b border-slate-200/60 flex z-30 shadow-sm">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs transition-all ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}`} />
            Chat
            {activeTab === 'chat' && <div className="absolute bottom-0 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs transition-all ${activeTab === 'knowledge' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'knowledge' ? 'text-blue-600' : 'text-slate-400'}`} />
            Library
            {activeTab === 'knowledge' && <div className="absolute bottom-0 w-12 h-1 bg-blue-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* Knowledge Base Section */}
        <div className={`
          flex-col items-center pt-8 px-6 lg:w-80 lg:shrink-0 lg:border-r lg:border-slate-200/60 lg:bg-white lg:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]
          ${activeTab === 'knowledge' ? 'flex w-full pt-18' : 'hidden lg:flex'}
          lg:h-full lg:pt-8 bg-slate-50/50 lg:bg-white overflow-y-auto
        `}>
          {/* Section Label */}
          <div className="w-full max-w-sm mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Workspace</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Knowledge Base</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Upload and manage your documents</p>
          </div>

          {/* Upload Component */}
          <div className="w-full max-w-sm mb-8">
            <FileUpload
              accept=".pdf"
              onFilesSelected={handleFilesSelected}
              disabled={uploading}
              label="Select PDF Document"
              helperText="Maximum security, minimal effort"
            />
          </div>

          {/* Status Messages */}
          {uploading && (
            <div className="w-full max-w-sm flex items-center gap-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl animate-pulse">
              <div className="relative">
                <Clock className="w-6 h-6 text-blue-600 animate-spin" />
                <div className="absolute inset-0 blur-md bg-blue-600/20 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm font-bold text-blue-900">Crunching data...</p>
            </div>
          )}

          {message && messageType === 'success' && (
            <div className="w-full max-w-sm flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fadeIn">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900 leading-tight mb-1">{message}</p>
                <p className="text-xs text-emerald-700 font-medium">Your document is now sentient.</p>
              </div>
            </div>
          )}

          {message && messageType === 'error' && (
            <div className="w-full max-w-sm flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-fadeIn">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-900 leading-tight mb-1">{message}</p>
                <p className="text-xs text-rose-700 font-medium">Something went wrong. Try again.</p>
              </div>
            </div>
          )}

          {/* Tips Section */}
          {!uploading && !message && (
            <div className="w-full max-w-sm mt-8 group">
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:border-blue-100 group-hover:bg-white transition-all duration-300 self-stretch">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                  Power Tips
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                    <span className="text-[12px] font-medium text-slate-600 leading-relaxed italic">Ask highly specific questions for deep insights</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                    <span className="text-[12px] font-medium text-slate-600 leading-relaxed italic">Supports massive multi-page PDF documents</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className={`
          flex-1 h-full bg-slate-50/30 animate-fadeIn overflow-hidden
          ${activeTab === 'chat' ? 'block pt-14 lg:pt-0' : 'hidden lg:block'}
        `}>
          <Chat />
        </div>
      </SignedIn>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        :global(.animate-fadeIn) {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
