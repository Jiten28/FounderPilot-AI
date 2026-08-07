// Mirrors Architecture.md Section 4 (the canonical API contract) exactly.
// Field names/casing must match the backend's JSON — do not "prettify" them.

export type Stage = "Pre-seed" | "Seed" | "Series A" | "Growth";
export type RiskLevel = "Low" | "Medium" | "High";
export type Priority = "Immediate" | "High" | "Medium" | "Low";
export type Impact = "High" | "Medium" | "Low";

// ---------- 4.1 POST /analyze ----------

export interface StartupInput {
  startup_name: string;
  industry: string;
  revenue: number;
  expenses: number;
  employees: number;
  monthly_users: number;
  stage: Stage;
  funding_raised: number;
  problem_faced: string;
}

export interface ActionPlanItem {
  priority: Priority;
  task: string;
}

export interface AnalysisResult {
  analysis_id: string;
  health_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  funding_readiness_score: number;
  runway_months: number;
  business_summary: string;
  top_risks: string[];
  growth_opportunities: string[];
  recommended_kpis: string[];
  action_plan_30_days: ActionPlanItem[];
  created_at: string;
  ai_degraded?: boolean;
}

// ---------- 4.2 POST /chat ----------

export interface ChatRequest {
  analysis_id: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  analysis_id: string;
}

// ---------- 4.3 GET /metrics/{analysis_id} ----------

export interface MetricsResponse {
  labels: string[];
  revenue: number[];
  expenses: number[];
  burn: number[];
  users: number[];
  projected: boolean;
}

// ---------- 4.4 GET /recommendations/{analysis_id} ----------

export interface ExpandedRecommendation {
  title: string;
  detail: string;
  impact: Impact;
}

export interface RecommendationsResponse {
  analysis_id: string;
  expanded_recommendations: ExpandedRecommendation[];
}

// ---------- 4.5 Error envelope ----------

export interface ApiErrorEnvelope {
  error: true;
  code: "VALIDATION_ERROR" | "NOT_FOUND" | "AI_TIMEOUT" | "SERVER_ERROR";
  message: string;
}
