'use client';

import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import ModernChat from '@/components/ModernChat';
import ResumeUpload from '@/components/ResumeUpload';

import { syncUserWithBackend, getUserResumes, apiClient, User, Resume } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { ParsedResume } from '@/lib/types';

interface DashboardState {
  supabaseUser: Record<string, any> | null;
  backendUser: User | null;
  resumes: Resume[];
  isLoading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  showOnboarding: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [state, setState] = useState<DashboardState>({
    supabaseUser: null,
    backendUser: null,
    resumes: [],
    isLoading: true,
    error: null,
    syncStatus: 'idle',
    showOnboarding: false,
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Get Supabase user and session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (userError || sessionError || !user || !session) {
          router.push(`/${locale}/login`);
          return;
        }

        setState((prev) => ({
          ...prev,
          supabaseUser: user,
          syncStatus: 'syncing',
        }));

        // Sync user with backend
        try {
          const backendUser = await syncUserWithBackend(user, session.access_token);
          
          setState((prev) => ({
            ...prev,
            backendUser,
            syncStatus: 'success',
          }));
          
          console.log('✅ Backend sync successful');
        } catch (syncError: any) {
          console.error('❌ Backend sync failed:', syncError);
          setState((prev) => ({
            ...prev,
            backendUser: null,
            syncStatus: 'error',
          }));
        }

        // Fetch user's resumes
        try {
          const resumesData = await getUserResumes(session.access_token);
          setState((prev) => ({
            ...prev,
            resumes: resumesData.resumes,
            isLoading: false,
            showOnboarding: resumesData.resumes.length === 0,
          }));
        } catch (resumeError: any) {
          setState((prev) => ({
            ...prev,
            resumes: [],
            isLoading: false,
            showOnboarding: true,
          }));
        }
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to load dashboard data',
          isLoading: false,
          syncStatus: 'error',
        }));
      }
    };

    initializeDashboard();
  }, [router, locale]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    apiClient.clearToken();
    router.push(`/${locale}/login`);
  };

  const handleCreateResume = () => {
    // TODO: Navigate to resume creation page
  };

  const handleClearProfile = async () => {
    if (!confirm('Are you sure you want to clear your profile and all resumes? This action cannot be undone.')) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Clear profile and all associated resumes
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clear-profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear profile');
      }
      
      // Reset to onboarding state
      setState((prev) => ({
        ...prev,
        resumes: [],
        isLoading: false,
        showOnboarding: true,
      }));
      
      console.log('✅ Profile cleared successfully');
    } catch (error) {
      console.error('Error clearing profile:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to clear profile',
        isLoading: false,
      }));
    }
  };

  const handleResumeUploadSuccess = async (parsedResume: ParsedResume) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Refetch resumes from backend to get the newly created one
      try {
        const resumesData = await getUserResumes(session.access_token);
        setState((prev) => ({
          ...prev,
          resumes: resumesData.resumes,
          showOnboarding: false,
        }));
      } catch (resumeError) {
        // If fetching fails, add to local state temporarily
        const newResume: Resume = {
          id: Date.now(), // Temporary ID
          name: parsedResume.name,
          email: parsedResume.email,
          phone: parsedResume.phone,
          professional_summary: parsedResume.professional_summary,
          years_experience: parsedResume.years_experience,
          skills: parsedResume.skills,
          education: parsedResume.education,
          user_id: state.backendUser?.id,
          created_at: new Date().toISOString(),
        };

        setState((prev) => ({
          ...prev,
          resumes: [newResume],
          showOnboarding: false,
        }));
      }

      console.log('✅ Resume uploaded successfully');
    } catch (error) {
      console.error('Error handling resume upload:', error);
    }
  };

  // Show onboarding flow if no resumes and not loading
  if (state.showOnboarding && !state.isLoading) {
    return <ResumeUpload onSuccess={handleResumeUploadSuccess} />;
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
          {state.syncStatus === 'syncing' && <p className="text-sm text-blue-600 mt-2">Syncing with backend...</p>}
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {state.backendUser?.name || state.supabaseUser?.email}!
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">{state.supabaseUser?.email}</span>
                {state.syncStatus === 'success' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Synced
                  </span>
                )}
                {state.syncStatus === 'error' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ⚠ Sync Failed
                  </span>
                )}
                {state.syncStatus === 'syncing' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ⏳ Syncing...
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumes Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Resumes</h2>
              <div className="flex gap-2">
                {state.resumes.length > 0 && (
                  <button
                    onClick={handleClearProfile}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Clear Profile
                  </button>
                )}
                {state.resumes.length === 0 && (
                  <button
                    onClick={handleCreateResume}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    + Create Resume
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {state.resumes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
                <p className="text-gray-500 mb-6">Create your first resume to get started with your job search.</p>
                <button
                  onClick={handleCreateResume}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Your First Resume
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{resume.name}</h3>
                      <span className="text-sm text-gray-500">#{resume.id}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Summary:</span> {resume.professional_summary?.slice(0, 50) || 'Professional'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Experience:</span> {resume.years_experience} years
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {resume.email}
                      </p>
                    </div>

                    {resume.skills?.raw_skills && resume.skills.raw_skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.skills.raw_skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {resume.skills.raw_skills.length > 3 && (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{resume.skills.raw_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Created: {new Date(resume.created_at).toLocaleDateString()}</span>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">View →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {state.resumes.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-blue-500 text-2xl mr-3">📄</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">{state.resumes.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-green-500 text-2xl mr-3">⭐</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Experience</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {state.resumes.length > 0
                      ? Math.round(state.resumes.reduce((sum, r) => sum + r.years_experience, 0) / state.resumes.length)
                      : 0}{' '}
                    years
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-purple-500 text-2xl mr-3">🛠️</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Skills</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(state.resumes.flatMap((r) => r.skills?.raw_skills || [])).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Assistant */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-600 mt-1">Ask questions about resumes or get help with your job search</p>
            </div>
            <div className="p-6 h-[800px]">
              <ModernChat resumes={state.resumes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
