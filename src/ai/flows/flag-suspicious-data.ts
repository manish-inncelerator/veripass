// FlagSuspiciousData story
'use server';
/**
 * @fileOverview Flags suspicious data in a passport.
 *
 * This file defines a Genkit flow that uses an LLM to determine if extracted
 * passport data is suspicious.
 *
 * @remarks
 * - flagSuspiciousData - A function that flags suspicious data.
 * - FlagSuspiciousDataInput - The input type for the flagSuspiciousData function.
 * - FlagSuspiciousDataOutput - The return type for the flagSuspiciousData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const FlagSuspiciousDataInputSchema = z.object({
  field: z.string().describe('The name of the passport field being validated.'),
  value: z.string().describe('The value of the passport field.'),
  knownFormats: z.string().describe('The known formats for this field.'),
  ocrConfidence: z.number().describe('The OCR confidence score for the extracted value (0-1).'),
});
export type FlagSuspiciousDataInput = z.infer<typeof FlagSuspiciousDataInputSchema>;

const FlagSuspiciousDataOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether the data is suspicious.'),
  reason: z.string().describe('The reason why the data is suspicious.'),
});
export type FlagSuspiciousDataOutput = z.infer<typeof FlagSuspiciousDataOutputSchema>;

export async function flagSuspiciousData(input: FlagSuspiciousDataInput): Promise<FlagSuspiciousDataOutput> {
  return flagSuspiciousDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'flagSuspiciousDataPrompt',
  input: {
    schema: z.object({
      field: z.string().describe('The name of the passport field being validated.'),
      value: z.string().describe('The value of the passport field.'),
      knownFormats: z.string().describe('The known formats for this field.'),
      ocrConfidence: z.number().describe('The OCR confidence score for the extracted value (0-1).'),
    }),
  },
  output: {
    schema: z.object({
      isSuspicious: z.boolean().describe('Whether the data is suspicious.'),
      reason: z.string().describe('The reason why the data is suspicious.'),
    }),
  },
  prompt: `You are an expert in passport validation.  You will determine if a given field value in a passport is suspicious, based on the field name, the value, known formats for that field, and the OCR confidence score.

Field: {{{field}}}
Value: {{{value}}}
Known Formats: {{{knownFormats}}}
OCR Confidence: {{{ocrConfidence}}}

Consider these factors when determining suspicion:
- Does the value match the known formats?
- Is the OCR confidence score low?
- Does the value contain unusual characters or patterns for this field?

Return true if the data is suspicious, and false otherwise.  Provide a brief reason for your determination.
`,
});

const flagSuspiciousDataFlow = ai.defineFlow<
  typeof FlagSuspiciousDataInputSchema,
  typeof FlagSuspiciousDataOutputSchema
>(
  {
    name: 'flagSuspiciousDataFlow',
    inputSchema: FlagSuspiciousDataInputSchema,
    outputSchema: FlagSuspiciousDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
