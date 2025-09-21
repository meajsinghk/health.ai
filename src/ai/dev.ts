import { config } from 'dotenv';
config();

import '@/ai/flows/answer-health-questions.ts';
import '@/ai/flows/generate-initial-health-advice.ts';
import '@/ai/flows/summarize-chat-message-history.ts';
import '@/ai/flows/get-anam-session-token.ts';
import '@/ai/flows/generate-anam-initial-message.ts';
import '@/ai/tools/update-health-data.ts';
