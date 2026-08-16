import type {
  ComparedFinding,
  ComparisonResult,
  Finding,
  Severity,
} from "../types";

const severityRank: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function comparisonKey(finding: Finding) {
  return `${finding.detector}|${finding.fingerprint}|${finding.repo}`;
}

function worsened(baseline: Finding, current: Finding) {
  if (!baseline.verified && current.verified) return true;
  if (severityRank[current.severity] > severityRank[baseline.severity]) return true;
  return false;
}

function regressionReason(baseline: Finding, current: Finding) {
  const reasons: string[] = [];

  if (!baseline.verified && current.verified) {
    reasons.push("the finding changed from unverified to verified");
  }

  if (severityRank[current.severity] > severityRank[baseline.severity]) {
    reasons.push(
      `severity increased from ${baseline.severity} to ${current.severity}`,
    );
  }

  if (current.occurrences > baseline.occurrences) {
    reasons.push(
      `occurrences increased from ${baseline.occurrences} to ${current.occurrences}`,
    );
  }

  return reasons.length
    ? `Recurring secret regressed because ${reasons.join(" and ")}.`
    : "Recurring secret has a worse current risk profile.";
}

export function compareFindings(
  baseline: Finding[],
  current: Finding[],
): ComparisonResult {
  const baselineMap = new Map(
    baseline.map((finding) => [comparisonKey(finding), finding]),
  );
  const currentMap = new Map(
    current.map((finding) => [comparisonKey(finding), finding]),
  );

  const keys = new Set([...baselineMap.keys(), ...currentMap.keys()]);
  const items: ComparedFinding[] = [];

  keys.forEach((key) => {
    const before = baselineMap.get(key);
    const after = currentMap.get(key);

    if (!before && after) {
      items.push({
        key,
        status: "New",
        current: after,
        detector: after.detector,
        repo: after.repo,
        file: after.file,
        severity: after.severity,
        verified: after.verified,
        occurrences: after.occurrences,
        explanation: "This finding exists in the current scan but not in the baseline.",
      });
      return;
    }

    if (before && !after) {
      items.push({
        key,
        status: "Resolved",
        baseline: before,
        detector: before.detector,
        repo: before.repo,
        file: before.file,
        severity: before.severity,
        verified: before.verified,
        occurrences: before.occurrences,
        explanation: "This finding was present in the baseline but is absent from the current scan.",
      });
      return;
    }

    if (before && after) {
      const isRegressed = worsened(before, after);

      items.push({
        key,
        status: isRegressed ? "Regressed" : "Recurring",
        baseline: before,
        current: after,
        detector: after.detector,
        repo: after.repo,
        file: after.file,
        severity: after.severity,
        verified: after.verified,
        occurrences: after.occurrences,
        explanation: isRegressed
          ? regressionReason(before, after)
          : "This finding appears in both scans without a higher verification or severity state.",
      });
    }
  });

  const order: Record<ComparedFinding["status"], number> = {
    Regressed: 0,
    New: 1,
    Recurring: 2,
    Resolved: 3,
  };

  items.sort((a, b) => {
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }

    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[b.severity] - severityRank[a.severity];
    }

    return a.detector.localeCompare(b.detector);
  });

  return {
    items,
    summary: {
      baseline: baseline.length,
      current: current.length,
      new: items.filter((item) => item.status === "New").length,
      resolved: items.filter((item) => item.status === "Resolved").length,
      recurring: items.filter((item) => item.status === "Recurring").length,
      regressed: items.filter((item) => item.status === "Regressed").length,
    },
  };
}
