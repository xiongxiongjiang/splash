'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  title: string;
  experience_years: number;
  skills: string[];
  education?: string;
  summary?: string;
}

interface ResumeUploadProps {
  onSuccess?: (parsedResume: ParsedResume) => void;
}

export default function ResumeUpload({ onSuccess }: ResumeUploadProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    apiClient.clearToken();
    router.push(`/${locale}/login`);
  };

  // Real backend endpoint
  const parseResume = async (file: File): Promise<{ success: boolean; data?: ParsedResume; error?: string }> => {
    try {
      // Call real API - auth token should already be set by dashboard
      const result = await apiClient.parseResume(file);
      
      if (result.success && result.profile) {
        // Convert profile to ParsedResume format
        const profile = result.profile;
        return {
          success: true,
          data: {
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            title: profile.professional_summary || 'Professional',
            experience_years: profile.years_experience || 0,
            skills: profile.skills?.raw_skills || [],
            education: profile.education?.degrees?.[0]?.degree || '',
            summary: profile.professional_summary || ''
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to parse resume'
        };
      }
    } catch (error) {
      console.error('Resume parsing error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadState('idle');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setErrorMessage('');

    try {
      const result = await parseResume(selectedFile);
      
      if (result.success && result.data) {
        setUploadState('success');
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          // Default behavior: redirect to dashboard
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 1500);
        }
      } else {
        setUploadState('error');
        setErrorMessage(result.error || 'Failed to parse resume');
      }
    } catch (error) {
      setUploadState('error');
      setErrorMessage('Network error. Please try again.');
      console.error('Upload error:', error);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (uploadState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {/* Logout button for success screen */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-green-500 text-6xl mb-4">
            <CheckCircle size={64} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Uploaded Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your resume has been parsed and processed. Redirecting to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Logout button for main screen */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>
          <p className="text-gray-600">
            Let&apos;s get started by uploading your resume. We&apos;ll analyze it and help you create personalized applications.
          </p>
        </div>

        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Drop your resume here, or
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                browse to upload
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Supports PDF, DOC, and DOCX files
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <FileText size={24} className="text-blue-600 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={resetUpload}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            </div>

            {uploadState === 'error' && (
              <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Upload Failed</p>
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploadState === 'uploading'}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploadState === 'uploading' ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Analyzing Resume...
                </>
              ) : (
                'Upload and Parse Resume'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}