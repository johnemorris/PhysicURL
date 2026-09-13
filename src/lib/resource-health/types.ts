import type { UrlHealthReason, UrlHealthResult } from '../url-health/index.ts';

export type ResourceReviewState = 'active' | 'under_review' | 'confirmed_broken';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface LegacyResourceStatus {
  status?: string;
  details?: string;
  checked?: string;
  httpStatus?: number | null;
  pageTitle?: string;
  underReview?: boolean;
  original?: Record<string, JsonValue>;
}

export interface ResourceHealthRecord {
  reviewState: ResourceReviewState;
  lastCheck?: UrlHealthResult;
  reviewConcern?: ResourceReviewConcern;
  consecutiveServerFailures: number;
  updatedAt?: string;
  legacy?: LegacyResourceStatus;
}

export interface ResourceReviewConcern {
  reason: UrlHealthReason;
  observedAt: string;
  summary: string;
  httpStatus?: number;
}

export type ResourceStatusMap = Record<string, ResourceHealthRecord>;

export interface ResourceHealthStats {
  active: number;
  underReview: number;
  confirmedBroken: number;
  checked: number;
}
