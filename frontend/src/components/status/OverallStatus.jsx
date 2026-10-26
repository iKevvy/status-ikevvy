function OverallStatus({ overall, groups = [] }) {
  const allServices = groups.flatMap(
    (group) => group.services || []
  );

  const offlineServices = allServices.filter(
    (service) => service.status === "offline"
  );

  const unknownServices = allServices.filter(
    (service) => service.status === "unknown"
  );

  const hasOutage = offlineServices.length > 0;
  const hasUnknown = unknownServices.length > 0;

  const appearance = hasOutage
    ? {
        border: "border-red-800/70 bg-red-950/20",
        dot: "bg-red-400",
        text: "text-red-300",
      }
    : hasUnknown || allServices.length === 0
      ? {
          border: "border-[#484f58] bg-[#161b22]",
          dot: "bg-gray-400",
          text: "text-gray-300",
        }
      : {
          border: "border-emerald-800/70 bg-emerald-950/20",
          dot: "bg-emerald-400",
          text: "text-emerald-300",
        };

  const heading = hasOutage
    ? `${offlineServices.length} service${
        offlineServices.length === 1 ? "" : "s"
      } offline`
    : hasUnknown
      ? `${unknownServices.length} service${
          unknownServices.length === 1 ? "" : "s"
        } status unknown`
      : allServices.length === 0
        ? "Status unavailable"
        : "All systems online";

  const details = hasOutage
    ? `Affected: ${offlineServices.map((s) => s.name).join(", ")}${
        hasUnknown
          ? `. Status unknown: ${unknownServices.map((s) => s.name).join(", ")}`
          : ""
      }`
    : hasUnknown
      ? `Unable to confirm: ${unknownServices.map((s) => s.name).join(", ")}`
      : allServices.length === 0
        ? "No monitoring data is currently available."
        : "All monitored services are currently available.";

  return (
    <section
      className={`mb-10 rounded-xl border px-5 py-5 ${appearance.border}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${appearance.dot}`}
        />

        <div>
          <h2 className={`font-medium ${appearance.text}`}>
            {heading}
          </h2>

          <p className="mt-1 text-sm text-[#8b949e]">
            {details}
          </p>

          {overall?.lastUpdated && (
            <p className="mt-2 text-xs text-[#6e7681]">
              Last updated{" "}
              {new Date(overall.lastUpdated).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default OverallStatus;
