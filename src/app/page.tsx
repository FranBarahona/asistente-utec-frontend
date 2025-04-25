
"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';

const aiResponses = [
  "Hello! How can I assist you today?",
  "That's an interesting question. Let me think...",
  "I'm sorry, I don't have information on that topic.",
  "Could you please provide more details?",
  "Thank you for your input!",
  "I agree with you."
];

function getRandomResponse() {
  return aiResponses[Math.floor(Math.random() * aiResponses.length)];
}

interface Message {
  text: string;
  isUser: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim() !== '') {
      const userMessage = { text: input, isUser: true };
      const aiMessage = { text: getRandomResponse(), isUser: false };

      setMessages([...messages, userMessage, aiMessage]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-3 rounded-lg ${
              message.isUser
                ? 'bg-accent text-primary-foreground self-end'
                : 'bg-secondary text-foreground self-start'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="p-4 flex items-center">
        <Input
          type="text"
          placeholder="Type your message..."
          className="flex-grow mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        <Button onClick={handleSendMessage} aria-label="Send message">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
