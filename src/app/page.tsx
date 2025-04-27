
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { ScrollArea } from "@/components/ui/scroll-area";


interface Message {
  text: string;
  isUser: boolean;
  isTyping?: boolean; // Add optional isTyping property
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for the bottom of the messages

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const typeText = (text: string, callback: (finalText: string) => void) => {
    let i = 0;
    let currentTypedText = '';
    setIsTyping(true);
    // Add a placeholder message for the AI while typing
    setMessages(prev => [...prev, { text: '', isUser: false, isTyping: true }]);

    const intervalId = setInterval(() => {
      if (i < text.length) {
        currentTypedText += text[i];
        // Update the last message (the placeholder) with the currently typed text
        setMessages(prev => {
           const newMessages = [...prev];
           if (newMessages.length > 0 && newMessages[newMessages.length - 1].isTyping) {
             newMessages[newMessages.length - 1].text = currentTypedText + '...'; // Add ellipsis while typing
           }
           return newMessages;
        });
        i++;
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
        // Update the last message with the final text and remove the typing indicator
        setMessages(prev => {
          const newMessages = [...prev];
           if (newMessages.length > 0 && newMessages[newMessages.length - 1].isTyping) {
             newMessages[newMessages.length - 1].text = currentTypedText;
             delete newMessages[newMessages.length - 1].isTyping; // Remove typing flag
           }
           return newMessages;
        });
        callback(currentTypedText); // Callback with the final text if needed
      }
    }, 50); // typing speed, adjust as needed
  };

  const handleSendMessage = async () => {
    if (input.trim() !== '' && !isTyping) {
      const userMessageText = input;
      const userMessage = { text: userMessageText, isUser: true };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      try {
        // Construct the URL with the query parameter
        const apiUrl = `http://localhost:8000/document/ask?query=${encodeURIComponent(userMessageText)}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponseText = data.message; // Extract message from response

        if (!aiResponseText) {
            throw new Error("Invalid response format from API");
        }

        // Start typing animation for the AI response
        typeText(aiResponseText, (finalText) => {
          // The state is already updated within typeText
          console.log("AI response finished typing:", finalText);
        });

      } catch (error) {
        console.error("Error fetching AI response:", error);
        toast({
          title: "Error",
          description: "Failed to get response from AI. Please try again.",
          variant: "destructive",
        });
        // Remove the user message if the AI fails to respond? Optional.
        // setMessages(prev => prev.slice(0, -1));
      }
    }
  };


  const handleMicrosoftLogin = () => {
    // Simulate Microsoft OAuth flow
    toast({
      title: "Microsoft Login",
      description: "Simulating Microsoft OAuth flow...",
    });
    // In a real app, you would redirect to Microsoft's OAuth endpoint
    // and handle the callback.
  };

  const MicrosoftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.57 3H2.01001C1.27501 3 0.700012 3.79 0.700012 4.53V12H11.57V3Z" fill="#f25022"/>
      <path d="M23.3 3H12.43V12H23.3C23.7 12 24 11.71 24 11.27V4.53C24 3.79 23.72 3 23.3 3Z" fill="#7fba00"/>
      <path d="M11.57 21V12.8H0.700012V19.47C0.700012 20.21 1.28001 21 2.01001 21H11.57Z" fill="#00a4ef"/>
      <path d="M23.3 21H12.43V12.8H24V19.47C24 20.21 23.7 21 23.3 21Z" fill="#ffb900"/>
     </svg>
  );


  return (
    <SidebarProvider>
       <Toaster /> {/* Add Toaster component here */}
      <div className="flex h-screen w-screen bg-background">
        <Sidebar>
          <SidebarContent>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Login</h2>
              <Button onClick={handleMicrosoftLogin} aria-label="Login with Microsoft">
                <MicrosoftIcon />
                <span className="ml-2">Login with Microsoft</span>
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow items-center justify-center p-4">
          <div className="flex flex-col w-full max-w-2xl h-full border rounded-lg shadow-md bg-card">
            {/* Header */}
            <div className="flex items-center p-4 border-b">
              <SidebarTrigger className="mr-2 md:hidden" /> {/* Show trigger only on small screens */}
              <h1 className="text-xl font-bold">Chat utec</h1>
            </div>

            {/* Message List */}
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                 {messages.map((message, index) => (
                   <div
                     key={index}
                     className={`flex ${
                       message.isUser ? 'justify-end' : 'justify-start'
                     }`}
                   >
                     <div
                       className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                         message.isUser
                           ? 'bg-primary text-primary-foreground' // Use primary for user
                           : 'bg-secondary text-secondary-foreground' // Use secondary for AI
                       } ${message.isTyping ? 'italic text-muted-foreground' : ''}`}
                     >
                       {message.text || <span className="animate-pulse">...</span>}{/* Show pulse if text is empty during typing */}
                     </div>
                   </div>
                 ))}
                 {/* Invisible div to track the bottom */}
                  <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex items-center p-4 border-t">
              <Input
                type="text"
                placeholder="Type your message..."
                className="flex-grow mr-2"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent newline on Enter
                    handleSendMessage();
                  }
                }}
                disabled={isTyping} // Disable input while AI is typing
              />
              <Button onClick={handleSendMessage} aria-label="Send message" disabled={isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
