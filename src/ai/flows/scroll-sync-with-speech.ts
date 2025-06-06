
'use server';

/**
 * @fileOverview A teleprompter that automatically adjusts the scrolling speed based on speech.
 *
 * - scrollSyncWithSpeech - A function that handles the synchronization of scroll speed with speech.
 * - ScrollSyncWithSpeechInput - The input type for the scrollSyncWithSpeech function.
 * - ScrollSyncWithSpeechOutput - The return type for the scrollSyncWithSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScrollSyncWithSpeechInputSchema = z.object({
  scriptText: z.string().describe('The script text to be displayed in the teleprompter.'),
  audioDataUri: z
    .string()
    .describe(
      'The audio data URI of the presenter speaking, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  isAutoSyncEnabled: z.boolean().describe('Whether automatic scroll synchronization is enabled.'),
});
export type ScrollSyncWithSpeechInput = z.infer<typeof ScrollSyncWithSpeechInputSchema>;

const ScrollSyncWithSpeechOutputSchema = z.object({
  adjustedScrollSpeed: z
    .number()
    .describe('The adjusted scroll speed based on the presenter\'s speech.'),
  speechRate: z
    .number()
    .describe('The detected speech rate from the audio input.'),
});
export type ScrollSyncWithSpeechOutput = z.infer<typeof ScrollSyncWithSpeechOutputSchema>;

export async function scrollSyncWithSpeech(
  input: ScrollSyncWithSpeechInput
): Promise<ScrollSyncWithSpeechOutput> {
  return scrollSyncWithSpeechFlow(input);
}

const analyzeSpeechTool = ai.defineTool({
  name: 'analyzeSpeech',
  description: 'Analyzes the audio to determine the speech rate (words per minute).',
  inputSchema: z.object({
    audioDataUri: z
      .string()
      .describe(
        'The audio data URI of the presenter speaking, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
    scriptText: z.string().describe('The script to use as a reference.'),
  }),
  outputSchema: z.number().describe('The speech rate in words per minute.'),
  async resolve(input) {
    // TODO: Implement the audio analysis to determine speech rate.
    // This is a placeholder; replace with actual audio processing logic.
    console.log('Analyzing audio snippet for speech rate...'); // Avoid logging full data URI
    // console.log('Analyzing script...', input.scriptText);
    // Mock speech rate for testing.
    const mockSpeechRate = 150; // words per minute
    return mockSpeechRate;
  },
});

const scrollSyncWithSpeechPrompt = ai.definePrompt({
  name: 'scrollSyncWithSpeechPrompt',
  input: {schema: ScrollSyncWithSpeechInputSchema},
  output: {schema: ScrollSyncWithSpeechOutputSchema},
  tools: [analyzeSpeechTool],
  system: `You are an AI assistant that helps adjust the scroll speed of a teleprompter based on the presenter's speech.

  If 'isAutoSyncEnabled' is true:
  1. Use the 'analyzeSpeech' tool to analyze the provided audio (referenced by 'audioDataUri') and the 'scriptText' to determine the presenter's speech rate in words per minute.
  2. Based on the determined speech rate, calculate an appropriate 'adjustedScrollSpeed' for the teleprompter to match the presenter's pace.
  3. Set the 'speechRate' in the output to the value returned by the tool.

  If 'isAutoSyncEnabled' is false:
  1. Set 'adjustedScrollSpeed' to a default value of 50.
  2. Set 'speechRate' to 0.

  Provide the 'adjustedScrollSpeed' and 'speechRate' in the output according to these instructions.`,
  prompt: `The script text is:
{{{scriptText}}}

The 'audioDataUri' is available in the input for the 'analyzeSpeech' tool if needed.
The 'isAutoSyncEnabled' flag is: {{{isAutoSyncEnabled}}}.

Please follow the instructions in the system prompt to determine the 'adjustedScrollSpeed' and 'speechRate'.`
});

const scrollSyncWithSpeechFlow = ai.defineFlow(
  {
    name: 'scrollSyncWithSpeechFlow',
    inputSchema: ScrollSyncWithSpeechInputSchema,
    outputSchema: ScrollSyncWithSpeechOutputSchema,
  },
  async (input) => {
    const {output} = await scrollSyncWithSpeechPrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI model.');
    }
    return output;
  }
);
