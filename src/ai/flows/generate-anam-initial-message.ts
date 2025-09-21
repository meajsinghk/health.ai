'use server';

/**
 * @fileOverview Provides an initial message for the Anam persona based on health data.
 *
 * - generateAnamInitialMessage - A function that generates the initial message.
 * - GenerateAnamInitialMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getHealthData } from '@/lib/health-data';

const GenerateAnamInitialMessageOutputSchema = z.object({
  message: z.string().describe('The initial message for the Anam persona.'),
});
export type GenerateAnamInitialMessageOutput = z.infer<
  typeof GenerateAnamInitialMessageOutputSchema
>;

const GenerateAnamInitialMessageWithContextInputSchema = z.object({
    healthData: z.string().describe('A JSON string of the user\'s health data.'),
});


export async function generateAnamInitialMessage(): Promise<GenerateAnamInitialMessageOutput> {
  return generateAnamInitialMessageFlow();
}

const prompt = ai.definePrompt({
  name: 'generateAnamInitialMessagePrompt',
  input: {schema: GenerateAnamInitialMessageWithContextInputSchema},
  output: {schema: GenerateAnamInitialMessageOutputSchema},
  prompt: `You are a friendly AI health assistant.
Based on the user's health data, provide a very short, friendly, one-sentence greeting.
You can mention one data point to show you are aware of their logs, for example "I see you logged 8 hours of sleep, great job!".
If there is no data or the data is empty, just give a generic, friendly greeting.

User's Health Data (JSON):
{{{healthData}}}
`,
});

const generateAnamInitialMessageFlow = ai.defineFlow(
  {
    name: 'generateAnamInitialMessageFlow',
    outputSchema: GenerateAnamInitialMessageOutputSchema,
  },
  async () => {
    const healthData = await getHealthData();
    const healthDataString = JSON.stringify(healthData, null, 2);
    
    const {output} = await prompt({
      healthData: healthDataString,
    });
    return output!;
  }
);
