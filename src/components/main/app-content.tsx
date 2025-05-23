'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, MessageSquare, PanelLeft } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ManageDocuments from '@/components/manage-documents';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChatInterfaceComponent } from '@/components/main/chat-interface-component';

interface Message {
  id?: string;
  text: string;
  isUser: boolean;
  isTyping?: boolean;
}

interface ICurrentUser {
  email: string;
  name: string;
  roleId: number;
  microsoft_id: string;
}

enum EUserRole {
  ADMINISTRADOR = 1,
  DOCENTE = 2,
  ESTUDIANTE = 3,
}

type UserRole = 'administrador' | 'docente' | 'estudiante' | 'invitado';
type CurrentView = 'chat' | 'documents';

const determineUserRole = (userRolId: number | null): UserRole => {
  if (!userRolId) return 'invitado';
  if (userRolId === EUserRole.ADMINISTRADOR) return 'administrador';
  if (userRolId === EUserRole.DOCENTE) return 'docente';
  if (userRolId === EUserRole.ESTUDIANTE) return 'estudiante';

  return 'invitado';
};

const MicrosoftIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.57 3H2.01001C1.27501 3 0.700012 3.79 0.700012 4.53V12H11.57V3Z"
      fill="#f25022"
    />
    <path
      d="M23.3 3H12.43V12H23.3C23.7 12 24 11.71 24 11.27V4.53C24 3.79 23.72 3 23.3 3Z"
      fill="#7fba00"
    />
    <path
      d="M11.57 21V12.8H0.700012V19.47C0.700012 20.21 1.28001 21 2.01001 21H11.57Z"
      fill="#00a4ef"
    />
    <path
      d="M23.3 21H12.43V12.8H24V19.47C24 20.21 23.7 21 23.3 21Z"
      fill="#ffb900"
    />
  </svg>
);

