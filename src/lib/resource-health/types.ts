import type { UrlHealthResult } from '../url-health/index.ts';

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
  consecutiveFailures: number;
  reviewDetails?: string;
  updatedAt?: string;
  legacy?: LegacyResourceStatus;
}

export type ResourceStatusMap = Record<string, ResourceHealthRecord>;

export interface ResourceHealthStats {
  active: number;
  underReview: number;
  confirmedBroken: number;
  checked: number;
}
