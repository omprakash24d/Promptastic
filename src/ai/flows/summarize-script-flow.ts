
'use server';
/**
 * @fileOverview A script summarization AI agent.
 *
 * - summarizeScript - A function that handles script summarization.
 * - SummarizeScriptInput - The input type for the summarizeScript function.
 * - SummarizeScriptOutput - The return type for the summarizeScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeScriptInputSchema = z.object({
  scriptText: z.string().describe('The full text of the script to be summarized.'),
});
export type SummarizeScriptInput = z.infer<typeof SummarizeScriptInputSchema>;

const SummarizeScriptOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided script text.'),
});
export type SummarizeScriptOutput = z.infer<typeof SummarizeScriptOutputSchema>;

export async function summarizeScript(input: SummarizeScriptInput): Promise<SummarizeScriptOutput> {
  return summarizeScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeScriptPrompt',
  input: {schema: SummarizeScriptInputSchema},
  output: {schema: SummarizeScriptOutputSchema},
  prompt: `You are an expert summarizer. Please provide a concise summary of the following script text.
Focus on the main points and key takeaways.

Script Text:
{{{scriptText}}}

Return only the summary.`,
});

const summarizeScriptFlow = ai.defineFlow(
  {
    name: 'summarizeScriptFlow',
    inputSchema: SummarizeScriptInputSchema,
    outputSchema: SummarizeScriptOutputSchema,
  },
  async (input) => {
    if (!input.scriptText.trim()) {
        return { summary: "The script is empty, so no summary can be generated." };
    }
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a summary from the AI model.');
    }
    return output;
  }
);
