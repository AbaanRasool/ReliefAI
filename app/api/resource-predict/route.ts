import groq from "@/lib/groq";
import { disasterConfig, type DisasterType } from "@/data/disasters";

type ResourceInput = {
  name: string;
  units: number;
  percent: number;
  status: string;
};

type ResourcePredictResponse = {
  predictions: Array<{ resource: string; hoursRemaining: number; urgency: string }>;
  recommendation: string;
};

function isDisasterType(value: unknown): value is DisasterType {
  return typeof value === "string" && value in disasterConfig;
}

function isResourceInput(value: unknown): value is ResourceInput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.units === "number" &&
    typeof v.percent === "number" &&
    typeof v.status === "string"
  );
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const withoutFirst = trimmed.replace(/^```[a-zA-Z]*\n?/, "");
    return withoutFirst.replace(/```$/, "").trim();
  }
  return trimmed;
}

function extractFirstJsonObject(text: string): string | null {
  const s = stripCodeFences(text);
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
}

function validateResponse(value: unknown): ResourcePredictResponse | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.predictions)) return null;
  if (typeof v.recommendation !== "string") return null;

  const preds: ResourcePredictResponse["predictions"] = [];
  for (const p of v.predictions) {
    if (!p || typeof p !== "object") return null;
    const pr = p as Record<string, unknown>;
    if (typeof pr.resource !== "string") return null;
    if (typeof pr.hoursRemaining !== "number" || !Number.isFinite(pr.hoursRemaining)) return null;
    if (typeof pr.urgency !== "string") return null;
    preds.push({ resource: pr.resource, hoursRemaining: pr.hoursRemaining, urgency: pr.urgency });
  }

  return { predictions: preds, recommendation: v.recommendation };
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const disasterType = b.disasterType;
    const resources = b.resources;

    if (!isDisasterType(disasterType)) {
      return Response.json({ error: "Invalid disasterType" }, { status: 400 });
    }

    if (!Array.isArray(resources) || !resources.every(isResourceInput)) {
      return Response.json({ error: "Invalid resources array" }, { status: 400 });
    }

    const systemPrompt =
      'You are a disaster resource AI. Given these resource levels and disaster type, predict shortages. Respond ONLY in JSON: { predictions: [{resource, hoursRemaining, urgency}], recommendation: string }. No extra text.';

    const userMsg = [
      `DisasterType: ${disasterType} (${disasterConfig[disasterType].name})`,
      `Resources:`,
      ...resources.map((r) => `- ${r.name}: units=${r.units}, percent=${r.percent}, status=${r.status}`),
    ].join("\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json({ error: "No prediction output returned" }, { status: 502 });
    }

    const jsonText = extractFirstJsonObject(content);
    if (!jsonText) {
      return Response.json({ error: "Malformed prediction output (no JSON found)" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return Response.json({ error: "Malformed prediction output (invalid JSON)" }, { status: 502 });
    }

    const validated = validateResponse(parsed);
    if (!validated) {
      return Response.json({ error: "Malformed prediction output (invalid shape)" }, { status: 502 });
    }

    return Response.json(validated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

