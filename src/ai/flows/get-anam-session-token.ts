
'use server';

/**
 * @fileOverview A flow to retrieve a session token from the Anam API.
 *
 * - getAnamSessionToken - A function that fetches the session token.
 * - GetAnamSessionTokenOutput - The return type for the getAnamSessionToken function.
 */

import { ai } from '@/ai/genkit';
import { getHealthData } from '@/lib/health-data';
import { z } from 'genkit';
import { zodToJsonSchema } from 'zod-to-json-schema';

const GetAnamSessionTokenOutputSchema = z.object({
  sessionToken: z.string().nullable(),
  error: z.string().nullable(),
});
export type GetAnamSessionTokenOutput = z.infer<
  typeof GetAnamSessionTokenOutputSchema
>;

const daysOfWeek = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

const recordTypes = z.enum(['sleep', 'insulin', 'medication', 'exercise']);

const LogExerciseSchema = z.object({
  activity: z
    .string()
    .describe('The type of activity (e.g., Running, Yoga, Hiking).'),
  duration: z.string().describe('The duration of the exercise in minutes.'),
});

const LogInsulinSchema = z.object({
  dosage: z.string().describe('The number of insulin units.'),
  time: z
    .string()
    .optional()
    .describe(
      'The time of the dosage in HH:mm format. Defaults to now if not provided.'
    ),
});

const LogMedicationSchema = z.object({
  name: z.string().describe('The name of the medication.'),
  time: z
    .string()
    .optional()
    .describe(
      'The time the medication was taken in HH:mm format. Defaults to now if not provided.'
    ),
});

const UpdateSleepLogSchema = z.object({
  day: daysOfWeek.describe('The day of the week to update.'),
  hours: z.string().describe('The number of hours the user slept.'),
});

const UpdateHealthRecordSchema = z.object({
  recordType: recordTypes.describe('The type of record to update.'),
  searchTerm: z
    .string()
    .describe(
      'The term to search for in the record to identify it (e.g., "aspirin", "basketball", "10 units").'
    ),
  updates: z
    .object({
      time: z.string().optional(),
      dosage: z.string().optional(),
      name: z.string().optional(),
      activity: z.string().optional(),
      duration: z.string().optional(),
    })
    .describe('The fields and new values to update.'),
});

const DeleteHealthRecordSchema = z.object({
  recordType: recordTypes.describe('The type of record to delete.'),
  id: z.string().describe('The ID of the record to delete.'),
});

export async function getAnamSessionToken(): Promise<GetAnamSessionTokenOutput> {
  return getAnamSessionTokenFlow();
}

const getAnamSessionTokenFlow = ai.defineFlow(
  {
    name: 'getAnamSessionTokenFlow',
    outputSchema: GetAnamSessionTokenOutputSchema,
  },
  async () => {
    const anamApiKey = process.env.ANAM_API_KEY;
    if (!anamApiKey || anamApiKey === 'your_anam_api_key_here') {
      const error = 'ANAM_API_KEY is not set.';
      console.error(error);
      return { sessionToken: null, error };
    }
    const anamyToolHandlerUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/anam-tool` : 'http://localhost:9002/api/anam-tool';

    try {
      const healthData = await getHealthData();
      const healthDataString = JSON.stringify(healthData, null, 2);

      const response = await fetch('https://api.anam.ai/v1/auth/session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anamApiKey}`,
        },
        body: JSON.stringify({
          personaConfig: {
            name: "Health Assistant",
            avatarId: "6dbc1e47-7768-403e-878a-94d7fcc3677b",
            voiceId: "6bfbe25a-979d-40f3-a92b-5394170af54b",
            llmId: "0934d97d-0c3a-4f33-91b0-5e136a0ef466",
            systemPrompt: `You are a friendly AI health assistant. You have access to the user's health data and a set of tools to modify it. Use this data to provide personalized health insights and answer questions about their health patterns. If the user asks to log, add, update, or delete data, use the provided tools. After using a tool, confirm to the user that the data has been logged, updated, or deleted.

User's Health Data: ${healthDataString}
`,
            tools: [
              {
                name: 'logExercise',
                description: 'Logs an exercise session or physical activity.',
                httpHandler: {
                  url: anamyToolHandlerUrl,
                },
                parameters: zodToJsonSchema(LogExerciseSchema),
              },
              {
                name: 'logInsulin',
                description: 'Logs an insulin dosage at a specific time.',
                httpHandler: {
                  url: anamyToolHandlerUrl,
                },
                parameters: zodToJsonSchema(LogInsulinSchema),
              },
              {
                name: 'logMedication',
                description: 'Logs a medication intake at a specific time.',
                httpHandler: {
                  url: anamyToolHandlerUrl,
                },
                parameters: zodToJsonSchema(LogMedicationSchema),
              },
              {
                name: 'updateSleepLog',
                description: 'Updates the sleep log for a specific day of the week.',
                httpHandler: {
                  url: anamyToolHandlerUrl,
                },
                parameters: zodToJsonSchema(UpdateSleepLogSchema),
              },
              {
                name: 'updateHealthRecord',
                description: "Updates an existing health record (insulin, medication, or exercise). This cannot be used for sleep data. For sleep, use updateSleepLog. Use the searchTerm to find the record to update. If multiple records are found, ask the user for clarification. If a time is provided in the user's query, use it to disambiguate.",
                httpHandler: {
                  url: anamyToolHandlerUrl,
                },
                parameters: zodToJsonSchema(UpdateHealthRecordSchema),
              },
              {
                name: 'deleteHealthRecord',
                description: 'Deletes a health record (insulin, medication, or exercise) based on its ID.',
                httpHandler: {
                  url: anamyToolHandlerUrl,
                },
                parameters: zodToJsonSchema(DeleteHealthRecordSchema),
              },
            ]
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Anam API request failed with status ${response.status}: ${errorBody}`
        );
        return { sessionToken: null, error: errorBody };
      }

      const { sessionToken } = await response.json();
      return { sessionToken, error: null };
    } catch (error: any) {
      console.error('Error fetching Anam session token:', error);
      return { sessionToken: null, error: error.message || 'An unknown error occurred.' };
    }
  }
);
