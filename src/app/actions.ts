"use server";

import {
  answerHealthQuestions,
  AnswerHealthQuestionsOutput,
} from "@/ai/flows/answer-health-questions";
import {
  generateInitialHealthAdvice,
  GenerateInitialHealthAdviceOutput,
} from "@/ai/flows/generate-initial-health-advice";
import {
    generateAnamInitialMessage,
    GenerateAnamInitialMessageOutput,
} from "@/ai/flows/generate-anam-initial-message";
import {
  getAnamSessionToken as getAnamSessionTokenFlow,
  GetAnamSessionTokenOutput,
} from "@/ai/flows/get-anam-session-token";
import {
  saveHealthData,
  getHealthData,
  SleepData,
  InsulinEntry,
  MedicationEntry,
  ExerciseEntry,
  HealthData,
} from "@/lib/health-data";
import { revalidatePath } from "next/cache";

export async function getInitialAdvice(): Promise<GenerateInitialHealthAdviceOutput> {
  try {
    const response = await generateInitialHealthAdvice({
      prompt: "I'm looking for some general health advice to get started.",
    });
    return response;
  } catch (e) {
    console.error(e);
    return { advice: "Hello! How can I help you with your health today?" };
  }
}

export async function submitUserMessage(
  userInput: string
): Promise<string> {
  try {
    const response: AnswerHealthQuestionsOutput = await answerHealthQuestions({
      question: userInput,
    });
    return response.answer;
  } catch (e) {
    console.error(e);
    return "I'm sorry, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

export async function getAnamSessionToken(): Promise<GetAnamSessionTokenOutput> {
  try {
    const response = await getAnamSessionTokenFlow();
    return response;
  } catch (e: any) {
    console.error("Error getting Anam session token:", e);
    return { sessionToken: null, error: e.message || "An unknown error occurred in actions." };
  }
}

export async function getAnamInitialMessage(): Promise<GenerateAnamInitialMessageOutput> {
    try {
        const response = await generateAnamInitialMessage();
        return response;
    } catch (e: any) {
        console.error("Error getting Anam initial message:", e);
        return { message: "Hello! I am your personal health assistant. How can I help you today?" };
    }
}

export async function saveSleepData(
  sleepData: SleepData
): Promise<{ success: boolean }> {
  try {
    const currentData = await getHealthData();
    const updatedData: HealthData = { ...currentData, sleep: sleepData };
    await saveHealthData(updatedData);
    revalidatePath("/records");
    return { success: true };
  } catch (error) {
    console.error("Failed to save sleep data:", error);
    return { success: false };
  }
}

export async function addInsulinEntry(
  entry: Omit<InsulinEntry, "id">
): Promise<{ success: boolean }> {
  try {
    const currentData = await getHealthData();
    const newEntry: InsulinEntry = { ...entry, id: crypto.randomUUID() };
    const updatedData: HealthData = {
      ...currentData,
      insulin: [...(currentData.insulin || []), newEntry],
    };
    await saveHealthData(updatedData);
    revalidatePath("/records");
    return { success: true };
  } catch (error) {
    console.error("Failed to add insulin entry:", error);
    return { success: false };
  }
}

export async function addMedicationEntry(
  entry: Omit<MedicationEntry, "id">
): Promise<{ success: boolean }> {
  try {
    const currentData = await getHealthData();
    const newEntry: MedicationEntry = { ...entry, id: crypto.randomUUID() };
    const updatedData: HealthData = {
      ...currentData,
      medication: [...(currentData.medication || []), newEntry],
    };
    await saveHealthData(updatedData);
    revalidatePath("/records");
    return { success: true };
  } catch (error) {
    console.error("Failed to add medication entry:", error);
    return { success: false };
  }
}

export async function addExerciseEntry(
  entry: Omit<ExerciseEntry, "id">
): Promise<{ success: boolean }> {
  try {
    const currentData = await getHealthData();
    const newEntry: ExerciseEntry = { ...entry, id: crypto.randomUUID() };
    const updatedData: HealthData = {
      ...currentData,
      exercise: [...(currentData.exercise || []), newEntry],
    };
    await saveHealthData(updatedData);
    revalidatePath("/records");
    return { success: true };
  } catch (error) {
    console.error("Failed to add exercise entry:", error);
    return { success: false };
  }
}

export async function getRecordsPageData(): Promise<HealthData> {
  return await getHealthData();
}
