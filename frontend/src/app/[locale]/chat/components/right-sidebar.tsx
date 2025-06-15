import React from 'react';
import { useState } from 'react';

import { Linkedin, ChevronDown, ChevronRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
const RightSidebar: React.FC = (props) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  };

  const skills = ['Product Design', 'SaaS', 'UX Design', 'Web Design', 'Web Development'];

  const personalSections = [
    'Professional Summary',
    'Core Competencies',
    'Professional Experience',
    'Education',
    'Certification',
    'Professional Development & Leadership',
  ];
  return (
    <div {...props} className="bg-[#FFFFFF99] ml-4 mr-9 my-9 px-4 py-[10px] rounded-[16px]">
      <div className="w-80 flex flex-col">
        {/* Job Details */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              K
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Senior Product Designer</h3>
              <p className="text-sm text-gray-600">Konpo</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Konpo is a Full Stack Design Studio specializing in branding, websites, products, and systems from...
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>JP</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Hiring Manager</div>
              <div className="font-medium text-gray-900">Jamie Pruett</div>
            </div>
            <Linkedin className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* Personal Match */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Personal Match</h3>
        </div>

        {/* Personal Info */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Info</h3>

            <div className="space-y-2">
              {personalSections.map((section) => (
                <div key={section} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{section}</span>
                    {expandedSections.includes(section) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.includes(section) && (
                    <div className="px-3 pb-3 text-sm text-gray-600">Content for {section} would go here...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
