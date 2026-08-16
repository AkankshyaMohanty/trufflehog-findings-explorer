import Icon from "./Icon";

export default function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: "database" | "alert" | "repo" | "check";
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon name={icon} size={20} />
        </span>
      </div>
    </article>
  );
}
