export interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  professional_summary: string;
  years_experience: number;
  skills: { raw_skills?: string[] };
  education: { degrees?: any[] };
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  name: string;
  email: string;
  phone?: string;
  professional_summary: string;
  years_experience: number;
  skills: { raw_skills?: string[] };
  education: { degrees?: any[] };
  created_at: string;
  updated_at: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    finish_reason: string;
    index: number;
    message: {
      content: string;
      role: string;
      tool_calls: any;
      function_call: any;
    };
  }>;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  workflow_metadata?: {
    action?: string;
    gap_info?: any;
    attempt?: number;
    workflow_complete?: boolean;
    identified_gaps?: any[];
  };
} 