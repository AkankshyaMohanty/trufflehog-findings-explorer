import { useMemo, useState } from "react";
import FindingDrawer from "./components/FindingDrawer";
import Icon from "./components/Icon";
import MetricCard from "./components/MetricCard";
import ScanComparison from "./components/ScanComparison";
import { mockFindings } from "./data/mockFindings";
import { comparisonBaseline, comparisonCurrent } from "./data/comparisonExamples";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { normalizeFindings, parseTruffleHogInput } from "./lib/normalizer";
import type {
  Filters,
  Finding,
  RawTruffleHogFinding,
  Severity,
  TriageStatus,
} from "./types";

const statusValues: TriageStatus[] = [
  "Open",
  "Investigating",
  "False Positive",
  "Accepted Risk",
  "Resolved",
];

const severityStyles: Record<Severity, string> = {
  Critical: "bg-red-50 text-red-700 ring-red-600/10",
  High: "bg-orange-50 text-orange-700 ring-orange-600/10",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/10",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
};

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export default function App() {
  const [rawData, setRawData] = useLocalStorage<RawTruffleHogFinding[]>(
    "secretscope.raw",
    mockFindings,
  );
  const [triage, setTriage] = useLocalStorage<
    Record<string, { status: TriageStatus; note: string }>
  >("secretscope.triage", {});
  const [filters, setFilters] = useState<Filters>({
    query: "",
    severity: "All",
    status: "All",
    verified: "All",
    detector: "All",
    repo: "All",
  });
  const [selected, setSelected] = useState<Finding | null>(null);
  const [importError, setImportError] = useState("");
  const [view, setView] = useState<"triage" | "compare">("triage");

  const findings = useMemo(
    () => normalizeFindings(rawData, triage),
    [rawData, triage],
  );

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();

    return findings.filter((finding) => {
      const searchMatch =
        !q ||
        [
          finding.detector,
          finding.repo,
          finding.file,
          finding.valuePreview,
          finding.fingerprint,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const severityMatch =
        filters.severity === "All" || finding.severity === filters.severity;
      const statusMatch =
        filters.status === "All" || finding.status === filters.status;
      const verifiedMatch =
        filters.verified === "All" ||
        (filters.verified === "Verified" && finding.verified) ||
        (filters.verified === "Unverified" && !finding.verified);
      const detectorMatch =
        filters.detector === "All" || finding.detector === filters.detector;
      const repoMatch = filters.repo === "All" || finding.repo === filters.repo;

      return (
        searchMatch &&
        severityMatch &&
        statusMatch &&
        verifiedMatch &&
        detectorMatch &&
        repoMatch
      );
    });
  }, [findings, filters]);

  const detectors = useMemo(
    () => [...new Set(findings.map((finding) => finding.detector))].sort(),
    [findings],
  );
  const repos = useMemo(
    () => [...new Set(findings.map((finding) => finding.repo))].sort(),
    [findings],
  );

  const metrics = useMemo(() => {
    const verified = findings.filter((finding) => finding.verified).length;
    const critical = findings.filter(
      (finding) => finding.severity === "Critical",
    ).length;
    const likelyFp = findings.filter(
      (finding) => finding.likelyFalsePositive,
    ).length;
    const affectedRepos = new Set(findings.map((finding) => finding.repo)).size;

    return { verified, critical, likelyFp, affectedRepos };
  }, [findings]);

  async function importFile(file: File) {
    setImportError("");

    try {
      const text = await file.text();
      const parsed = parseTruffleHogInput(text);
      setRawData(parsed);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not parse the report.",
      );
    }
  }

  function updateFinding(next: Finding) {
    setTriage((current) => ({
      ...current,
      [next.fingerprint]: { status: next.status, note: next.note },
    }));
    setSelected(next);
  }

  function exportJson() {
    download(
      "trufflehog-remediation-report.json",
      JSON.stringify(filtered, null, 2),
      "application/json",
    );
  }

  function exportCsv() {
    const headers = [
      "detector",
      "severity",
      "verified",
      "status",
      "repository",
      "file",
      "branch",
      "source",
      "occurrences",
      "fingerprint",
      "likelyFalsePositive",
      "note",
    ];

    const rows = filtered.map((finding) =>
      [
        finding.detector,
        finding.severity,
        finding.verified,
        finding.status,
        finding.repo,
        finding.file,
        finding.branch,
        finding.source,
        finding.occurrences,
        finding.fingerprint,
        finding.likelyFalsePositive,
        finding.note,
      ]
        .map(csvEscape)
        .join(","),
    );

    download(
      "trufflehog-remediation-report.csv",
      [headers.join(","), ...rows].join("\n"),
      "text/csv",
    );
  }

  function resetDemo() {
    setRawData(mockFindings);
    setTriage({});
    setFilters({
      query: "",
      severity: "All",
      status: "All",
      verified: "All",
      detector: "All",
      repo: "All",
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
              <Icon name="shield" size={23} />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">
                SecretScope
              </p>
              <p className="text-xs text-slate-500">
                TruffleHog Findings Explorer
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:block">
            Local-only triage
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Secret detection operations
            </p>
            <h1 className="mt-2 max-w-5xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Turn raw secret-scan output into an actionable remediation queue.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Import sanitized TruffleHog JSON or JSONL, deduplicate findings,
              track verification and triage status, flag likely false positives,
              and export remediation reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700">
              <Icon name="upload" size={17} />
              Import report
              <input
                type="file"
                className="hidden"
                accept=".json,.jsonl,.txt,application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importFile(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={exportCsv}
            >
              <Icon name="download" size={16} />
              CSV
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={exportJson}
            >
              <Icon name="download" size={16} />
              JSON
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              onClick={resetDemo}
            >
              Reset demo
            </button>
          </div>
        </section>

        <section className="mt-6 flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              view === "triage"
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => setView("triage")}
          >
            Findings triage
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              view === "compare"
                ? "bg-slate-950 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
            onClick={() => setView("compare")}
          >
            Compare scans
          </button>
        </section>

        {view === "compare" ? (
          <section className="mt-6">
            <ScanComparison
              initialBaseline={comparisonBaseline}
              initialCurrent={comparisonCurrent}
            />
          </section>
        ) : (
          <>
        {importError && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {importError}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Verified findings"
            value={metrics.verified}
            note="Confirmed by scan metadata"
            icon="check"
          />
          <MetricCard
            label="Critical findings"
            value={metrics.critical}
            note="Highest-priority queue"
            icon="alert"
          />
          <MetricCard
            label="Likely false positives"
            value={metrics.likelyFp}
            note="Static contextual heuristics"
            icon="database"
          />
          <MetricCard
            label="Affected sources"
            value={metrics.affectedRepos}
            note="Repositories, log groups, or buckets"
            icon="repo"
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Icon name="filter" size={17} className="text-blue-600" />
              <h2 className="font-bold text-slate-950">Triage queue</h2>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {filtered.length} shown
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="relative xl:col-span-2">
                <Icon
                  name="search"
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  placeholder="Search detector, repo, file..."
                  value={filters.query}
                  onChange={(event) =>
                    setFilters({ ...filters, query: event.target.value })
                  }
                />
              </label>

              <FilterSelect
                value={filters.severity}
                onChange={(value) =>
                  setFilters({
                    ...filters,
                    severity: value as Filters["severity"],
                  })
                }
                options={["All", "Critical", "High", "Medium", "Low"]}
              />
              <FilterSelect
                value={filters.status}
                onChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value as Filters["status"],
                  })
                }
                options={["All", ...statusValues]}
              />
              <FilterSelect
                value={filters.verified}
                onChange={(value) =>
                  setFilters({
                    ...filters,
                    verified: value as Filters["verified"],
                  })
                }
                options={["All", "Verified", "Unverified"]}
              />
              <FilterSelect
                value={filters.detector}
                onChange={(value) =>
                  setFilters({ ...filters, detector: value })
                }
                options={["All", ...detectors]}
              />
            </div>

            <div className="mt-3">
              <FilterSelect
                value={filters.repo}
                onChange={(value) => setFilters({ ...filters, repo: value })}
                options={["All", ...repos]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Detector</th>
                  <th className="px-5 py-3.5 font-semibold">Severity</th>
                  <th className="px-5 py-3.5 font-semibold">Verification</th>
                  <th className="px-5 py-3.5 font-semibold">Repository / source</th>
                  <th className="px-5 py-3.5 font-semibold">Location</th>
                  <th className="px-5 py-3.5 font-semibold">Occurrences</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((finding) => (
                  <tr
                    key={finding.id}
                    className="cursor-pointer hover:bg-slate-50/70"
                    onClick={() => setSelected(finding)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {finding.detector}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {finding.valuePreview}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${severityStyles[finding.severity]}`}
                      >
                        {finding.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          finding.verified
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {finding.verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[220px] truncate font-medium text-slate-800">
                        {finding.repo}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {finding.source}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[260px] truncate text-slate-600">
                        {finding.file}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {finding.branch}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {finding.occurrences}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {finding.status}
                      </span>
                      {finding.likelyFalsePositive && (
                        <p className="mt-1 text-[11px] font-semibold text-amber-600">
                          likely FP
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filtered.length && (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold text-slate-900">
                  No findings match the filters
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Adjust the filters or import another report.
                </p>
              </div>
            )}
          </div>
        </section>

          </>
        )}

        <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <Icon name="shield" size={19} />
            </span>
            <div>
              <h2 className="font-bold text-blue-950">
                Frontend-only security triage
              </h2>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                Imported files are parsed in the browser and are not uploaded.
                The false-positive hints are educational heuristics, not
                authoritative secret verification. Use sanitized reports for
                demos and public screenshots.
              </p>
            </div>
          </div>
        </section>
      </main>

      {selected && (
        <FindingDrawer
          finding={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateFinding}
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
