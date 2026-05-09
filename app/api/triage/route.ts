import groq from "@/lib/groq";
import { disasterConfig, type DisasterType } from "@/data/disasters";

type TriagePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE";

type TriageResponse = {
  priority: TriagePriority;
  reason: string;
  first_aid: [string, string, string] | string[];
  rescue_needed: boolean;
  hospital_needed: boolean;
  do_not_move: boolean;
};

function isDisasterType(value: unknown): value is DisasterType {
  return typeof value === "string" && value in disasterConfig;
}

function isPriority(value: unknown): value is TriagePriority {
  return value === "CRITICAL" || value === "HIGH" || value === "MEDIUM" || value === "STABLE";
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
  // naive but effective brace matching
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
}

function validateTriageResponse(value: unknown): TriageResponse | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;

  if (!isPriority(v.priority)) return null;
  if (typeof v.reason !== "string") return null;
  if (!Array.isArray(v.first_aid) || v.first_aid.length < 3) return null;
  if (typeof v.first_aid[0] !== "string" || typeof v.first_aid[1] !== "string" || typeof v.first_aid[2] !== "string") {
    return null;
  }
  if (typeof v.rescue_needed !== "boolean") return null;
  if (typeof v.hospital_needed !== "boolean") return null;
  if (typeof v.do_not_move !== "boolean") return null;

  return {
    priority: v.priority,
    reason: v.reason,
    first_aid: [v.first_aid[0], v.first_aid[1], v.first_aid[2]],
    rescue_needed: v.rescue_needed,
    hospital_needed: v.hospital_needed,
    do_not_move: v.do_not_move,
  };
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const disasterType = b.disasterType;
    if (!isDisasterType(disasterType)) {
      return Response.json({ error: "Invalid disasterType" }, { status: 400 });
    }

    const patientName = typeof b.patient_name === "string" ? b.patient_name.trim() : "";
    const symptoms = typeof b.symptoms === "string" ? b.symptoms.trim() : "";
    const injuryType = typeof b.injury_type === "string" ? b.injury_type.trim() : "";
    const age = typeof b.age === "number" ? b.age : Number(b.age);
    const trappedUnderDebris = Boolean(b.trapped_under_debris);
    const unstableStructureNearby = Boolean(b.unstable_structure_nearby);

    const vitals = (b.vitals && typeof b.vitals === "object" ? (b.vitals as Record<string, unknown>) : null) ?? null;
    const bloodPressure =
      vitals && typeof vitals.blood_pressure === "string" && vitals.blood_pressure.trim()
        ? vitals.blood_pressure.trim()
        : null;
    const pulse =
      vitals && typeof vitals.pulse === "number"
        ? vitals.pulse
        : vitals && typeof vitals.pulse === "string" && vitals.pulse.trim()
          ? Number(vitals.pulse)
          : null;

    if (!patientName || !symptoms || !injuryType || !Number.isFinite(age)) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const d = disasterConfig[disasterType];

    const systemPrompt =
      'You are an earthquake emergency triage AI. Analyze symptoms and respond ONLY in valid JSON with: priority (CRITICAL/HIGH/MEDIUM/STABLE), reason (string), first_aid (array of 3 strings), rescue_needed (boolean), hospital_needed (boolean), do_not_move (boolean). No extra text.';

    const userMsg = [
      `DisasterType: ${disasterType} (${d.name})`,
      `PatientName: ${patientName}`,
      `Age: ${age}`,
      `InjuryType: ${injuryType}`,
      `Symptoms: ${symptoms}`,
      `TrappedUnderDebris: ${trappedUnderDebris}`,
      `UnstableStructureNearby: ${unstableStructureNearby}`,
      `Vitals: blood_pressure=${bloodPressure ?? "unknown"}, pulse=${pulse ?? "unknown"}`,
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
      return Response.json({ error: "No triage output returned" }, { status: 502 });
    }

    const jsonText = extractFirstJsonObject(content);
    if (!jsonText) {
      return Response.json({ error: "Malformed triage output (no JSON found)" }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return Response.json({ error: "Malformed triage output (invalid JSON)" }, { status: 502 });
    }

    const validated = validateTriageResponse(parsed);
    if (!validated) {
      return Response.json({ error: "Malformed triage output (invalid shape)" }, { status: 502 });
    }

    return Response.json(validated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

