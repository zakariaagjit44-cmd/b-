import React, { useState } from 'react';
import { SendIcon } from './Icons';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="أو اكتب رسالتك هنا..."
          disabled={disabled}
          className="w-full bg-gray-100 border-transparent rounded-lg py-3 pr-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
