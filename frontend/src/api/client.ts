import type {
  StartupInput,
  AnalysisResult,
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  MetricsResponse,
  RecommendationsResponse,
  WhatIfResponse,
  CompetitorAnalysisResponse,
  ApiErrorEnvelope,
} from "../types/api";

// Never hardcode localhost:8000 in committed code — always read from env.
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  code: ApiErrorEnvelope["code"];
  constructor(code: ApiErrorEnvelope["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    // Network failure (backend down, cold-starting on Render, CORS, etc.)
    throw new ApiError(
      "SERVER_ERROR",
      "Couldn't reach the FounderPilot AI server. It may be waking up from sleep — please try again in a few seconds."
    );
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // no/invalid JSON body
  }

  if (!response.ok) {
    const envelope = body as Partial<ApiErrorEnvelope> | null;
    throw new ApiError(
      envelope?.code ?? "SERVER_ERROR",
      envelope?.message ?? `Request failed with status ${response.status}.`
    );
  }

  return body as TResponse;
}

export function analyzeStartup(input: StartupInput): Promise<AnalysisResult> {
  return request<AnalysisResult>("/analyze", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAnalysis(analysisId: string): Promise<AnalysisResult> {
  return request<AnalysisResult>(`/analyze/${analysisId}`, { method: "GET" });
}

export function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function getMetrics(analysisId: string): Promise<MetricsResponse> {
  return request<MetricsResponse>(`/metrics/${analysisId}`, { method: "GET" });
}

export function getRecommendations(
  analysisId: string
): Promise<RecommendationsResponse> {
  return request<RecommendationsResponse>(`/recommendations/${analysisId}`, {
    method: "GET",
  });
}

export function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>("/health", { method: "GET" });
}

export function getChatHistory(analysisId: string): Promise<ChatHistoryResponse> {
  return request<ChatHistoryResponse>(`/chat/${analysisId}/history`, { method: "GET" });
}

// Stateless recompute for the what-if sliders — same StartupInput shape as
// /analyze, just re-scored against edited numbers, no AI call.
export function whatIf(input: StartupInput): Promise<WhatIfResponse> {
  return request<WhatIfResponse>("/whatif", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Competitor Snapshot — real peer companies + AI positioning narrative.
export function getCompetitors(analysisId: string): Promise<CompetitorAnalysisResponse> {
  return request<CompetitorAnalysisResponse>(`/competitors/${analysisId}`, {
    method: "GET",
  });
}