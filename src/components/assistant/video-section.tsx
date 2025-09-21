
"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, AlertTriangle } from "lucide-react";
import { createClient } from "@anam-ai/js-sdk";
import type { AnamClient } from "@anam-ai/js-sdk";
import { getAnamInitialMessage, getAnamSessionToken } from "@/app/actions";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function VideoSection() {
  const anamClientRef = useRef<AnamClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  const giaPersonaImage = PlaceHolderImages.find(p => p.id === 'gia-persona');

  useEffect(() => {
    async function initializeClient() {
      if (anamClientRef.current) return;
      setIsInitializing(true);
      setInitializationError(null);
      try {
        const { sessionToken, error } = await getAnamSessionToken();
        if (sessionToken) {
          const client = createClient(sessionToken);
          anamClientRef.current = client;
          setIsReady(true);
        } else {
          console.error("Failed to get Anam session token:", error);
          setInitializationError(
            `Failed to initialize assistant. Please check your Anam AI plan and API key. Details: ${error}`
          );
          setIsReady(false);
        }
      } catch (error: any) {
        console.error("Error initializing Anam client:", error);
        setInitializationError(
          `An unexpected error occurred: ${error.message || "Unknown error"}`
        );
        setIsReady(false);
      } finally {
        setIsInitializing(false);
      }
    }
    initializeClient();
  }, []);

  const handleTogglePlay = async () => {
    const client = anamClientRef.current;
    if (!client || !isReady) return;

    if (isPlaying) {
      await client.stopStreaming();
      setIsPlaying(false);
    } else {
      setIsInitializing(true);
      try {
        if (!sessionStarted) {
          await client.startSession();
          setSessionStarted(true);
        }
        await client.streamToVideoElement("anam-video");
        const { message } = await getAnamInitialMessage();
        await client.talk(message);
        setIsPlaying(true);
      } catch (error) {
        console.error("Error during talk:", error);
        // Reset session on failure
        setSessionStarted(false);
      } finally {
        setIsInitializing(false);
      }
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-grow flex flex-col items-center justify-end p-6 pb-11">
        <div className="flex-grow" />
        <div className="relative aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-lg shadow-lg group">
          <video
            id="anam-video"
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          ></video>
           <div className="absolute inset-0 flex items-center justify-center bg-card/50">
              {isInitializing ? (
                <div className="flex items-center gap-2 text-white">
                    <span className="w-3 h-3 bg-primary rounded-full animate-pulse delay-0"></span>
                    <span className="w-3 h-3 bg-primary rounded-full animate-pulse delay-200"></span>
                    <span className="w-3 h-3 bg-primary rounded-full animate-pulse delay-400"></span>
                </div>
              ) : initializationError ? (
                <div className="flex flex-col items-center gap-4 text-center p-4">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                  <h3 className="font-semibold text-lg">Assistant Unavailable</h3>
                  <p className="text-sm text-destructive-foreground/80 max-w-sm">{initializationError}</p>
                </div>
              ) : (!isPlaying && giaPersonaImage) && (
                <Image
                  src={giaPersonaImage.imageUrl}
                  alt={giaPersonaImage.description}
                  fill
                  className="object-cover"
                  unoptimized
                  data-ai-hint={giaPersonaImage.imageHint}
                />
              )}
           </div>
          <div className="absolute inset-0 rounded-lg ring-2 ring-primary/50 group-hover:ring-primary transition-all animate-pulse duration-3000" />
        </div>
        <div className="h-20 flex-shrink-0 flex items-center justify-center backdrop-blur-sm">
          <Button
            size="icon"
            className="w-8 h-8 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={handleTogglePlay}
            disabled={!isReady || isInitializing || !!initializationError}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
