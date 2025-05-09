
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogOut, FileText, MessageSquare, PanelLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ManageDocuments from '@/components/manage-documents';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface Message {
  text: string;
  isUser: boolean;
  isTyping?: boolean;
}

type UserRole = 'admin' | 'student' | 'guest';
type CurrentView = 'chat' | 'documents';

// Helper function to determine user role based on email
const determineUserRole = (email: string | null): UserRole => {
  if (!email) return 'guest';
  // Admin pattern: name.lastname@mail.utec.edu.sv
  if (/^[a-zA-Z]+\.[a-zA-Z]+@mail\.utec\.edu\.sv$/.test(email)) {
    return 'admin';
  }
  // Student pattern: 8digits@mail.utec.edu.sv
  if (/^\d{8}@mail\.utec\.edu\.sv$/.test(email)) {
    return 'student';
  }
  return 'guest'; // Default to guest if no pattern matches
};

// New component to hold the main application content and structure
const AppContent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication and Role State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [currentView, setCurrentView] = useState<CurrentView>('chat'); // Default view

  // Get sidebar context - NOW SAFE TO CALL HERE
  const sidebarContext = useSidebar();

  // Update role whenever email changes
  useEffect(() => {
    setUserRole(determineUserRole(userEmail));
  }, [userEmail]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typeText = (text: string, callback: (finalText: string) => void) => {
    let i = 0;
    let currentTypedText = '';
    setIsTyping(true);
    setMessages(prev => [...prev, { text: '', isUser: false, isTyping: true }]);

    const intervalId = setInterval(() => {
      if (i < text.length) {
        currentTypedText += text[i];
        setMessages(prev => {
          const newMessages = [...prev];
          const typingMessageIndex = newMessages.findLastIndex(m => m.isTyping && !m.isUser);
          if (typingMessageIndex !== -1) {
            newMessages[typingMessageIndex] = { ...newMessages[typingMessageIndex], text: currentTypedText + '...' };
          }
          return newMessages;
        });
        i++;
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
        setMessages(prev => {
          const newMessages = [...prev];
          const typingMessageIndex = newMessages.findLastIndex(m => m.isTyping && !m.isUser);
          if (typingMessageIndex !== -1) {
            newMessages[typingMessageIndex] = { ...newMessages[typingMessageIndex], text: currentTypedText, isTyping: false };
          }
          return newMessages;
        });
        callback(currentTypedText);
      }
    }, 50);
  };


  const handleSendMessage = async () => {
    if (input.trim() !== '' && !isTyping && isLoggedIn) {
      const userMessageText = input;
      const userMessage = { text: userMessageText, isUser: true };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      try {
        const apiUrlBase = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!apiUrlBase) {
          throw new Error("API URL is not configured in environment variables.");
        }
        const apiUrl = `${apiUrlBase}/document/ask?query=${encodeURIComponent(userMessageText)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const aiResponseText = data?.message;

        if (typeof aiResponseText !== 'string') {
          console.error("Invalid response format from API:", data);
          throw new Error("Invalid response format from API or message is not a string");
        }

        typeText(aiResponseText, (finalText) => {
          console.log("AI response finished typing:", finalText);
        });

      } catch (error) {
        console.error("Error fetching AI response:", error);
        toast({
          title: "Error",
          description: `Failed to get response from AI: ${error instanceof Error ? error.message : String(error)}. Please try again.`,
          variant: "destructive",
        });
        setMessages(prev => [...prev, { text: 'Sorry, I could not get a response.', isUser: false }]);
        setIsTyping(false);
      }
    } else if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to start chatting.",
        variant: "default",
      });
    }
  };

  const handleMicrosoftLogin = async () => {
    // Abre inmediatamente el popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const popup = window.open(
        "",
        "MicrosoftLoginPopup",
        `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`
      );
    
    // const popup = window.open("", "MicrosoftLoginPopup", "width=600,height=700");

    if (!popup) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Microsoft Login",
      description: "Waiting for Microsoft OAuth...",
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/microsoft/login`, { method: 'GET' });
      const data = await response.json();

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error || "Login failed. No redirect URL received.");
      }

      // Redirige el popup a la URL recibida
      popup.location.href = data.redirectUrl;
     

      // Escucha el mensaje del popup (cuando cierre y envíe los datos)
      window.addEventListener("message", (event) => {
        console.log("🚀 ~ window.addEventListener ~ event:", event)
        if (event.origin !== process.env.NEXT_PUBLIC_BACKEND_URL) return;

        const { email, error } = event.data;
        if (error) {
          throw new Error(error);
        }

        setUserEmail(email);
        setIsLoggedIn(true);
        const role = determineUserRole(email);
        setUserRole(role);
        setCurrentView("chat");

        toast({
          title: "Login Successful",
          description: `Logged in as ${email} (${role})`,
        });

        popup.close();
      });

    } catch (error) {
      console.error("Microsoft Login Error:", error);
      popup.close();
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setUserEmail(null);
    setIsLoggedIn(false);
    setUserRole('guest');
    setMessages([]);
    setCurrentView('chat');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    if (sidebarContext?.isMobile && sidebarContext?.openMobile) {
      sidebarContext?.setOpenMobile(false);
    }
  };

  const MicrosoftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.57 3H2.01001C1.27501 3 0.700012 3.79 0.700012 4.53V12H11.57V3Z" fill="#f25022" />
      <path d="M23.3 3H12.43V12H23.3C23.7 12 24 11.71 24 11.27V4.53C24 3.79 23.72 3 23.3 3Z" fill="#7fba00" />
      <path d="M11.57 21V12.8H0.700012V19.47C0.700012 20.21 1.28001 21 2.01001 21H11.57Z" fill="#00a4ef" />
      <path d="M23.3 21H12.43V12.8H24V19.47C24 20.21 23.7 21 23.3 21Z" fill="#ffb900" />
    </svg>
  );

  const ChatInterface = () => (
    <div className="flex flex-col w-full max-w-2xl h-full border rounded-lg shadow-md bg-card">
      <div className="flex items-center p-4 border-b">
        <h1 className="text-xl font-bold text-center flex-grow">Chat Utec</h1>
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {!isLoggedIn && (
            <div className="text-center text-muted-foreground p-4">
              Please log in to start chatting.
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'
                }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                  } ${message.isTyping ? 'italic text-muted-foreground animate-pulse' : ''}`}
              >
                {message.text || (message.isTyping ? '...' : '')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex items-center p-4 border-t">
        <Input
          type="text"
          placeholder={isLoggedIn ? "Type your message..." : "Log in to chat"}
          className="flex-grow mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isTyping || !isLoggedIn}
        />
        <Button onClick={handleSendMessage} aria-label="Send message" disabled={isTyping || !isLoggedIn}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Toaster />
      <div className="fixed top-4 left-4 z-20">
        {sidebarContext?.isMobile ? (
          <Sheet open={sidebarContext.openMobile} onOpenChange={sidebarContext.setOpenMobile}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeft />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
              {/* Mobile sidebar content is duplicated here for SheetContent */}
              <SidebarHeader className="items-center">
                {isLoggedIn && userEmail && (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${userEmail}`} alt={userEmail} />
                      <AvatarFallback>{userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-center break-all px-2">{userEmail}</span>
                    <span className="text-xs text-muted-foreground">{userRole}</span>
                  </div>
                )}
              </SidebarHeader>
              <Separator className="my-2" />
              <SidebarMenu className="flex-grow">
                {isLoggedIn && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => { setCurrentView('chat'); sidebarContext.setOpenMobile(false); }}
                        isActive={currentView === 'chat'}
                        tooltip={{ children: "Chat" }}
                      >
                        <MessageSquare />
                        <span>Chat</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {userRole === 'admin' && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => { setCurrentView('documents'); sidebarContext.setOpenMobile(false); }}
                          isActive={currentView === 'documents'}
                          tooltip={{ children: "Manage Documents" }}
                        >
                          <FileText />
                          <span>Manage Documents</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </>
                )}
              </SidebarMenu>
              <Separator className="my-2" />
              <SidebarFooter>
                {isLoggedIn ? (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} tooltip={{ children: "Logout" }}>
                        <LogOut />
                        <span>Logout</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                ) : (
                  <Button onClick={handleMicrosoftLogin} aria-label="Login with Microsoft" className="w-full">
                    <MicrosoftIcon />
                    <span className="ml-2">Login with Microsoft</span>
                  </Button>
                )}
              </SidebarFooter>
            </SheetContent>
          </Sheet>
        ) : (
          <SidebarTrigger />
        )}
      </div>

      <div className="flex h-screen w-screen bg-background">
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarHeader className="items-center">
              {isLoggedIn && userEmail && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${userEmail}`} alt={userEmail} />
                    <AvatarFallback>{userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-center break-all px-2">{userEmail}</span>
                  <span className="text-xs text-muted-foreground">{userRole}</span>
                </div>
              )}
            </SidebarHeader>
            <Separator className="my-2" />
            <SidebarMenu className="flex-grow">
              {isLoggedIn && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setCurrentView('chat')}
                      isActive={currentView === 'chat'}
                      tooltip={{ children: "Chat" }}
                    >
                      <MessageSquare />
                      <span>Chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {userRole === 'admin' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setCurrentView('documents')}
                        isActive={currentView === 'documents'}
                        tooltip={{ children: "Manage Documents" }}
                      >
                        <FileText />
                        <span>Manage Documents</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
            <Separator className="my-2" />
            <SidebarFooter>
              {isLoggedIn ? (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip={{ children: "Logout" }}>
                      <LogOut />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              ) : (
                <Button onClick={handleMicrosoftLogin} aria-label="Login with Microsoft" className="w-full">
                  <MicrosoftIcon />
                  <span className="ml-2">Login with Microsoft</span>
                </Button>
              )}
            </SidebarFooter>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <div className="flex flex-col flex-grow items-center justify-center p-4 pt-16 h-full">
            {currentView === 'chat' && <ChatInterface />}
            {currentView === 'documents' && userRole === 'admin' && <ManageDocuments />}
            {currentView === 'documents' && userRole !== 'admin' && (
              <div className="text-center text-destructive p-4">
                You do not have permission to access this page.
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </>
  );
};

export default function Home() {
  return (
    <SidebarProvider defaultOpen={false} collapsible="offcanvas">
      <AppContent />
    </SidebarProvider>
  );
}

