import groq from "@/lib/groq";
import { disasterConfig, type DisasterType } from "@/data/disasters";

function isDisasterType(value: unknown): value is DisasterType {
  return typeof value === "string" && value in disasterConfig;
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);
    const disasterType = (body as { disasterType?: unknown } | null)?.disasterType;

    if (!isDisasterType(disasterType)) {
      return Response.json({ error: "Invalid disasterType" }, { status: 400 });
    }

    const d = disasterConfig[disasterType];
    const model = "llama-3.3-70b-versatile";

    const prompt = [
      `You are ReliefAI, a disaster response situation analyst.`,
      `Generate a concise, operational situation summary (2-4 sentences).`,
      `Focus on: immediate risks, bottlenecks, priority actions, and near-term forecast.`,
      ``,
      `Disaster: ${d.name}`,
      `Alert: ${d.alertText}`,
      `Stats: SOS=${d.stats.sos}, Critical=${d.stats.critical}, Hospitals=${d.stats.hospitals}, Volunteers=${d.stats.volunteers}`,
      `SOS Alerts: ${d.sosAlerts.map((a) => `[${a.priority}] ${a.msg}`).join(" | ")}`,
      `Resources: ${d.resources.map((r) => `${r.name}=${r.status} (${r.units}, ${r.percent}%)`).join(" | ")}`,
      ``,
      `Return only plain text.`,
    ].join("\n");

    const systemInstruction =
      "You produce crisp emergency ops summaries. Avoid fluff. Use clear numbers and urgent next steps when appropriate.";

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const summary = completion.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return Response.json({ error: "No summary returned" }, { status: 502 });
    }

    return Response.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
