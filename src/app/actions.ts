"use server";

import { antiBotProtection } from "@/ai/flows/anti-bot-protection";

export async function checkBotScore(actions: string[]) {
  try {
    const result = await antiBotProtection({
      userActions: actions,
      timestamp: Date.now(),
      // In a real app, you would get the user's IP address from the request.
      ipAddress: "127.0.0.1",
    });
    return result;
  } catch (error) {
    console.error("Error checking bot score:", error);
    return {
      botScore: 0,
      explanation: "Error analyzing behavior.",
    };
  }
}
