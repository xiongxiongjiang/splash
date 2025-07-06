import React from 'react';
import { useState, useEffect } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { getUserProfile, Profile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
const RightSidebar: React.FC = (props) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('No authentication session');
          return;
        }

        const profileData = await getUserProfile(session.access_token);
        setProfile(profileData.profile);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Extract keywords for skills display
  const skills = profile?.keywords?.raw_skills || profile?.skills?.raw_skills || [];
  // Show loading state
  if (loading) {
    return (
      <div {...props} className="bg-[#FFFFFF99] ml-4 mr-9 my-9 px-4 py-[10px] rounded-[16px]">
        <div className="w-80 flex flex-col p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div {...props} className="bg-[#FFFFFF99] ml-4 mr-9 my-9 px-4 py-[10px] rounded-[16px]">
        <div className="w-80 flex flex-col p-4">
          <div className="text-red-600 text-sm">Error loading profile: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div {...props} className="bg-[#FFFFFF99] ml-4 mr-9 my-9 px-4 py-[10px] rounded-[16px] h-[calc(100vh-4.5rem)] flex flex-col">
      <div className="w-80 flex flex-col h-full min-h-0">
        {/* Profile Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{profile?.name || 'User Profile'}</h3>
              <p className="text-sm text-gray-600">{profile?.email}</p>
              {profile?.location && <p className="text-sm text-gray-600">{profile.location}</p>}
            </div>
          </div>

          {profile?.professional_summary && (
            <p className="text-sm text-gray-600 mb-4">
              {profile.professional_summary}
            </p>
          )}

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.slice(0, 8).map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Personal Info */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Info</h3>

            <div className="space-y-2">
              {/* Professional Summary */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('Professional Summary')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">Professional Summary</span>
                  {expandedSections.includes('Professional Summary') ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.includes('Professional Summary') && (
                  <div className="px-3 pb-3 text-sm text-gray-600">
                    <div className="break-words hyphens-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                      {profile?.professional_summary || 'No professional summary available'}
                    </div>
                  </div>
                )}
              </div>

              {/* Core Competencies */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('Core Competencies')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">Core Competencies</span>
                  {expandedSections.includes('Core Competencies') ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.includes('Core Competencies') && (
                  <div className="px-3 pb-3 text-sm text-gray-600">
                    {skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs" style={{wordBreak: 'break-all'}}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      'No skills information available'
                    )}
                  </div>
                )}
              </div>

              {/* Professional Experience */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('Professional Experience')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">Professional Experience</span>
                  {expandedSections.includes('Professional Experience') ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.includes('Professional Experience') && (
                  <div className="px-3 pb-3 text-sm text-gray-600">
                    {profile?.experience?.jobs && profile.experience.jobs.length > 0 ? (
                      <div className="space-y-3">
                        {profile.experience.jobs.slice(0, 3).map((job: any, index: number) => (
                          <div key={index} className="border-l-2 border-blue-200 pl-3">
                            <div 
                              className="font-medium text-gray-900 leading-tight" 
                              style={{wordBreak: 'break-all', overflowWrap: 'break-word'}}
                            >
                              {job.title || job.position}
                            </div>
                            <div 
                              className="text-xs text-gray-500 mt-1" 
                              style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                            >
                              {job.company}
                            </div>
                            {job.duration && (
                              <div 
                                className="text-xs text-gray-500 mt-1" 
                                style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                              >
                                {job.duration}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      `${profile?.years_experience || 0} years of experience`
                    )}
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('Education')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">Education</span>
                  {expandedSections.includes('Education') ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedSections.includes('Education') && (
                  <div className="px-3 pb-3 text-sm text-gray-600">
                    {profile?.education?.degrees && profile.education.degrees.length > 0 ? (
                      <div className="space-y-3">
                        {profile.education.degrees.map((degree: any, index: number) => (
                          <div key={index}>
                            <div 
                              className="font-medium text-gray-900" 
                              style={{wordBreak: 'break-all', overflowWrap: 'break-word'}}
                            >
                              {degree.degree || degree.title}
                            </div>
                            <div 
                              className="text-xs text-gray-500 mt-1" 
                              style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                            >
                              {degree.institution || degree.school}
                            </div>
                            {degree.year && (
                              <div className="text-xs text-gray-500 mt-1">{degree.year}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      'No education information available'
                    )}
                  </div>
                )}
              </div>

              {/* Career Level & Domain */}
              {(profile?.career_level || profile?.primary_domain) && (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('Career Profile')}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">Career Profile</span>
                    {expandedSections.includes('Career Profile') ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.includes('Career Profile') && (
                    <div className="px-3 pb-3 text-sm text-gray-600">
                      <div className="space-y-2">
                        {profile?.career_level && (
                          <div style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                            <span className="font-medium">Level:</span> {profile.career_level}
                          </div>
                        )}
                        {profile?.primary_domain && (
                          <div style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                            <span className="font-medium">Domain:</span> {profile.primary_domain}
                          </div>
                        )}
                        {profile?.years_experience && (
                          <div style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                            <span className="font-medium">Experience:</span> {profile.years_experience} years
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
