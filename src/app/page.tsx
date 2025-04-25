"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";

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
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Login</h2>
              <Input type="text" placeholder="Username" className="mb-2" />
              <Input type="password" placeholder="Password" className="mb-2" />
              <Button>Login</Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-grow p-4">
          <div className="flex items-center">
            <SidebarTrigger className="mr-2" />
            <h1 className="text-2xl font-bold">SimuChat</h1>
          </div>
          <div className="flex-grow overflow-y-auto">
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
          <div className="flex items-center">
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
      </div>
    </SidebarProvider>
  );
}
