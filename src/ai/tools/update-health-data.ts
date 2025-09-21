'use server';
/**
 * @fileOverview Defines AI tools for updating user health data.
 */

import { ai } from '@/ai/genkit';
import {
  addExerciseEntry,
  addInsulinEntry,
  addMedicationEntry,
  saveSleepData,
} from '@/app/actions';
import { getHealthData, saveHealthData } from '@/lib/health-data';
import { z } from 'genkit';
import { format } from 'date-fns';

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

export const logExercise = ai.defineTool(
  {
    name: 'logExercise',
    description: 'Logs an exercise session or physical activity.',
    inputSchema: LogExerciseSchema,
    outputSchema: z.string(),
  },
  async ({ activity, duration }) => {
    await addExerciseEntry({ activity, duration });
    return `Logged ${duration} minutes of ${activity}.`;
  }
);

const LogInsulinSchema = z.object({
  dosage: z.string().describe('The number of insulin units.'),
  time: z
    .string()
    .optional()
    .describe(
      'The time of the dosage in HH:mm format. Defaults to now if not provided.'
    ),
});

export const logInsulin = ai.defineTool(
  {
    name: 'logInsulin',
    description: 'Logs an insulin dosage at a specific time.',
    inputSchema: LogInsulinSchema,
    outputSchema: z.string(),
  },
  async ({ dosage, time }) => {
    const entryTime = time || format(new Date(), 'HH:mm');
    await addInsulinEntry({ dosage, time: entryTime });
    return `Logged ${dosage} units of insulin at ${entryTime}.`;
  }
);

const LogMedicationSchema = z.object({
  name: z.string().describe('The name of the medication.'),
  time: z
    .string()
    .optional()
    .describe(
      'The time the medication was taken in HH:mm format. Defaults to now if not provided.'
    ),
});

export const logMedication = ai.defineTool(
  {
    name: 'logMedication',
    description: 'Logs a medication intake at a specific time.',
    inputSchema: LogMedicationSchema,
    outputSchema: z.string(),
  },
  async ({ name, time }) => {
    const entryTime = time || format(new Date(), 'HH:mm');
    await addMedicationEntry({ name, time: entryTime });
    return `Logged ${name} taken at ${entryTime}.`;
  }
);

const UpdateSleepLogSchema = z.object({
  day: daysOfWeek.describe('The day of the week to update.'),
  hours: z.string().describe('The number of hours the user slept.'),
});

export const updateSleepLog = ai.defineTool(
  {
    name: 'updateSleepLog',
    description: 'Updates the sleep log for a specific day of the week.',
    inputSchema: UpdateSleepLogSchema,
    outputSchema: z.string(),
  },
  async ({ day, hours }) => {
    const currentData = await getHealthData();
    const newSleepData = { ...currentData.sleep, [day]: hours };
    await saveSleepData(newSleepData);
    return `Sleep for ${day} updated to ${hours} hours.`;
  }
);

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

export const updateHealthRecord = ai.defineTool(
  {
    name: 'updateHealthRecord',
    description:
      "Updates an existing health record (insulin, medication, or exercise). This cannot be used for sleep data. For sleep, use updateSleepLog. Use the searchTerm to find the record to update. If multiple records are found, ask the user for clarification. If a time is provided in the user's query, use it to disambiguate.",
    inputSchema: UpdateHealthRecordSchema,
    outputSchema: z.string(),
  },
  async ({ recordType, searchTerm, updates }) => {
    if (recordType === 'sleep') {
      return "Cannot update sleep data with this tool. Use the 'updateSleepLog' tool instead.";
    }
    const healthData = await getHealthData();
    const recordList = healthData[recordType];

    if (!recordList || !Array.isArray(recordList)) {
      return `No records found for type: ${recordType}.`;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const foundRecords = recordList.filter(r => {
      const searchableValues = Object.values(r).map(val =>
        String(val).toLowerCase()
      );
      return searchableValues.some(val => val.includes(lowerCaseSearchTerm));
    });

    if (foundRecords.length === 0) {
      return `Record containing "${searchTerm}" not found in ${recordType} log.`;
    }

    if (foundRecords.length > 1) {
      const options = foundRecords
        .map(r => `ID: ${r.id}, Details: ${JSON.stringify(r)}`)
        .join('; ');
      return `Multiple records found for "${searchTerm}". Please be more specific. Options are: ${options}`;
    }

    const recordToUpdate = foundRecords[0];
    const recordIndex = recordList.findIndex(r => r.id === recordToUpdate.id);

    // @ts-ignore
    recordList[recordIndex] = { ...recordList[recordIndex], ...updates };

    await saveHealthData(healthData);
    return `Successfully updated ${recordType} record.`;
  }
);

const DeleteHealthRecordSchema = z.object({
  recordType: recordTypes.describe('The type of record to delete.'),
  id: z.string().describe('The ID of the record to delete.'),
});

export const deleteHealthRecord = ai.defineTool(
  {
    name: 'deleteHealthRecord',
    description:
      'Deletes a health record (insulin, medication, or exercise) based on its ID.',
    inputSchema: DeleteHealthRecordSchema,
    outputSchema: z.string(),
  },
  async ({ recordType, id }) => {
    if (recordType === 'sleep') {
      return 'Cannot delete sleep data with this tool.';
    }
    const healthData = await getHealthData();
    const recordList = healthData[recordType];

    if (!recordList || !Array.isArray(recordList)) {
      return `No records found for type: ${recordType}.`;
    }

    const initialLength = recordList.length;
    // @ts-ignore
    healthData[recordType] = recordList.filter(r => r.id !== id);

    if (healthData[recordType]?.length === initialLength) {
      return `Record with ID ${id} not found in ${recordType} log.`;
    }

    await saveHealthData(healthData);
    return `Successfully deleted record from ${recordType} log.`;
  }
);
