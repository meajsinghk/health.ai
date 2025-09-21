"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, HeartPulse, Send, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getAnamInitialMessage, submitUserMessage } from "@/app/actions";
import type { Message } from "@/lib/types";

export function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchInitialMessage() {
      setIsLoading(true);
      try {
        const initial = await getAnamInitialMessage();
        setMessages([
          { role: "assistant", content: initial.message, id: "initial" },
        ]);
      } catch (error) {
        console.error("Failed to fetch initial advice:", error);
        setMessages([
          {
            role: "assistant",
            content: "Hello! How can I help you with your health today?",
            id: "error-initial",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialMessage();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);
  

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      id: crypto.randomUUID(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await submitUserMessage(input);
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
        id: crypto.randomUUID(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        id: crypto.randomUUID(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="text-primary" />
          <span>Health Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-6 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-4",
                  message.role === "user" && "justify-end"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 border-2 border-primary">
                    <AvatarFallback className="bg-primary/20">
                      <HeartPulse className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm",
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary/90 text-primary-foreground"
                  )}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-4">
                <Avatar className="w-8 h-8 border-2 border-primary">
                  <AvatarFallback className="bg-primary/20">
                    <HeartPulse className="w-4 h-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-lg p-3 text-sm bg-muted flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-200"></span>
                    <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-400"></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleFormSubmit} className="flex w-full items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
