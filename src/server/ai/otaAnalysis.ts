import { anthropic } from "./anthropic";
import { jsonrepair } from "jsonrepair";

// ============================================================================
// OTA Analysis Types
// ============================================================================

export interface OtaAnalysisResult {
  summary: string;
  sections: {
    staffing: SectionItem[];
    financial: SectionItem[];
    regulatory: SectionItem[];
    operations: SectionItem[];
    timeline: SectionItem[];
    legal: SectionItem[];
  };
  risks: RiskItem[];
  compliance: ComplianceItem[];
  agreedVsOpen: {
    agreed: AgreementItem[];
    notAgreed: AgreementItem[];
    ambiguous: AgreementItem[];
  };
  operationalImpact: OperationalItem[];
  tokensUsed: number;
}

interface SectionItem {
  title: string;
  detail: string;
}

interface RiskItem {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
}

interface ComplianceItem {
  regulation: string;
  concern: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface AgreementItem {
  item: string;
  detail: string;
  reference?: string;
}

interface OperationalItem {
  area: string;
  term: string;
  impact: string;
  actionRequired: string;
}

// ============================================================================
// OTA Analysis Function
// ============================================================================

const SYSTEM_PROMPT = `You are a healthcare acquisition analyst. Analyze the OTA document and return ONLY a JSON object (no markdown, no explanation, just raw JSON).

Keep each field concise (1-2 sentences max). Return 2-4 items per section. Return this exact structure:

{"summary":"bullet points with \\u2022","sections":{"staffing":[{"title":"...","detail":"..."}],"financial":[{"title":"...","detail":"..."}],"regulatory":[{"title":"...","detail":"..."}],"operations":[{"title":"...","detail":"..."}],"timeline":[{"title":"...","detail":"..."}],"legal":[{"title":"...","detail":"..."}]},"risks":[{"title":"...","severity":"low|medium|high|critical","description":"...","recommendation":"..."}],"compliance":[{"regulation":"...","concern":"...","severity":"low|medium|high|critical"}],"agreedVsOpen":{"agreed":[{"item":"...","detail":"...","reference":"Section X"}],"notAgreed":[{"item":"...","detail":"..."}],"ambiguous":[{"item":"...","detail":"..."}]},"operationalImpact":[{"area":"...","term":"...","impact":"...","actionRequired":"..."}]}`;

export async function analyzeOta(
  extractedText: string,
): Promise<OtaAnalysisResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this OTA:\n\n${extractedText}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content returned from analysis.");
    }

    // Extract JSON from response
    let jsonText = textBlock.text.trim();

    // Strip markdown fences
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    // Extract between first { and last }
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }

    // Use jsonrepair to fix common LLM JSON issues (missing commas,
    // trailing commas, unquoted keys, etc.)
    jsonText = jsonrepair(jsonText);

    const parsed = JSON.parse(jsonText) as Omit<
      OtaAnalysisResult,
      "tokensUsed"
    >;
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    return { ...parsed, tokensUsed };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse OTA analysis JSON: ${error.message}`,
      );
    }
    if (error instanceof Error) {
      throw new Error(`OTA analysis failed: ${error.message}`);
    }
    throw new Error("OTA analysis failed with an unknown error.");
  }
}