export const AppContent: React.FC = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<ICurrentUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('invitado');
  const [currentView, setCurrentView] = useState<CurrentView>('chat');

  const sidebarContext = useSidebar();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      setIsLoggedIn(true);
      setUserRole(determineUserRole(currentUser?.roleId ?? null));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('userEmail', userEmail);
      setUserRole(determineUserRole(currentUser?.roleId ?? null));
    } else {
      localStorage.removeItem('userEmail');
      setUserRole('invitado');
    }
  }, [userEmail]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isHydrated) return null;

  const typeText = (text: string, callback: (finalText: string) => void) => {
    let i = 0;
    let currentTypedText = '';
    const initialMessageId = 'ai-typing-' + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: initialMessageId, text: '', isUser: false, isTyping: true },
    ]);

    const intervalId = setInterval(() => {
      if (i < text.length) {
        currentTypedText += text[i];
        setMessages((prev) => {
          const newMessages = [...prev];
          const typingMessageIndex = newMessages.findIndex(
            (msg) => msg.id === initialMessageId
          );
          if (typingMessageIndex !== -1) {
            newMessages[typingMessageIndex] = {
              ...newMessages[typingMessageIndex],
              text: currentTypedText + '...',
              isTyping: true,
            };
          }
          return newMessages;
        });
        i++;
      } else {
        clearInterval(intervalId);
        setMessages((prev) => {
          const newMessages = [...prev];
          const typingMessageIndex = newMessages.findIndex(
            (msg) => msg.id === initialMessageId
          );
          if (typingMessageIndex !== -1) {
            newMessages[typingMessageIndex] = {
              ...newMessages[typingMessageIndex],
              text: currentTypedText,
              isTyping: false,
            };
          }
          return newMessages;
        });
        setIsTyping(false);
        callback(currentTypedText);
      }
    }, 20);
  };

  const handleSendMessage = async () => {
    if (input.trim() !== '' && !isTyping && isLoggedIn) {
      const userMessageText = input;
      const userMessage = {
        text: userMessageText,
        isUser: true,
        id: 'user-' + Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');
      setIsTyping(true);

      try {
        setIsLoading(true);
        const apiUrlBase = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (!apiUrlBase) {
          toast({
            title: 'API Error',
            description: 'API URL is not configured.',
            variant: 'destructive',
          });
          setMessages((prev) => [
            ...prev,
            {
              id: 'error-' + Date.now(),
              text: 'Lo sentimos, la API no está configurada.',
              isUser: false,
            },
          ]);
          setIsTyping(false);
          return;
        }
        const apiUrl = `${apiUrlBase}/document/ask?query=${encodeURIComponent(
          userMessageText
        )}`;
        const response = await fetch(apiUrl, { credentials: 'include' });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({
              message: `API request failed with status ${response.status}`,
            }));
          throw new Error(
            errorData.message ||
              `API request failed with status ${response.status}`
          );
        }

        const data = await response.json();
        const aiResponseText = data?.message;

        if (typeof aiResponseText !== 'string') {
          console.error('Invalid response format from API:', data);
          throw new Error(
            'Invalid response format from API or message is not a string'
          );
        }
        typeText(aiResponseText, (finalText) => {
          console.log('AI response finished typing:', finalText);
        });
      } catch (error) {
        console.error('Error fetching AI response:', error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast({
          title: 'Error',
          description: `Failed to get response from AI: ${errorMessage}. Please try again.`,
          variant: 'destructive',
        });
        setMessages((prev) => [
          ...prev,
          {
            id: 'error-' + Date.now(),
            text: `Lo siento, no pude obtener respuesta. ${errorMessage}`,
            isUser: false,
            isTyping: false,
          },
        ]);
        setIsTyping(false);
      } finally {
        setIsLoading(false);
      }
    } else if (!isLoggedIn) {
      toast({
        title: 'Inicio de sesión requerido',
        description: 'Por favor, inicia sesión para enviar mensajes.',
        variant: 'default',
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
      '',
      'MicrosoftLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`
    );

    if (!popup) {
      toast({
        title: 'Popup bloqueado',
        description:
          'Por favor, permite las ventanas emergentes para iniciar sesión.',
        variant: 'destructive',
      });
      return;
    }
    popup.document.write(
      '<!DOCTYPE html><html><head><title>Logging in...</title><style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; } .loader { border: 8px solid #e0e0e0; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></head><body><div style="text-align:center;"><div class="loader"></div><p style="margin-top:20px; font-size:16px; color: #333;">Iniciando sesión con Microsoft... Por favor espera.</p></div></body></html>'
    );

    toast({
      title: 'Iniciando sesión',
      description: 'Espera mientras se inicia sesión con Microsoft...',
    });

    let messageProcessed = false; // Flag to track if a success or error message has been processed

    try {
      const apiLoginUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/microsoft/login`;
      const response = await fetch(apiLoginUrl, { method: 'GET' });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error de red o respuesta no JSON' }));
        throw new Error(
          errorData.error ||
            `Login initiation failed. Status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.redirectUrl) {
        throw new Error('Login failed. No redirect URL received from backend.');
      }

      popup.location.href = data.redirectUrl;

      const messageListener = (event: MessageEvent) => {
        if (event.data && (event.data.user || event.data.error)) {
          messageProcessed = true;
          const { error, user } = event.data;
          window.removeEventListener('message', messageListener);
          if (popup && !popup.closed) popup.close();

          if (error) {
            toast({
              title: 'Inicio de sesión fallido',
              description: error,
              variant: 'destructive',
            });
            return;
          }

          if (user) {
            setCurrentUser(user);
            setUserEmail(user.email);
            setIsLoggedIn(true);
            setCurrentView('chat');
            toast({
              title: 'Inicio de sesión exitoso',
              description: `Ha iniciado sesión como ${
                user.name || user.email
              } (${determineUserRole(user.email)})`,
            });
          }
        }
      };
      window.addEventListener('message', messageListener);

      const popupCloseCheckInterval = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(popupCloseCheckInterval);
          window.removeEventListener('message', messageListener);
          if (!messageProcessed) {
            toast({
              title: 'Inicio de sesión cancelado',
              description: 'Microsoft inicio de sesion ventana fue cerrada.',
              variant: 'default',
            });
          }
        }
      }, 500);
    } catch (error) {
      messageProcessed = true;
      console.error('Microsoft Login Error:', error);
      if (popup && !popup.closed) popup.close();
      toast({
        title: 'Inicia sesión fallido',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      if (popup && popup.closed && !messageProcessed) {
        toast({
          title: 'Inicio de sesión cancelado',
          description:
            'La ventana de inicio de sesión de Microsoft se cerró o no se recibió información.',
          variant: 'default',
        });
      }
    }
  };

  const handleLogin = () => {
    const width = 500;
    const height = 500;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      '/login',
      'LocalLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`
    );

    if (!popup) {
      toast({
        title: 'Popup bloqueado',
        description: 'Permite ventanas emergentes para iniciar sesión.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Iniciando sesión',
      description: 'Espera mientras se completa el login...',
    });

    let messageProcessed = false;

    const messageListener = (event: MessageEvent) => {
      if (event.data && (event.data.user || event.data.error)) {
        messageProcessed = true;
        window.removeEventListener('message', messageListener);
        if (popup && !popup.closed) popup.close();

        if (event.data.error) {
          toast({
            title: 'Error',
            description: event.data.error,
            variant: 'destructive',
          });
          return;
        }

        if (event.data.user) {
          setCurrentUser(event.data.user);
          setUserEmail(event.data.user.email);
          setIsLoggedIn(true);
          setCurrentView('chat');

          toast({
            title: 'Bienvenido',
            description: `Sesión iniciada como ${
              event.data.user.name || event.data.user.email
            }`,
          });
        }
      }
    };

    window.addEventListener('message', messageListener);

    const popupCheck = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupCheck);
        window.removeEventListener('message', messageListener);
        if (!messageProcessed) {
          toast({
            title: 'Cancelado',
            description: 'Se cerró la ventana sin iniciar sesión.',
          });
        }
      }
    }, 500);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setIsLoggedIn(false);
    setMessages([]);
    setCurrentView('chat');
    toast({
      title: 'Cierre de sesión',
      description: 'Has cerrado sesión exitosamente.',
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
          <Sheet
            open={sidebarContext.openMobile}
            onOpenChange={sidebarContext.setOpenMobile}
          >
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeft />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            >
              <SidebarHeader className="items-center">
                {isLoggedIn && userEmail && (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        data-ai-hint="user profile"
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${userEmail}`}
                        alt={userEmail}
                      />
                      <AvatarFallback>
                        {userEmail.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-center break-all px-2">
                      {userEmail}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {userRole}
                    </span>
                  </div>
                )}
              </SidebarHeader>
              <Separator className="my-2" />
              <SidebarMenu className="flex-grow">
                {isLoggedIn && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => {
                          setCurrentView('chat');
                          sidebarContext.setOpenMobile(false);
                        }}
                        isActive={currentView === 'chat'}
                        tooltip={{ children: 'Chat' }}
                      >
                        <MessageSquare />
                        <span>Chat</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {userRole === 'administrador' && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => {
                            setCurrentView('documents');
                            sidebarContext.setOpenMobile(false);
                          }}
                          isActive={currentView === 'documents'}
                          tooltip={{ children: 'Gestión de documentos' }}
                        >
                          <FileText />
                          <span>Gestion de documentos</span>
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
                      <SidebarMenuButton
                        onClick={handleLogout}
                        tooltip={{ children: 'Logout' }}
                      >
                        <LogOut />
                        <span>Cerrar sesión</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                ) : (
                  <Button
                    onClick={handleMicrosoftLogin}
                    aria-label="Inicia sesión con microsoft"
                    className="w-full"
                  >
                    <MicrosoftIcon />
                    <span className="ml-2">Inicia sesión con microsoft</span>
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
        <Sidebar
          collapsible={
            sidebarContext?.isMobile ? 'offcanvas' : sidebarContext?.collapsible
          }
        >
          <SidebarContent>
            <SidebarHeader className="items-center">
              {isLoggedIn && userEmail && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      data-ai-hint="user profile"
                      src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${userEmail}`}
                      alt={userEmail}
                    />
                    <AvatarFallback>
                      {userEmail.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-center break-all px-2">
                    {userEmail}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {userRole}
                  </span>
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
                      tooltip={{ children: 'Chat' }}
                    >
                      <MessageSquare />
                      <span>Chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {userRole === 'administrador' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => setCurrentView('documents')}
                        isActive={currentView === 'documents'}
                        tooltip={{ children: 'Manage Documents' }}
                      >
                        <FileText />
                        <span>Documentos</span>
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
                    <SidebarMenuButton
                      onClick={handleLogout}
                      tooltip={{ children: 'Logout' }}
                    >
                      <LogOut />
                      <span>Cerrar sesión</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              ) : (
                <div>
                  <Button
                    onClick={handleLogin}
                    aria-label="Inicia sesión con microsoft"
                    className="w-full mb-2"
                  >
                    <MicrosoftIcon />
                    <span className="ml-2">Inicia sesión </span>
                  </Button>

                  <Button
                    onClick={handleMicrosoftLogin}
                    aria-label="Inicia sesión con microsoft"
                    className="w-full"
                  >
                    <MicrosoftIcon />
                    <span className="ml-2">Inicia sesión con microsoft</span>
                  </Button>
                </div>
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
                isLoading={isLoading}
              />
            )}
            {currentView === 'documents' && userRole === 'administrador' && (
              <ManageDocuments />
            )}
            {currentView === 'documents' && userRole !== 'administrador' && (
              <div className="text-center text-destructive p-4">
                No tiene permiso para acceder a esta página.
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </>
  );
};
