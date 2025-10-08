'use server';

/**
 * @fileOverview An anti-bot protection flow that analyzes user behavior to identify bot-like patterns.
 *
 * - antiBotProtection - A function that analyzes user behavior and returns a bot score.
 * - AntiBotProtectionInput - The input type for the antiBotProtection function.
 * - AntiBotProtectionOutput - The return type for the antiBotProtection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AntiBotProtectionInputSchema = z.object({
  userActions: z
    .array(z.string())
    .describe('An array of user actions, e.g., [\'captcha solved\', \'ad viewed\', \'withdrawal requested\'].'),
  timestamp: z.number().describe('The timestamp of the user actions.'),
  ipAddress: z.string().describe('The IP address of the user.'),
});
export type AntiBotProtectionInput = z.infer<typeof AntiBotProtectionInputSchema>;

const AntiBotProtectionOutputSchema = z.object({
  botScore: z
    .number()
    .describe('A score between 0 and 1 indicating the likelihood of the user being a bot.'),
  explanation: z
    .string()
    .describe('An explanation of why the user is likely a bot, null if botScore is low.'),
});
export type AntiBotProtectionOutput = z.infer<typeof AntiBotProtectionOutputSchema>;

export async function antiBotProtection(input: AntiBotProtectionInput): Promise<AntiBotProtectionOutput> {
  return antiBotProtectionFlow(input);
}

const antiBotProtectionPrompt = ai.definePrompt({
  name: 'antiBotProtectionPrompt',
  input: {schema: AntiBotProtectionInputSchema},
  output: {schema: AntiBotProtectionOutputSchema},
  prompt: `You are an advanced bot detection system. You will analyze the user's actions, timestamp, and IP address to determine if the user is a bot.

  Based on your analysis, provide a botScore between 0 and 1. A score closer to 1 indicates a higher likelihood of the user being a bot.
  If the botScore is above 0.7, provide a detailed explanation of why the user is likely a bot.
  If the botScore is low, the explanation should be null.

  User Actions: {{{userActions}}}
  Timestamp: {{{timestamp}}}
  IP Address: {{{ipAddress}}}
  \nGive the output in JSON format.
  `,
});

const antiBotProtectionFlow = ai.defineFlow(
  {
    name: 'antiBotProtectionFlow',
    inputSchema: AntiBotProtectionInputSchema,
    outputSchema: AntiBotProtectionOutputSchema,
  },
  async input => {
    const {output} = await antiBotProtectionPrompt(input);
    return output!;
  }
);
