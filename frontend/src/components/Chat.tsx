'use client';

import { useState } from 'react';

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

interface ChatMessage {
  message: string;
  sender: 'user' | 'assistant';
  direction: 'incoming' | 'outgoing';
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [, setConversationId] = useState<string | null>(null);

  const litellmUrl = process.env.NEXT_PUBLIC_LITELLM_URL || 'http://localhost:4000';

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
      // Prepare messages for LiteLLM
      const chatMessages = [...messages, userMessage].map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message,
      }));

      // Send to LiteLLM proxy
      const response = await fetch(`${litellmUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer sk-splash-master-key-1234`, // In production, use a proper key
        },
        body: JSON.stringify({
          model: 'gemini-pro-tools',
          messages: chatMessages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Content
              userName="Splash AI Assistant"
              info="I can help you search resumes and answer questions"
            />
          </ConversationHeader>

          <MessageList typingIndicator={isTyping ? <TypingIndicator content="Splash AI is typing" /> : null}>
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
