function OverallStatus({ overall, groups = [] }) {
  const allServices = groups.flatMap(
    (group) => group.services || []
  );

  const offlineServices = allServices.filter(
    (service) => service.status !== "online"
  );

  const allOnline = offlineServices.length === 0;

  return (
    <section
      className={`mb-10 rounded-xl border px-5 py-5 ${
        allOnline
          ? "border-emerald-800/70 bg-emerald-950/20"
          : "border-red-800/70 bg-red-950/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
            allOnline
              ? "bg-emerald-400"
              : "bg-red-400"
          }`}
        />

        <div>
          <h2
            className={`font-medium ${
              allOnline
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {allOnline
              ? "All systems online"
              : `${offlineServices.length} service${
                  offlineServices.length === 1 ? "" : "s"
                } offline`}
          </h2>

          {allOnline ? (
            <p className="mt-1 text-sm text-[#8b949e]">
              All monitored services are currently available.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[#8b949e]">
              Affected:{" "}
              {offlineServices
                .map((service) => service.name)
                .join(", ")}
            </p>
          )}

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
