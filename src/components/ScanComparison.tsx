import { useMemo, useState } from "react";
import { compareFindings } from "../lib/comparison";
import { normalizeFindings, parseTruffleHogInput } from "../lib/normalizer";
import type {
  ComparedFinding,
  ComparisonStatus,
  RawTruffleHogFinding,
} from "../types";
import Icon from "./Icon";

const statusStyles: Record<ComparisonStatus, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-600/10",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  Recurring: "bg-slate-100 text-slate-700 ring-slate-500/10",
  Regressed: "bg-red-50 text-red-700 ring-red-600/10",
};

export default function ScanComparison({
  initialBaseline,
  initialCurrent,
}: {
  initialBaseline: RawTruffleHogFinding[];
  initialCurrent: RawTruffleHogFinding[];
}) {
  const [baselineRaw, setBaselineRaw] = useState(initialBaseline);
  const [currentRaw, setCurrentRaw] = useState(initialCurrent);
  const [status, setStatus] = useState<"All" | ComparisonStatus>("All");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const comparison = useMemo(
    () =>
      compareFindings(
        normalizeFindings(baselineRaw),
        normalizeFindings(currentRaw),
      ),
    [baselineRaw, currentRaw],
  );

  const filtered = comparison.items.filter((item) => {
    const statusMatch = status === "All" || item.status === status;
    const q = query.trim().toLowerCase();
    const queryMatch =
      !q ||
      [item.detector, item.repo, item.file, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return statusMatch && queryMatch;
  });

  async function importReport(
    file: File,
    setter: (value: RawTruffleHogFinding[]) => void,
  ) {
    try {
      setError("");
      const text = await file.text();
      setter(parseTruffleHogInput(text));
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Could not parse the scan report.",
      );
    }
  }

  function exportDiff() {
    const payload = {
      generatedAt: new Date().toISOString(),
      summary: comparison.summary,
      findings: comparison.items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "trufflehog-scan-comparison.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-2">
        <ImportCard
          title="Baseline scan"
          subtitle="The older scan used as the comparison reference."
          count={comparison.summary.baseline}
          onImport={(file) => void importReport(file, setBaselineRaw)}
        />
        <ImportCard
          title="Current scan"
          subtitle="The latest scan you want to evaluate against the baseline."
          count={comparison.summary.current}
          onImport={(file) => void importReport(file, setCurrentRaw)}
        />
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CompareMetric
          label="New"
          value={comparison.summary.new}
          note="Introduced since baseline"
          status="New"
        />
        <CompareMetric
          label="Regressed"
          value={comparison.summary.regressed}
          note="Risk profile worsened"
          status="Regressed"
        />
        <CompareMetric
          label="Recurring"
          value={comparison.summary.recurring}
          note="Still present in both scans"
          status="Recurring"
        />
        <CompareMetric
          label="Resolved"
          value={comparison.summary.resolved}
          note="Absent from current scan"
          status="Resolved"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="layers" size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-950">Scan delta</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Compare normalized secret fingerprints without displaying raw secret values.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={exportDiff}
          >
            <Icon name="download" size={16} />
            Export diff
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Icon
              name="search"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              placeholder="Search detector, repository, file..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "All" | ComparisonStatus)
            }
          >
            <option>All</option>
            <option>Regressed</option>
            <option>New</option>
            <option>Recurring</option>
            <option>Resolved</option>
          </select>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((item) => (
            <ComparisonRow key={item.key} item={item} />
          ))}

          {!filtered.length && (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-900">
                No comparison results match the filters
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another status or search term.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <Icon name="alert" size={18} />
          </span>
          <div>
            <h2 className="font-bold text-amber-950">How regression is defined</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              A recurring finding is marked Regressed when it becomes verified
              or moves to a higher severity. Increased occurrences are shown in
              the explanation but do not alone change the status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ImportCard({
  title,
  subtitle,
  count,
  onImport,
}: {
  title: string;
  subtitle: string;
  count: number;
  onImport: (file: File) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {count} normalized
        </span>
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
        <Icon name="upload" size={17} />
        Import JSON / JSONL
        <input
          className="hidden"
          type="file"
          accept=".json,.jsonl,.txt,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
    </article>
  );
}

function CompareMetric({
  label,
  value,
  note,
  status,
}: {
  label: string;
  value: number;
  note: string;
  status: ComparisonStatus;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{note}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>
    </article>
  );
}

function ComparisonRow({ item }: { item: ComparedFinding }) {
  const before = item.baseline;
  const after = item.current;

  return (
    <article className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-950">{item.detector}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[item.status]}`}
            >
              {item.status}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {item.severity}
            </span>
          </div>

          <p className="mt-2 text-sm font-medium text-slate-700">{item.repo}</p>
          <p className="mt-1 max-w-3xl truncate text-xs text-slate-500">
            {item.file}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {item.explanation}
          </p>
        </div>

        <div className="grid min-w-[300px] grid-cols-2 gap-3">
          <Snapshot label="Baseline" finding={before} />
          <Snapshot label="Current" finding={after} />
        </div>
      </div>
    </article>
  );
}

function Snapshot({
  label,
  finding,
}: {
  label: string;
  finding?: ComparedFinding["baseline"];
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      {finding ? (
        <>
          <p className="mt-2 text-xs font-bold text-slate-800">
            {finding.verified ? "Verified" : "Unverified"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{finding.severity}</p>
          <p className="mt-1 text-xs text-slate-400">
            {finding.occurrences} occurrence
            {finding.occurrences === 1 ? "" : "s"}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs font-semibold text-slate-400">Not present</p>
      )}
    </div>
  );
}
