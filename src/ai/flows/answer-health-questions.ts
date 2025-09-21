'use server';

/**
 * @fileOverview A health question answering AI agent.
 *
 * - answerHealthQuestions - A function that answers health-related questions.
 * - AnswerHealthQuestionsInput - The input type for the answerHealthQuestions function.
 * - AnswerHealthQuestionsOutput - The return type for the answerHealthQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getHealthData } from '@/lib/health-data';
import {
  deleteHealthRecord,
  logExercise,
  logInsulin,
  logMedication,
  updateHealthRecord,
  updateSleepLog,
} from '@/ai/tools/update-health-data';
import { revalidatePath } from 'next/cache';

const AnswerHealthQuestionsInputSchema = z.object({
  question: z.string().describe('The health-related question to answer.'),
});
export type AnswerHealthQuestionsInput = z.infer<
  typeof AnswerHealthQuestionsInputSchema
>;

const AnswerHealthQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the health-related question.'),
});
export type AnswerHealthQuestionsOutput = z.infer<
  typeof AnswerHealthQuestionsOutputSchema
>;

const AnswerHealthQuestionsWithContextInputSchema = AnswerHealthQuestionsInputSchema.extend({
  healthData: z.string().describe('A JSON string of the user\'s health data.'),
});

export async function answerHealthQuestions(
  input: AnswerHealthQuestionsInput
): Promise<AnswerHealthQuestionsOutput> {
  return answerHealthQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerHealthQuestionsPrompt',
  input: {schema: AnswerHealthQuestionsWithContextInputSchema},
  output: {schema: AnswerHealthQuestionsOutputSchema},
  tools: [
    logExercise,
    logInsulin,
    logMedication,
    updateSleepLog,
    updateHealthRecord,
    deleteHealthRecord,
  ],
  prompt: `You are a helpful AI health assistant. You will answer health-related questions, give wellness tips, or ask clarifying questions. Be concise.

You have access to the user's health data and a set of tools to modify it. Use this data to answer questions. If the user asks to log, add, update, or delete data, use the provided tools.
- For time-based entries, if the user doesn't specify a time, assume the current time.
- The user's request to log data is an implicit instruction to use the tools.
- After using a tool, confirm to the user that the data has been logged, updated, or deleted.

User's Health Data (JSON):
{{{healthData}}}

Question: {{{question}}}`,
});

const answerHealthQuestionsFlow = ai.defineFlow(
  {
    name: 'answerHealthQuestionsFlow',
    inputSchema: AnswerHealthQuestionsInputSchema,
    outputSchema: AnswerHealthQuestionsOutputSchema,
  },
  async input => {
    const healthData = await getHealthData();
    const healthDataString = JSON.stringify(healthData, null, 2);

    const {output} = await prompt(
      {
        question: input.question,
        healthData: healthDataString,
      },
      {
        hooks: {
          onToolCallEnd: async (calls) => {
            // Revalidate the path if a tool was used to modify data.
            if (calls.length > 0) {
                revalidatePath('/records');
            }
          }
        }
      }
    );
    return output!;
  }
);
