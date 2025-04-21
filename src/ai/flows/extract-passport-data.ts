'use server';
/**
 * @fileOverview Passport data extraction AI agent.
 *
 * - extractPassportData - A function that handles the passport data extraction process.
 * - ExtractPassportDataInput - The input type for the extractPassportData function.
 * - ExtractPassportDataOutput - The return type for the extractPassportData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractPassportDataInputSchema = z.object({
  type: z.enum(['image', 'pdf']).describe('The type of the document.'),
  data: z.string().describe('The URL of the passport image or the data of the PDF.'),
});

export type ExtractPassportDataInput = z.infer<typeof ExtractPassportDataInputSchema>;

const ExtractPassportDataOutputSchema = z.object({
  fullName: z.string().describe('The full name of the passport holder.'),
  passportNumber: z.string().describe('The passport number.'),
  dateOfBirth: z.string().describe('The date of birth of the passport holder.'),
  dateOfExpiry: z.string().describe('The date of expiry of the passport.'),
  issuingCountry: z.string().describe('The issuing country of the passport.'),
  verificationMethod: z.string().describe('The method used to extract data (OCR or PDF parsing).')
});
export type ExtractPassportDataOutput = z.infer<typeof ExtractPassportDataOutputSchema>;

export async function extractPassportData(input: ExtractPassportDataInput): Promise<ExtractPassportDataOutput> {
  return extractPassportDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPassportDataPrompt',
  input: {
    schema: z.object({
      type: z.enum(['image', 'pdf']).describe('The type of the document.'),
      data: z.string().describe('The URL of the passport image or the data of the PDF.'),
    }),
  },
  output: {
    schema: z.object({
      fullName: z.string().describe('The full name of the passport holder.'),
      passportNumber: z.string().describe('The passport number.'),
      dateOfBirth: z.string().describe('The date of birth of the passport holder.'),
      dateOfExpiry: z.string().describe('The date of expiry of the passport.'),
      issuingCountry: z.string().describe('The issuing country of the passport.'),
    }),
  },
  prompt: `You are an expert in extracting data from passports. Please extract the following information from the passport. If you can't find a specific field, return "N/A".

Full Name: The full name of the passport holder.
Passport Number: The passport number.
Date of Birth: The date of birth of the passport holder.
Date of Expiry: The date of expiry of the passport.
Issuing Country: The issuing country of the passport.

Passport Data: {{data}}

Return the information in JSON format.
`,
});

const extractPassportDataFlow = ai.defineFlow<
  typeof ExtractPassportDataInputSchema,
  typeof ExtractPassportDataOutputSchema
>({
  name: 'extractPassportDataFlow',
  inputSchema: ExtractPassportDataInputSchema,
  outputSchema: ExtractPassportDataOutputSchema,
}, async input => {
  const {output} = await prompt(input);

  // Determine verification method
  const verificationMethod = input.type === 'pdf' ? 'PDF parsing' : 'OCR';

  return {
    ...output!,
    verificationMethod,
  };
});
