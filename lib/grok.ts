import OpenAI from "openai";

const grok = new OpenAI({
  // Avoid build-time crashes when env isn't set.
  // Requests will still fail at runtime unless GROK_API_KEY is configured.
  apiKey: process.env.GROK_API_KEY ?? "MISSING_GROK_API_KEY",
  baseURL: "https://api.x.ai/v1",
});

export default grok;
