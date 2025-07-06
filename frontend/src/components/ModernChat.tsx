'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import MarkdownIt from 'markdown-it';

import ChatInput from './ChatInput';
import { apiClient, Resume, Profile, getUserProfile } from '@/lib/api';
import { useSupabase } from '@/hooks/useSupabase';

// Tally Logo Component
const TallyLogo = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5.59961 12.7998C6.5288 12.7998 7.40435 13.0281 8.17578 13.4287L6.21094 16.4033C5.61105 17.3114 6.68857 18.3889 7.59668 17.7891L10.5713 15.8232C10.9722 16.5949 11.2001 17.4709 11.2002 18.4004C11.2001 21.493 8.69228 23.9999 5.59961 24C2.50707 23.9998 0.00012704 21.493 0 18.4004C0.000175935 15.3079 2.5071 12.8 5.59961 12.7998ZM18.4004 12.7998C21.493 12.7999 24.0008 15.3078 24.001 18.4004C24.0008 21.493 21.4931 23.9999 18.4004 24C15.3077 23.9999 12.8009 21.493 12.8008 18.4004C12.8008 17.4713 13.0282 16.5956 13.4287 15.8242L16.4033 17.7891C17.3114 18.3889 18.3889 17.3114 17.7891 16.4033L15.8232 13.4287C16.5948 13.0279 17.4709 12.7998 18.4004 12.7998ZM5.59961 0C8.69225 8.79713e-05 11.2 2.50797 11.2002 5.60059C11.2002 6.52975 10.9719 7.40545 10.5713 8.17676L7.59668 6.21191C6.68865 5.61236 5.61129 6.68963 6.21094 7.59766L8.17578 10.5713C7.40427 10.9719 6.52893 11.2002 5.59961 11.2002C2.50705 11.2 0.000102303 8.69317 0 5.60059C0.000175935 2.50806 2.5071 0.000235763 5.59961 0ZM18.4004 0C21.493 8.79713e-05 24.0008 2.50797 24.001 5.60059C24.0008 8.69324 21.4931 11.2001 18.4004 11.2002C17.4708 11.2002 16.5948 10.9721 15.8232 10.5713L17.7891 7.59766C18.3887 6.68963 17.3114 5.61236 16.4033 6.21191L13.4287 8.17676C13.0283 7.40549 12.8008 6.52967 12.8008 5.60059C12.801 2.50798 15.3078 0.000103845 18.4004 0Z" fill="currentColor"/>
  </svg>
);

// User Avatar Component - matches the style from right sidebar
const UserAvatar = ({ profile, size = 32 }: { profile?: Profile | null; size?: number }) => (
  <div 
    className="bg-blue-600 rounded-full flex items-center justify-center text-white font-medium" 
    style={{ width: size, height: size, fontSize: size < 40 ? '12px' : '16px' }}
  >
    {profile?.name?.charAt(0) || 'U'}
  </div>
);

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
  messageType?: 'text' | 'welcome' | 'analysis' | 'action' | 'workflow';
  structured?: {
    title?: string;
    motivationalContent?: string;
    items?: string[];
    actions?: Array<{ label: string; action: string }>;
  };
  workflowMetadata?: {
    action?: string;
    gap_info?: any;
    attempt?: number;
    gap_number?: number;
    total_gaps?: number;
    workflow_complete?: boolean;
    identified_gaps?: any[];
  };
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

interface ModernChatProps {
  resumes?: Resume[];
}

