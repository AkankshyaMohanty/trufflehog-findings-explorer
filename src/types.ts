export type Severity = "Critical" | "High" | "Medium" | "Low";
export type TriageStatus =
  | "Open"
  | "Investigating"
  | "False Positive"
  | "Accepted Risk"
  | "Resolved";

export interface Finding {
  id: string;
  detector: string;
  rawDetector?: string;
  repo: string;
  file: string;
  branch: string;
  verified: boolean;
  valuePreview: string;
  fingerprint: string;
  severity: Severity;
  status: TriageStatus;
  note: string;
  source: string;
  occurrences: number;
  firstSeen?: string;
  lastSeen?: string;
  likelyFalsePositive: boolean;
  falsePositiveReason?: string;
}

export interface RawTruffleHogFinding {
  DetectorName?: string;
  DetectorType?: number;
  Verified?: boolean;
  Raw?: string;
  RawV2?: string;
  Redacted?: string;
  SourceMetadata?: {
    Data?: {
      Git?: {
        file?: string;
        repository?: string;
        commit?: string;
        branch?: string;
        email?: string;
        timestamp?: string;
      };
      Github?: {
        file?: string;
        repository?: string;
        commit?: string;
        branch?: string;
      };
      Filesystem?: {
        file?: string;
        line?: number;
      };
      S3?: {
        bucket?: string;
        key?: string;
      };
      CloudWatch?: {
        logGroup?: string;
        logStream?: string;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export interface Filters {
  query: string;
  severity: "All" | Severity;
  status: "All" | TriageStatus;
  verified: "All" | "Verified" | "Unverified";
  detector: "All" | string;
  repo: "All" | string;
}

export type ComparisonStatus = "New" | "Resolved" | "Recurring" | "Regressed";

export interface ComparedFinding {
  key: string;
  status: ComparisonStatus;
  baseline?: Finding;
  current?: Finding;
  detector: string;
  repo: string;
  file: string;
  severity: Severity;
  verified: boolean;
  occurrences: number;
  explanation: string;
}

export interface ComparisonResult {
  items: ComparedFinding[];
  summary: {
    baseline: number;
    current: number;
    new: number;
    resolved: number;
    recurring: number;
    regressed: number;
  };
}
