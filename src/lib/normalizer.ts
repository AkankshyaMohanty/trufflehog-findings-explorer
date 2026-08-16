import type {
  Finding,
  RawTruffleHogFinding,
  Severity,
  TriageStatus,
} from "../types";

function hash(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, "0");
}

function getSource(raw: RawTruffleHogFinding) {
  const data = raw.SourceMetadata?.Data ?? {};
  const git = data.Git ?? data.Github;
  const filesystem = data.Filesystem;
  const s3 = data.S3;
  const cloudwatch = data.CloudWatch;

  if (git && typeof git === "object") {
    const item = git as Record<string, unknown>;
    return {
      repo: String(item.repository ?? "Unknown repository"),
      file: String(item.file ?? "Unknown file"),
      branch: String(item.branch ?? "unknown"),
      source: "Git",
      timestamp: String(item.timestamp ?? ""),
    };
  }

  if (filesystem && typeof filesystem === "object") {
    const item = filesystem as Record<string, unknown>;
    return {
      repo: "Local filesystem",
      file: String(item.file ?? "Unknown file"),
      branch: "local",
      source: "Filesystem",
      timestamp: "",
    };
  }

  if (s3 && typeof s3 === "object") {
    const item = s3 as Record<string, unknown>;
    return {
      repo: String(item.bucket ?? "S3"),
      file: String(item.key ?? "Unknown key"),
      branch: "n/a",
      source: "S3",
      timestamp: "",
    };
  }

  if (cloudwatch && typeof cloudwatch === "object") {
    const item = cloudwatch as Record<string, unknown>;
    return {
      repo: String(item.logGroup ?? "CloudWatch"),
      file: String(item.logStream ?? "Unknown log stream"),
      branch: "n/a",
      source: "CloudWatch",
      timestamp: "",
    };
  }

  return {
    repo: "Unknown source",
    file: "Unknown location",
    branch: "unknown",
    source: "Unknown",
    timestamp: "",
  };
}

function classifySeverity(detector: string, verified: boolean): Severity {
  const normalized = detector.toLowerCase();

  if (verified && /(aws|gcp|github|gitlab|slack|stripe|privatekey|private key)/.test(normalized)) {
    return "Critical";
  }

  if (verified) return "High";

  if (/(aws|gcp|privatekey|private key)/.test(normalized)) return "High";

  return "Medium";
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function falsePositiveAssessment(detector: string, value: string, source: string) {
  const isHubspotUuid =
    detector.toLowerCase().includes("hubspot") &&
    looksLikeUuid(value) &&
    source === "CloudWatch";

  if (isHubspotUuid) {
    return {
      likely: true,
      reason:
        "UUID-shaped value appears in CloudWatch context and may represent a request identifier rather than a credential.",
    };
  }

  return { likely: false, reason: undefined };
}

export function normalizeFindings(
  rawFindings: RawTruffleHogFinding[],
  existingStatus: Record<string, { status: TriageStatus; note: string }> = {},
): Finding[] {
  const normalized = rawFindings.map((raw, index) => {
    const detector = raw.DetectorName || `Detector-${raw.DetectorType ?? "Unknown"}`;
    const source = getSource(raw);
    const rawValue = String(raw.RawV2 ?? raw.Raw ?? raw.Redacted ?? "redacted");
    const fingerprint = hash(`${detector}|${rawValue}`);
    const fp = falsePositiveAssessment(detector, rawValue, source.source);
    const previous = existingStatus[fingerprint];

    return {
      id: `${fingerprint}-${index}`,
      detector,
      rawDetector: raw.DetectorName,
      repo: source.repo,
      file: source.file,
      branch: source.branch,
      verified: Boolean(raw.Verified),
      valuePreview: String(raw.Redacted ?? redact(rawValue)),
      fingerprint,
      severity: classifySeverity(detector, Boolean(raw.Verified)),
      status: previous?.status ?? "Open",
      note: previous?.note ?? "",
      source: source.source,
      occurrences: 1,
      firstSeen: source.timestamp || undefined,
      lastSeen: source.timestamp || undefined,
      likelyFalsePositive: fp.likely,
      falsePositiveReason: fp.reason,
    } satisfies Finding;
  });

  return deduplicate(normalized);
}

function redact(value: string) {
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}${"*".repeat(Math.min(16, value.length - 8))}${value.slice(-4)}`;
}

function deduplicate(findings: Finding[]): Finding[] {
  const groups = new Map<string, Finding>();

  findings.forEach((finding) => {
    const key = `${finding.fingerprint}|${finding.repo}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, { ...finding });
      return;
    }

    existing.occurrences += 1;

    if (finding.verified) existing.verified = true;
    if (severityRank(finding.severity) < severityRank(existing.severity)) {
      existing.severity = finding.severity;
    }

    if (finding.firstSeen && (!existing.firstSeen || finding.firstSeen < existing.firstSeen)) {
      existing.firstSeen = finding.firstSeen;
    }

    if (finding.lastSeen && (!existing.lastSeen || finding.lastSeen > existing.lastSeen)) {
      existing.lastSeen = finding.lastSeen;
    }

    if (finding.file !== existing.file) {
      existing.file = `${existing.file} (+${existing.occurrences - 1} more)`;
    }
  });

  return [...groups.values()];
}

function severityRank(severity: Severity) {
  return { Critical: 0, High: 1, Medium: 2, Low: 3 }[severity];
}

export function parseTruffleHogInput(text: string): RawTruffleHogFinding[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed as RawTruffleHogFinding[];
    return [parsed as RawTruffleHogFinding];
  } catch {
    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    return lines.map((line, index) => {
      try {
        return JSON.parse(line) as RawTruffleHogFinding;
      } catch {
        throw new Error(`Invalid JSON/JSONL at line ${index + 1}.`);
      }
    });
  }
}
