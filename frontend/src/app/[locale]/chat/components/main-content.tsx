import React from 'react';

// import { Check } from 'lucide-react';

import ModernChat from '@/components/ModernChat';
// import { Button } from '@/components/ui/button';
const MainContent: React.FC = (props) => {
  return (
    <div {...props} className="flex-1 flex flex-col my-9 ml-9">
      {/* Chat Messages */}
      {/* <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-custom">
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            I'll help you analyze the LinkedIn job posting and identify the core competencies required for this
            position. Let me access the link you provided first.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Extract and review the job description.</span>
            </div>

            <div className="ml-9 text-xs text-gray-500 flex items-center gap-2">
              <span>Browsing</span>
              <span className="text-blue-500">
                https://ats.rippling.com/begin-careers/jobs/cdc301c1-313d-cdc301c1-313dcdc301c1...
              </span>
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                Check
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Extract and review the resume PDF.</span>
            </div>

            <div className="ml-9 text-xs text-gray-500 flex items-center gap-2">
              <span>Extract PDF</span>
              <span>pdftotext --layout /home/ubuntu/upload/senior_ux_designer_resume_alex_chen.pdf...</span>
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                Check
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Researched Apple's company info (3)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Looked up Apple employees with similar titles (12)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">Checked against our database of similar jobs (69)</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              I see that you're asking about this <strong>Senior Product Designer role at Begin</strong>. What would you
              like to know?
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm">
              Give me some resume tips if I want to apply.
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              Generate custom resume tailored to this job.
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm">
              Show me Connections for potential referral.
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Check className="w-4 h-4 text-green-500" />
          <span>Checked against our database of similar jobs (69)</span>
          <span className="ml-auto">3/3</span>
        </div>
      </div> */}

      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <ModernChat />
      </div>
    </div>
  );
};

export default MainContent;
