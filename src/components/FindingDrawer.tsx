import type { ReactNode } from "react";
import type { Finding, TriageStatus } from "../types";
import Icon from "./Icon";

const statuses: TriageStatus[] = [
  "Open",
  "Investigating",
  "False Positive",
  "Accepted Risk",
  "Resolved",
];

export default function FindingDrawer({
  finding,
  onClose,
  onUpdate,
}: {
  finding: Finding;
  onClose: () => void;
  onUpdate: (finding: Finding) => void;
}) {
  return (
    <>
      <button
        aria-label="Close finding details"
        className="fixed inset-0 z-40 bg-slate-950/35"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Finding details
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">
              {finding.detector}
            </h2>
          </div>
          <button
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section className="grid grid-cols-2 gap-3">
            <Info label="Severity" value={finding.severity} />
            <Info label="Verification" value={finding.verified ? "Verified" : "Unverified"} />
            <Info label="Repository / source" value={finding.repo} />
            <Info label="Occurrences" value={String(finding.occurrences)} />
          </section>

          <section>
            <Label>Detected value</Label>
            <code className="mt-2 block overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-200">
              {finding.valuePreview}
            </code>
          </section>

          <section>
            <Label>Location</Label>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold">{finding.file}</p>
              <p className="mt-1 text-xs text-slate-500">
                {finding.source} · {finding.branch}
              </p>
            </div>
          </section>

          {finding.likelyFalsePositive && (
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Icon name="alert" size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    Likely false positive
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    {finding.falsePositiveReason}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section>
            <Label>Triage status</Label>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={finding.status}
              onChange={(event) =>
                onUpdate({
                  ...finding,
                  status: event.target.value as TriageStatus,
                })
              }
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </section>

          <section>
            <Label>Analyst note</Label>
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              placeholder="Add remediation context, owner, ticket, or false-positive reasoning..."
              value={finding.note}
              onChange={(event) =>
                onUpdate({ ...finding, note: event.target.value })
              }
            />
          </section>

          <section className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Suggested action
            </p>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              {finding.verified
                ? "Treat verified credentials as high-priority remediation candidates: rotate/revoke the secret, remove it from source, and investigate historical exposure."
                : finding.likelyFalsePositive
                  ? "Confirm the surrounding context before rotating credentials. If validated, mark as False Positive and preserve the reason for future suppression."
                  : "Validate whether the detected value is a live credential, determine ownership, and scope remediation based on exposure and access."}
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </p>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
