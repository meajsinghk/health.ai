import { ChatSection } from "@/components/assistant/chat-section";
import { VideoSection } from "@/components/assistant/video-section";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col lg:flex-row gap-8 p-4 md:p-8 overflow-hidden">
      <div className="lg:w-1/2 h-full">
        <VideoSection />
      </div>
      <div className="lg:w-1/2 h-full">
        <ChatSection />
      </div>
    </main>
  );
}
