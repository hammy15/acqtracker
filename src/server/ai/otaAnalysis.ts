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
// Tool definition for structured output (guarantees valid JSON)
// ============================================================================

const SECTION_ITEM = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const, description: "Title of this item" },
    detail: { type: "string" as const, description: "Detailed description" },
  },
  required: ["title", "detail"],
};

const OTA_ANALYSIS_TOOL = {
  name: "submit_ota_analysis",
  description:
    "Submit the structured OTA analysis results after reviewing the document.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string" as const,
        description:
          "Executive summary of the OTA's key terms in 3-5 bullet points using bullet character \u2022",
      },
      sections: {
        type: "object" as const,
        properties: {
          staffing: {
            type: "array" as const,
            items: SECTION_ITEM,
            description:
              "Employee retention, benefits, key personnel, unions, staffing ratios",
          },
          financial: {
            type: "array" as const,
            items: SECTION_ITEM,
            description:
              "Purchase price, working capital, AR/AP, escrow, indemnification",
          },
          regulatory: {
            type: "array" as const,
            items: SECTION_ITEM,
            description:
              "License transfers, CHOW, Medicare/Medicaid, survey compliance",
          },
          operations: {
            type: "array" as const,
            items: SECTION_ITEM,
            description:
              "Day-of-close, vendor contracts, IT, medical records, notifications",
          },
          timeline: {
            type: "array" as const,
            items: SECTION_ITEM,
            description:
              "Key dates, milestones, closing conditions, cure periods",
          },
          legal: {
            type: "array" as const,
            items: SECTION_ITEM,
            description:
              "Representations, indemnification, disputes, governing law, termination",
          },
        },
        required: [
          "staffing",
          "financial",
          "regulatory",
          "operations",
          "timeline",
          "legal",
        ],
      },
      risks: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            severity: {
              type: "string" as const,
              enum: ["low", "medium", "high", "critical"],
            },
            description: { type: "string" as const },
            recommendation: { type: "string" as const },
          },
          required: ["title", "severity", "description", "recommendation"],
        },
        description: "Identified risks with severity and recommendations",
      },
      compliance: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            regulation: {
              type: "string" as const,
              description: "Specific regulation (42 CFR, CMS, state, etc.)",
            },
            concern: { type: "string" as const },
            severity: {
              type: "string" as const,
              enum: ["low", "medium", "high", "critical"],
            },
          },
          required: ["regulation", "concern", "severity"],
        },
        description: "Regulatory compliance concerns",
      },
      agreedVsOpen: {
        type: "object" as const,
        properties: {
          agreed: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                item: { type: "string" as const },
                detail: { type: "string" as const },
                reference: { type: "string" as const },
              },
              required: ["item", "detail"],
            },
            description: "Items with definitive, agreed-upon language",
          },
          notAgreed: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                item: { type: "string" as const },
                detail: { type: "string" as const },
                reference: { type: "string" as const },
              },
              required: ["item", "detail"],
            },
            description: "Items missing or unresolved",
          },
          ambiguous: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                item: { type: "string" as const },
                detail: { type: "string" as const },
                reference: { type: "string" as const },
              },
              required: ["item", "detail"],
            },
            description: "Items with ambiguous language",
          },
        },
        required: ["agreed", "notAgreed", "ambiguous"],
      },
      operationalImpact: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            area: { type: "string" as const },
            term: { type: "string" as const },
            impact: { type: "string" as const },
            actionRequired: { type: "string" as const },
          },
          required: ["area", "term", "impact", "actionRequired"],
        },
        description: "Operational impact items with action required",
      },
    },
    required: [
      "summary",
      "sections",
      "risks",
      "compliance",
      "agreedVsOpen",
      "operationalImpact",
    ],
  },
};

// ============================================================================
// OTA Analysis Function
// ============================================================================

const SYSTEM_PROMPT = `You are a healthcare acquisition analyst specializing in Operations Transfer Agreements (OTAs) for skilled nursing facilities, assisted living facilities, and other healthcare operations.

You are analyzing an OTA document that governs the transfer of operations during a healthcare facility acquisition. Your job is to extract, categorize, and assess every significant term, obligation, and risk in the agreement.

Use the submit_ota_analysis tool to return your structured analysis.

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
      max_tokens: 16384,
      system: SYSTEM_PROMPT,
      tools: [OTA_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "submit_ota_analysis" },
      messages: [
        {
          role: "user",
          content: `Analyze the following Operations Transfer Agreement (OTA) document. Extract and categorize all significant terms, identify risks, flag compliance concerns, classify items as agreed/not agreed/ambiguous, and assess operational impact.\n\n--- BEGIN OTA DOCUMENT ---\n${extractedText}\n--- END OTA DOCUMENT ---`,
        },
      ],
    });

    // Extract tool_use block - guaranteed valid JSON
    const toolBlock = response.content.find(
      (block) => block.type === "tool_use",
    );
    if (!toolBlock || toolBlock.type !== "tool_use") {
      throw new Error("No tool_use block returned from Claude analysis.");
    }

    const parsed = toolBlock.input as Omit<OtaAnalysisResult, "tokensUsed">;
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;

    return {
      ...parsed,
      tokensUsed,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OTA analysis failed: ${error.message}`);
    }
    throw new Error("OTA analysis failed with an unknown error.");
  }
}
