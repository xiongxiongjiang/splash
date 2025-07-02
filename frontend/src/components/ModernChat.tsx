'use client';

import { useState, useEffect, useRef } from 'react';
import { Select } from 'antd';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import MarkdownIt from 'markdown-it';

import ChatInput from './ChatInput';
import { apiClient, Resume } from '@/lib/api';
import { useSupabase } from '@/hooks/useSupabase';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: any[];
  messageType?: 'text' | 'welcome' | 'analysis' | 'action' | 'workflow';
  structured?: {
    title?: string;
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

interface ChatModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
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
  const [selectedModel, setSelectedModel] = useState<string>('gemini/gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const [temperature, setTemperature] = useState<number>(0.7);
  const { user, session } = useSupabase();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await apiClient.getChatModels();
        setAvailableModels(response.data);
      } catch (error) {
        console.error('Error loading chat models:', error);
        setAvailableModels([{
          id: 'gemini/gemini-1.5-flash',
          object: 'model',
          created: Date.now(),
          owned_by: 'google'
        }]);
      }
    };

    loadModels();
  }, []);

  // Set API token when session is available
  useEffect(() => {
    if (session?.access_token) {
      apiClient.setToken(session.access_token);
    }
  }, [session]);

  // Add welcome message when user has data and chat is empty
  useEffect(() => {
    if (resumes.length > 0 && messages.length === 0 && user) {
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        content: `Hello there! 👋 I'm your AI assistant for resume and job application tasks.`,
        role: 'assistant',
        timestamp: new Date(),
        messageType: 'welcome',
        structured: {
          title: "What I can help you with:",
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
      
      setMessages([greetingMessage]);
    }
  }, [resumes, messages.length, user]);

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
    if (!messageText.trim()) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date(),
      attachments,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare messages for backend API (backend will automatically access user context via MCP functions)
      const chatMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Send to backend chat completions endpoint
      const data = await apiClient.createChatCompletion(chatMessages, {
        model: selectedModel,
        temperature: temperature,
        max_tokens: 1000,
        stream: false,
      });

      console.log('Chat completion response:', data);

      // Extract the assistant's response with null checks
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from backend');
      }

      const assistantMessage = data.choices[0].message.content;
      console.log('Assistant message:', assistantMessage);

      if (!assistantMessage) {
        throw new Error('Empty response content from backend');
      }

      // Check for workflow metadata
      const workflowMetadata = data.workflow_metadata;
      let messageType: ChatMessage['messageType'] = 'text';
      
      if (workflowMetadata?.action === 'gap_resolution_prompt') {
        messageType = 'workflow';
      } else if (workflowMetadata?.action === 'final_gap_acknowledgment' ||
                workflowMetadata?.action === 'analysis_complete' ||
                workflowMetadata?.action === 'next_steps_prompt' ||
                workflowMetadata?.action === 'workflow_escaped') {
        messageType = 'analysis';
      }

      // Add assistant message
      const botMessage: ChatMessage = {
        id: data.id || Date.now().toString(),
        content: assistantMessage,
        role: 'assistant',
        timestamp: new Date(),
        messageType,
        workflowMetadata
      };
      
      console.log('Adding bot message to state:', botMessage);
      setMessages(prev => {
        const newMessages = [...prev, botMessage];
        console.log('New messages state:', newMessages);
        return newMessages;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Card components for structured messages
  const WelcomeCard = ({ message }: { message: ChatMessage }) => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-blue-900 font-medium">{message.content}</p>
        </div>
      </div>
      
      {message.structured?.title && (
        <h4 className="font-semibold text-gray-900 mb-3">{message.structured.title}</h4>
      )}
      
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
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
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
    
    console.log('Rendering message:', message.id, message.role, message.messageType, message.content.substring(0, 50));
    
    // Render structured messages as cards (but not 'text' type)
    if (!isUser && message.messageType && message.messageType !== 'text') {
      console.log('Rendering as card:', message.messageType);
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
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
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
      {/* Header with model controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Tally AI Assistant</h2>
          
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600">Model:</label>
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              style={{ width: 200 }}
              size="small"
            >
              {availableModels.map((model) => (
                <Select.Option key={model.id} value={model.id}>
                  {model.id} ({model.owned_by})
                </Select.Option>
              ))}
            </Select>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600">Temperature:</label>
            <Select
              value={temperature}
              onChange={setTemperature}
              style={{ width: 100 }}
              size="small"
            >
              <Select.Option value={0.1}>0.1</Select.Option>
              <Select.Option value={0.3}>0.3</Select.Option>
              <Select.Option value={0.7}>0.7</Select.Option>
              <Select.Option value={1.0}>1.0</Select.Option>
            </Select>
          </div>
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
              <Bot size={48} className="mx-auto mb-4 text-gray-300" />
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
                  <Bot size={16} />
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