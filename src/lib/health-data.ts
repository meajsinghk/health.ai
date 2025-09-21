import fs from "fs/promises";
import path from "path";
import { unstable_noStore as noStore } from 'next/cache';

const dataPath = path.join(process.cwd(), "data", "health-data.json");

export type SleepData = {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?:string;
  friday?: string;
  saturday?: string;
  sunday?: string;
};

export type InsulinEntry = {
  id: string;
  time: string;
  dosage: string;
};

export type MedicationEntry = {
  id: string;
  name: string;
  time: string;
};

export type ExerciseEntry = {
  id: string;
  activity: string;
  duration: string;
  type?: string; // Keep for backwards compatibility
};

export type HealthData = {
  sleep?: SleepData;
  insulin?: InsulinEntry[];
  medication?: MedicationEntry[];
  exercise?: ExerciseEntry[];
};

export async function getHealthData(): Promise<HealthData> {
  noStore();
  try {
    const fileContent = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(fileContent) as HealthData;
  } catch (error: any) {
    // If the file doesn't exist (ENOENT), return a default empty state.
    if (error.code === 'ENOENT') {
        return { sleep: {}, insulin: [], medication: [], exercise: [] };
    }
    console.error("Error reading health data:", error);
    // For other errors, also return a default empty state.
    return { sleep: {}, insulin: [], medication: [], exercise: [] };
  }
}

export async function saveHealthData(data: HealthData): Promise<void> {
  try {
    // Ensure the directory exists.
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving health data:", error);
    throw error;
  }
}
