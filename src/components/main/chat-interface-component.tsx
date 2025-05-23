'use client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id?: string;
  text: string;
  isUser: boolean;
  isTyping?: boolean;
}

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
  isLoading: boolean;
}

export const ChatInterfaceComponent: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  isTyping,
  isLoggedIn,
  onInputChange,
  onSendMessage,
  onInputKeyDown,
  scrollAreaRef,
  messagesEndRef,
  isLoading,
}) => {
  return (
    <div className="flex flex-col w-full max-w-2xl h-full border rounded-lg shadow-md bg-card">
      <div className="flex items-center p-4 border-b">
        <h1 className="text-xl font-bold text-center flex-grow">CHAT UTEC</h1>
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {!isLoggedIn && (
            <div className="text-center text-muted-foreground p-4">
              Inicia sesión para empezar a chatear.
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={message.id || `message-${index}`}
              className={`flex ${
                message.isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.isUser ? (
                  message.text
                ) : message.isTyping ? (
                  <div className="flex items-start">
                    {isLoading && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  >
                    {message.text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex items-center p-4 border-t">
        <Input
          type="text"
          placeholder={
            isLoggedIn ? 'Escribe tu mensaje...' : 'Conectarse al chat'
          }
          className="flex-grow mr-2"
          value={input}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          disabled={isTyping || !isLoggedIn}
        />
        <Button
          onClick={onSendMessage}
          aria-label="Enviar mensaje"
          disabled={isTyping || !isLoggedIn}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
