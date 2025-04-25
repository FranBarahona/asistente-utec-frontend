"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

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
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const typeText = (text: string) => {
    return new Promise<void>(resolve => {
      let i = 0;
      setIsTyping(true);
      const intervalId = setInterval(() => {
        if (i < text.length) {
          setTypingText(prev => prev + text[i]);
          i++;
        } else {
          clearInterval(intervalId);
          setIsTyping(false);
          resolve();
        }
      }, 20); // typing speed, adjust as needed
    });
  };

  const handleSendMessage = async () => {
    if (input.trim() !== '') {
      const userMessage = { text: input, isUser: true };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      const aiResponse = getRandomResponse();
      setTypingText(''); // Clear the previous typing text
      await typeText(aiResponse); // Await the completion of typing

      const aiMessage = { text: typingText, isUser: false };
      setMessages(prevMessages => {
        // setMessages is asynchronous, we need to ensure we are adding the new message to the correct previous state.
        return [...prevMessages, aiMessage];
      });
    }
  };

  useEffect(() => {
    // This useEffect runs after typingText state is updated, ensuring it reflects the completed typed text.
    if (!isTyping && typingText !== '') {
      // This condition ensures that this effect runs only once after the typing animation is complete.
      setMessages(prevMessages => {
        // Find the last AI message
        const lastAiMessageIndex = prevMessages.findLastIndex(message => !message.isUser);
  
        // If there is a last AI message, update it, otherwise, return the previous messages unchanged.
        if (lastAiMessageIndex !== -1) {
          const newMessages = [...prevMessages];
          // Replace the content of the last AI message
          newMessages[lastAiMessageIndex] = { ...newMessages[lastAiMessageIndex], text: typingText };
          return newMessages;
        }
        // If there are no previous AI messages, return the previous messages unchanged. This is a safety net.
        return prevMessages;
      });
    }
  }, [isTyping, typingText]);

  const handleMicrosoftLogin = () => {
    // Simulate Microsoft OAuth flow
    toast({
      title: "Microsoft Login",
      description: "Simulating Microsoft OAuth flow...",
    });
  };

  const MicrosoftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3.731A.73.73 0 0 0 1.269 3v17.982a.73.73 0 0 0 .731.749h9.571a.73.73 0 0 0 .731-.731V3.731a.73.73 0 0 0-.731-.731H2ZM12.429 3.731A.73.73 0 0 0 11.7 3v9.982a.73.73 0 0 0 .731.731h9.571a.73.73 0 0 0 .731-.731V3.731a.73.73 0 0 0-.731-.731h-9.571ZM12.429 14.018a.73.73 0 0 0-1.731.713v6.25a.73.73 0 0 0 .731.731h9.571a.73.73 0 0 0 .731-.731v-6.25a.73.73 0 0 0-.731-.731h-9.571Z"/>
    </svg>
  );


  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Login</h2>
              <Button onClick={handleMicrosoftLogin} aria-label="Login with Microsoft">
                <MicrosoftIcon className="w-4 h-4 mr-2" />
                Login with Microsoft
              </Button>
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