export default function ModernChat({ resumes = [] }: ModernChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const selectedModel = 'gemini/gemini-2.0-flash';
  const temperature = 0.7;
  const { user, session } = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set API token when session is available
  useEffect(() => {
    if (session?.access_token) {
      apiClient.setToken(session.access_token);
    }
  }, [session]);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.access_token) {
        try {
          const profileData = await getUserProfile(session.access_token);
          setProfile(profileData.profile);
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      }
    };
    
    loadProfile();
  }, [session]);

  // Add welcome messages when user has data and chat is empty
  useEffect(() => {
    if (resumes.length > 0 && messages.length === 0 && user && session?.access_token) {
      const loadWelcomeMessage = async () => {
        try {
          const welcomeData = await apiClient.getWelcomeMessage();
          
          // First card: Motivational message
          const motivationalMessage: ChatMessage = {
            id: 'motivational',
            content: welcomeData.title,
            role: 'assistant',
            timestamp: new Date(),
            messageType: 'welcome',
            structured: {
              motivationalContent: welcomeData.content,
            }
          };

          // Second card: What I can help with
          const servicesMessage: ChatMessage = {
            id: 'services',
            content: "What I can help you with:",
            role: 'assistant',
            timestamp: new Date(),
            messageType: 'welcome',
            structured: {
              items: [
                "Analyze job requirements and match them to your skills",
                "Customize your resume for specific roles", 
                "Write compelling cover letters",
                "Craft personalized outreach messages",
                "Answer questions about your profile and experience"
              ],
              actions: [
                { label: "Tell me about my profile", action: "profile" },
                { label: "Identify skill gaps", action: "gaps" },
                { label: "what tools do you have", action: "tools" }
              ]
            }
          };
          
          setMessages([motivationalMessage, servicesMessage]);
        } catch (error) {
          console.error('Failed to load welcome message:', error);
          
          // Fallback messages
          const motivationalMessage: ChatMessage = {
            id: 'motivational',
            content: `Hello there! I am your AI career coach`,
            role: 'assistant',
            timestamp: new Date(),
            messageType: 'welcome',
            structured: {
              motivationalContent: "Listen up! You've got what it takes to dominate your career, but you need to put in the WORK. No excuses, no shortcuts. Let's identify your strengths, crush your weaknesses, and build the career you deserve!",
            }
          };

          const servicesMessage: ChatMessage = {
            id: 'services',
            content: "What I can help you with:",
            role: 'assistant',
            timestamp: new Date(),
            messageType: 'welcome',
            structured: {
              items: [
                "Analyze job requirements and match them to your skills",
                "Customize your resume for specific roles", 
                "Write compelling cover letters",
                "Craft personalized outreach messages",
                "Answer questions about your profile and experience"
              ],
              actions: [
                { label: "Tell me about my profile", action: "profile" },
                { label: "Identify skill gaps", action: "gaps" },
                { label: "what tools do you have", action: "tools" }
              ]
            }
          };
          
          setMessages([motivationalMessage, servicesMessage]);
        }
      };
      
      loadWelcomeMessage();
    }
  }, [resumes, messages.length, user, session]);

  // Handle action button clicks
  const handleActionClick = (action: string) => {
    if (action === 'profile') {
      sendMessage("Tell me about my current profile and experience");
    } else if (action === 'gaps') {
      sendMessage("Identify gaps in my profile and help me improve");
    } else if (action === 'tools') {
      sendMessage("what tools do you have available?");
    }
  };

  const sendMessage = async (messageText: string, attachments?: any[]) => {
    if (!messageText.trim() || isTyping) return; // Prevent multiple concurrent calls

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date(),
      attachments,
    };
    
    // Add user message and set typing state
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare messages for backend API (use current messages state + new user message)
      const chatMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Use the streaming chat completion method
      const reader = await apiClient.createChatCompletionStream(chatMessages, {
        model: selectedModel,
        temperature: temperature,
        max_tokens: 1000,
      });

      let accumulatedContent = '';
      let workflowMetadata: any = null;
      let messageType: ChatMessage['messageType'] = 'text';
      let botMessageId = '';
      let hasCreatedBotMessage = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.workflow_metadata) {
                workflowMetadata = parsed.workflow_metadata;
                
                if (workflowMetadata?.action === 'gap_resolution_prompt') {
                  messageType = 'workflow';
                } else if (workflowMetadata?.action === 'final_gap_acknowledgment' ||
                          workflowMetadata?.action === 'analysis_complete' ||
                          workflowMetadata?.action === 'next_steps_prompt' ||
                          workflowMetadata?.action === 'workflow_escaped') {
                  messageType = 'analysis';
                }
              }

              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                const deltaContent = parsed.choices[0].delta.content;
                accumulatedContent += deltaContent;

                // Create bot message on first content chunk ONLY if we haven't created it yet
                if (!hasCreatedBotMessage && accumulatedContent.trim()) {
                  // Remove typing indicator before creating the bot message
                  setIsTyping(false);
                  
                  botMessageId = Date.now().toString() + '-bot';
                  const initialBotMessage: ChatMessage = {
                    id: botMessageId,
                    content: accumulatedContent,
                    role: 'assistant',
                    timestamp: new Date(),
                    messageType,
                    workflowMetadata
                  };
                  
                  setMessages(prev => [...prev, initialBotMessage]);
                  hasCreatedBotMessage = true;
                } else if (hasCreatedBotMessage) {
                  // Update existing bot message
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { 
                          ...msg, 
                          content: accumulatedContent,
                          messageType,
                          workflowMetadata
                        }
                      : msg
                  ));
                }
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      }]);
    } finally {
      // Only set typing to false if we haven't already done so during streaming
      setIsTyping(false);
    }
  };

  // Card components for structured messages
  const WelcomeCard = ({ message }: { message: ChatMessage }) => {
    // Motivational card styling
    if (message.structured?.motivationalContent && !message.structured?.items) {
      return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <TallyLogo size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-orange-900 font-bold text-lg">{message.content}</p>
            </div>
          </div>
          
          <div className="bg-white/60 border border-orange-300 rounded-lg p-4">
            <p className="text-gray-800 font-medium leading-relaxed text-base">
              {message.structured.motivationalContent}
            </p>
          </div>
        </div>
      );
    }

    // Services card styling
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <TallyLogo size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-blue-900 font-medium">{message.content}</p>
          </div>
        </div>
        
        {message.structured?.items && (
          <ul className="list-disc list-inside space-y-2 mb-4 ml-1 text-gray-700">
            {message.structured.items.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed marker:text-blue-500">
                {item}
              </li>
            ))}
          </ul>
        )}
        
        {message.structured?.actions && (
          <div className="flex gap-2 flex-wrap">
            {message.structured.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action.action)}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AnalysisCard = ({ message }: { message: ChatMessage }) => {
    const { workflowMetadata } = message;
    const isGapAcknowledgment = workflowMetadata?.action === 'final_gap_acknowledgment';
    const isAnalysisComplete = workflowMetadata?.action === 'analysis_complete';
    const isNextSteps = workflowMetadata?.action === 'next_steps_prompt';
    const isWorkflowEscaped = workflowMetadata?.action === 'workflow_escaped';
    
    const getCardTitle = () => {
      if (isGapAcknowledgment) return "Gap Resolved ✅";
      if (isAnalysisComplete) return "Analysis Complete 🎯";
      if (isNextSteps) return "Next Steps 🚀";
      if (isWorkflowEscaped) return "Workflow Reset ✅";
      return "Analysis Result";
    };

    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">✓</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 mb-2">{getCardTitle()}</h4>
            <div 
              className="text-sm leading-relaxed text-green-900"
              dangerouslySetInnerHTML={{ __html: md.render(message.content.replace(/\*\[System:.*?\]\*/g, '')) }}
            />
          </div>
        </div>
        
        {message.structured?.title && (
          <h4 className="font-semibold text-gray-900 mb-3">{message.structured.title}</h4>
        )}
        
        {message.structured?.items && (
          <div className="grid gap-2">
            {message.structured.items.map((item, index) => (
              <div key={index} className="bg-white rounded p-2 text-sm text-gray-700 border border-green-100">
                {item}
              </div>
            ))}
          </div>
        )}

        {workflowMetadata?.total_gaps && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="text-xs text-green-600">
              Total gaps identified: {workflowMetadata.total_gaps}
            </div>
          </div>
        )}
      </div>
    );
  };

  const WorkflowCard = ({ message }: { message: ChatMessage }) => {
    const { workflowMetadata } = message;
    const isGapResolution = workflowMetadata?.action === 'gap_resolution_prompt';
    const isComplete = workflowMetadata?.workflow_complete || 
                       workflowMetadata?.action === 'analysis_complete' ||
                       workflowMetadata?.action === 'next_steps_prompt';
    
    return (
      <div className={`rounded-lg p-4 border ${isComplete ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isComplete ? 'bg-green-500' : 'bg-orange-500'
          }`}>
            {isComplete ? (
              <span className="text-white text-sm">✓</span>
            ) : (
              <TallyLogo size={16} className="text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-semibold ${isComplete ? 'text-green-900' : 'text-orange-900'}`}>
                {isComplete ? 'Gap Analysis Complete' : 'Analyzing Profile Gaps'}
              </h4>
              {isGapResolution && (
                <span className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-600">
                  Step {workflowMetadata?.gap_number || 1}/{workflowMetadata?.total_gaps || 3}
                </span>
              )}
            </div>
            
            {workflowMetadata?.gap_info && (
              <div className="bg-white rounded p-3 mb-3 border border-gray-100">
                <div className="text-sm">
                  <div className="font-medium text-gray-900 mb-1">
                    Current Gap: {workflowMetadata.gap_info.requirement}
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <div>Required: {workflowMetadata.gap_info.required_level}</div>
                    <div>Your level: {workflowMetadata.gap_info.user_level}</div>
                    <div className="flex items-center gap-2">
                      <span>Priority:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        workflowMetadata.gap_info.severity === 'high' ? 'bg-red-100 text-red-700' :
                        workflowMetadata.gap_info.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {workflowMetadata.gap_info.severity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div 
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: md.render(message.content.replace(/\*\[System:.*?\]\*/g, '')) }}
            />
          </div>
        </div>
        
        {(workflowMetadata?.total_gaps || workflowMetadata?.identified_gaps) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Total gaps identified: {workflowMetadata?.total_gaps || workflowMetadata?.identified_gaps?.length || 3}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    // Render structured messages as cards (but not 'text' type)
    if (!isUser && message.messageType && message.messageType !== 'text') {
      return (
        <div key={message.id} className="p-4">
          <div className="max-w-2xl">
            {message.messageType === 'welcome' && <WelcomeCard message={message} />}
            {message.messageType === 'analysis' && <AnalysisCard message={message} />}
            {message.messageType === 'workflow' && <WorkflowCard message={message} />}
            <div className="text-xs text-gray-500 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    }
    
    // Regular message rendering
    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <UserAvatar profile={profile} size={32} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <TallyLogo size={16} />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block p-3 rounded-lg ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: md.render(message.content) }}
                style={{
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                }}
              />
            )}
            
            {/* Show attachments if any */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 opacity-75">
                <div className="text-xs">
                  {message.attachments.length} file(s) attached
                </div>
              </div>
            )}
          </div>
          
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Tally AI Assistant</h2>
        </div>

        {user && (
          <div className="text-sm text-gray-600">
            {user.email}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <TallyLogo size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">Ask me about resumes or anything else!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map(renderMessage)}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <TallyLogo size={16} />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-3 rounded-lg bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-gray-600" />
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <ChatInput handleSend={sendMessage} />
      </div>
    </div>
  );
} 