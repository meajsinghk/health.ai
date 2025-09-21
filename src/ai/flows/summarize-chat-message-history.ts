'use server';
/**
 * @fileOverview Summarizes the chat message history for the user.
 *
 * - summarizeChatMessageHistory - A function that summarizes the chat message history.
 * - SummarizeChatMessageHistoryInput - The input type for the summarizeChatMessageHistory function.
 * - SummarizeChatMessageHistoryOutput - The return type for the summarizeChatMessageHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeChatMessageHistoryInputSchema = z.object({
  chatHistory: z.string().describe('The complete chat history to summarize.'),
});
export type SummarizeChatMessageHistoryInput = z.infer<
  typeof SummarizeChatMessageHistoryInputSchema
>;

const SummarizeChatMessageHistoryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chat history.'),
});
export type SummarizeChatMessageHistoryOutput = z.infer<
  typeof SummarizeChatMessageHistoryOutputSchema
>;

export async function summarizeChatMessageHistory(
  input: SummarizeChatMessageHistoryInput
): Promise<SummarizeChatMessageHistoryOutput> {
  return summarizeChatMessageHistoryFlow(input);
}

const summarizeChatMessageHistoryFlow = ai.defineFlow(
  {
    name: 'summarizeChatMessageHistoryFlow',
    inputSchema: SummarizeChatMessageHistoryInputSchema,
    outputSchema: SummarizeChatMessageHistoryOutputSchema,
  },
  async input => {
    return {
      summary: "First commit"
    };
  }
);
