
import {
    deleteHealthRecord,
    logExercise,
    logInsulin,
    logMedication,
    updateHealthRecord,
    updateSleepLog,
  } from '@/ai/tools/update-health-data';
import { runTool } from 'genkit';
import { revalidatePath } from 'next/cache';
  import { NextRequest, NextResponse } from 'next/server';
  
  export async function POST(req: NextRequest) {
    try {
      const { tool, parameters } = await req.json();
  
      if (!tool) {
        return NextResponse.json({ error: `Tool not provided.` }, { status: 404 });
      }
  
      // Execute the tool using Genkit's runTool function.
      const result = await runTool(tool, parameters);

      // Revalidate the path to show updated records.
      revalidatePath('/records');
  
      return NextResponse.json({ result });
    } catch (error: any) {
      console.error('Error handling Anam tool request:', error);
      return NextResponse.json(
        { error: 'An internal error occurred.' },
        { status: 500 }
      );
    }
  }
