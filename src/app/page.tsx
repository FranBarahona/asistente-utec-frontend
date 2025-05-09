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
  if (/^[a-zA-Z]+\.[a-zA-Z]+@mail\.utec\.edu\.sv$/.test(email)) {
    return 'admin';
  }
  if (/^\d{8}@mail\.utec\.edu\.sv$/.test(email)) {
    return 'student';
  }
  return 'guest';
};

const MicrosoftIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.57 3H2.01001C1.27501 3 0.700012 3.79 0.700012 4.53V12H11.57V3Z" fill="#f25022" />
    <path d="M23.3 3H12.43V12H23.3C23.7 12 24 11.71 24 11.27V4.53C24 3.79 23.72 3 23.3 3Z" fill="#7fba00" />
    <path d="M11.57 21V12.8H0.700012V19.47C0.700012 20.21 1.28001 21 2.01001 21H11.57Z" fill="#00a4ef" />
    <path d="M23.3 21H12.43V12.8H24V19.47C24 20.21 23.7 21 23.3 21Z" fill="#ffb900" />
  </svg>
);

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  isTyping: boolean;
  isLoggedIn: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatInterfaceComponent: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  isTyping,
  isLoggedIn,
  onInputChange,
  onSendMessage,
  onInputKeyDown,
  scrollAreaRef,
  messagesEndRef
}) => {
  return (
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
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          disabled={isTyping || !isLoggedIn}
        />
        <Button onClick={onSendMessage} aria-label="Send message" disabled={isTyping || !isLoggedIn}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};


const AppContent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [currentView, setCurrentView] = useState<CurrentView>('chat');

  const sidebarContext = useSidebar();

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
          toast({
            title: "API Error",
            description: "API URL is not configured.",
            variant: "destructive",
          });
          setMessages(prev => [...prev, { text: 'Sorry, API is not configured.', isUser: false }]);
          setIsTyping(false); // Ensure typing indicator is turned off
          return;
        }
        const apiUrl = `${apiUrlBase}/document/ask?query=${encodeURIComponent(userMessageText)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
          throw new Error(errorData.message || `API request failed with status ${response.status}`);
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: "Error",
          description: `Failed to get response from AI: ${errorMessage}. Please try again.`,
          variant: "destructive",
        });
        setMessages(prev => [...prev, { text: `Sorry, I could not get a response. ${errorMessage}`, isUser: false }]);
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMicrosoftLogin = async () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      "",
      "MicrosoftLoginPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`
    );

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
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured.");
      }
      const response = await fetch(`${backendUrl}/microsoft/login`, { method: 'GET' });
      const data = await response.json();

      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error || "Login failed. No redirect URL received.");
      }

      popup.location.href = data.redirectUrl;

      const messageListener = (event: MessageEvent) => {
        // Ensure the message is from the expected origin (your backend that serves the success page)
        // This origin might need to be the same as your backendUrl or a specific success redirect URL origin
        // For now, let's assume it's the backendUrl or be more flexible if needed.
        // IMPORTANT: Ensure event.origin is validated properly in a production environment.
        // if (event.origin !== backendUrl) return; // Example validation, adjust if necessary

        if (event.data && (event.data.email || event.data.error)) {
            const { email, error } = event.data;
             window.removeEventListener("message", messageListener); // Clean up listener
            popup.close();


            if (error) {
                 toast({
                    title: "Login Failed",
                    description: error,
                    variant: "destructive",
                });
                return;
            }

            if (email) {
                setUserEmail(email);
                setIsLoggedIn(true);
                const role = determineUserRole(email);
                setUserRole(role);
                setCurrentView("chat");
                toast({
                    title: "Login Successful",
                    description: `Logged in as ${email} (${role})`,
                });
            }
        }
      };
      window.addEventListener("message", messageListener);

      // Fallback if popup closes without message (e.g., user closes it manually)
      const popupCloseCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCloseCheckInterval);
          window.removeEventListener("message", messageListener);
          // Check if already logged in by the message event to avoid double toast
          if (!isLoggedIn) { 
            toast({
              title: "Login Canceled",
              description: "Microsoft login window was closed.",
              variant: "default" 
            });
          }
        }
      }, 500);


    } catch (error) {
      console.error("Microsoft Login Error:", error);
      if(popup && !popup.closed) popup.close();
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
              <SidebarHeader className="items-center">
                {isLoggedIn && userEmail && (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Avatar className="h-12 w-12">
                      <AvatarImage data-ai-hint="user profile" src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${userEmail}`} alt={userEmail} />
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
        <Sidebar collapsible={sidebarContext?.isMobile ? "offcanvas" : "icon"}>
          <SidebarContent>
            <SidebarHeader className="items-center">
              {isLoggedIn && userEmail && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <Avatar className="h-12 w-12">
                    <AvatarImage data-ai-hint="user profile" src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${userEmail}`} alt={userEmail} />
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
          <div className="flex flex-col flex-grow items-center justify-center p-4 pt-16 md:pt-4 h-full">
            {currentView === 'chat' && (
              <ChatInterfaceComponent
                messages={messages}
                input={input}
                isTyping={isTyping}
                isLoggedIn={isLoggedIn}
                onInputChange={handleInputChange}
                onSendMessage={handleSendMessage}
                onInputKeyDown={handleInputKeyDown}
                scrollAreaRef={scrollAreaRef}
                messagesEndRef={messagesEndRef}
              />
            )}
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
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <AppContent />
    </SidebarProvider>
  );
}

