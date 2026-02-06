import { anthropic } from "./anthropic";

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

const SYSTEM_PROMPT = `You are a healthcare acquisition analyst specializing in Operations Transfer Agreements (OTAs) for skilled nursing facilities, assisted living facilities, and other healthcare operations.

You are analyzing an OTA document that governs the transfer of operations during a healthcare facility acquisition. Your job is to extract, categorize, and assess every significant term, obligation, and risk in the agreement.

You MUST return a valid JSON object with the following structure (no markdown, no code fences, just raw JSON):

{
  "summary": "A concise executive summary of the OTA's key terms in 3-5 bullet points, using bullet character \u2022",
  "sections": {
    "staffing": [{"title": "...", "detail": "..."}],
    "financial": [{"title": "...", "detail": "..."}],
    "regulatory": [{"title": "...", "detail": "..."}],
    "operations": [{"title": "...", "detail": "..."}],
    "timeline": [{"title": "...", "detail": "..."}],
    "legal": [{"title": "...", "detail": "..."}]
  },
  "risks": [{"title": "...", "severity": "low|medium|high|critical", "description": "...", "recommendation": "..."}],
  "compliance": [{"regulation": "...", "concern": "...", "severity": "low|medium|high|critical"}],
  "agreedVsOpen": {
    "agreed": [{"item": "...", "detail": "...", "reference": "Section X.X"}],
    "notAgreed": [{"item": "...", "detail": "...", "reference": "Section X.X"}],
    "ambiguous": [{"item": "...", "detail": "...", "reference": "Section X.X"}]
  },
  "operationalImpact": [{"area": "...", "term": "...", "impact": "...", "actionRequired": "..."}]
}

Guidelines:
- **Staffing**: Employee retention, benefits continuation, key personnel, union obligations, staffing ratios, training requirements
- **Financial**: Purchase price adjustments, working capital, accounts receivable/payable, pro-rations, escrow, indemnification caps
- **Regulatory**: License transfers, CHOW filings, Medicare/Medicaid provider agreements, state survey compliance, deficiency resolution
- **Operations**: Day-of-close procedures, vendor contracts, supply chain, IT systems, medical records transfer, resident/patient notifications
- **Timeline**: Key dates, milestones, closing conditions, post-close obligations, cure periods, notice periods
- **Legal**: Representations & warranties, indemnification, dispute resolution, governing law, termination rights, confidentiality

For risks, be specific about what could go wrong and provide actionable recommendations.
For compliance, cite specific regulations (42 CFR, state-specific requirements, CMS guidelines, etc.).
For agreed vs. open items, classify based on whether the language is definitive, missing/unresolved, or ambiguous.
For operational impact, focus on what the acquiring operator needs to do and when.`;

export async function analyzeOta(
  extractedText: string,
): Promise<OtaAnalysisResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze the following Operations Transfer Agreement (OTA) document. Extract and categorize all significant terms, identify risks, flag compliance concerns, classify items as agreed/not agreed/ambiguous, and assess operational impact.\n\n--- BEGIN OTA DOCUMENT ---\n${extractedText}\n--- END OTA DOCUMENT ---`,
        },
      ],
    });

    // Extract text content from the response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error(
        "No text content returned from Claude analysis response.",
      );
    }

    // Parse the JSON response - strip any markdown code fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Extract JSON object between first { and last }
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    // Fix common JSON issues: trailing commas before } or ]
    jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");

    let parsed: Omit<OtaAnalysisResult, "tokensUsed">;
    try {
      parsed = JSON.parse(jsonText);
    } catch (firstError) {
      // If initial parse fails, try more aggressive cleaning
      // Remove single-line comments
      jsonText = jsonText.replace(/\/\/[^\n]*/g, "");
      // Remove multi-line comments
      jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, "");
      // Fix trailing commas again after comment removal
      jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");
      parsed = JSON.parse(jsonText);
    }

    // Calculate tokens used
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    return {
      ...parsed,
      tokensUsed,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse OTA analysis response as JSON: ${error.message}`,
      );
    }
    if (error instanceof Error) {
      throw new Error(`OTA analysis failed: ${error.message}`);
    }
    throw new Error("OTA analysis failed with an unknown error.");
  }
}
