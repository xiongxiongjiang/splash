'use client';

import { useState, useEffect } from 'react';
import { Select } from 'antd';

import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  ConversationHeader,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { apiClient } from '@/lib/api';
import { useSupabase } from '@/hooks/useSupabase';

interface ChatMessage {
  message: string;
  sender: 'user' | 'assistant';
  direction: 'incoming' | 'outgoing';
  timestamp: Date;
}

interface ChatModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [, setConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini/gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const [temperature, setTemperature] = useState<number>(0.7);
  const { user, session } = useSupabase();

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await apiClient.getChatModels();
        setAvailableModels(response.data);
      } catch (error) {
        console.error('Error loading chat models:', error);
        // Fallback to default model
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

  const sendMessage = async (messageText: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      message: messageText,
      sender: 'user',
      direction: 'outgoing',
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setIsTyping(true);

    try {
      // Prepare messages for backend API
      const chatMessages = [...messages, userMessage].map((msg) => {
        const role: 'user' | 'assistant' | 'system' = msg.sender === 'user' ? 'user' : 'assistant';
        return {
          role,
          content: msg.message,
        };
      });

      // Send to backend chat completions endpoint
      const data = await apiClient.createChatCompletion(chatMessages, {
        model: selectedModel,
        temperature: temperature,
        max_tokens: 1000,
        stream: false,
      });

      // Extract the assistant's response
      const assistantMessage = data.choices[0].message.content;

      // Add assistant message
      const botMessage: ChatMessage = {
        message: assistantMessage,
        sender: 'assistant',
        direction: 'incoming',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Store conversation ID if provided
      if (data.id) {
        setConversationId(data.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        message: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        direction: 'incoming',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ height: '600px', position: 'relative' }}>
      {/* Model Selection Controls */}
      <div style={{ 
        padding: '8px 16px', 
        borderBottom: '1px solid #e0e0e0', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>Model:</label>
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label>Temperature:</label>
          <Select
            value={temperature}
            onChange={setTemperature}
            style={{ width: 100 }}
            size="small"
          >
            <Select.Option value={0.1}>0.1 (Focused)</Select.Option>
            <Select.Option value={0.3}>0.3 (Balanced)</Select.Option>
            <Select.Option value={0.7}>0.7 (Creative)</Select.Option>
            <Select.Option value={1.0}>1.0 (Very Creative)</Select.Option>
          </Select>
        </div>

        {user && (
          <div style={{ marginLeft: 'auto', color: '#666' }}>
            Signed in as: {user.email}
          </div>
        )}
      </div>

      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Content
              userName="Tally AI"
              info="Career co-pilot at your serrvice! Chat about how to improve your resume, get refeerals and land jobs"
            />
          </ConversationHeader>

          <MessageList typingIndicator={isTyping ? <TypingIndicator content="Tally AI is typing" /> : null}>
            {messages.map((msg, index) => (
              <Message
                key={index}
                model={{
                  message: msg.message,
                  sentTime: msg.timestamp.toLocaleTimeString(),
                  sender: msg.sender,
                  direction: msg.direction,
                  position: 'single',
                }}
              />
            ))}
          </MessageList>

          <MessageInput placeholder="Ask me about resumes..." onSend={sendMessage} attachButton={false} />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
