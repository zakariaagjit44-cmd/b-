import React from 'react';
import { Message, Sender } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  return (
    <div className={`flex items-end ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">
          {message.text}
          {message.isStreaming && <span className="inline-block align-bottom w-2 h-4 bg-gray-500 ml-1 animate-pulse rounded-full"></span>}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
