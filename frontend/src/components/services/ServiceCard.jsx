import { SERVICE_META } from "../../config/services";
import AvailabilityBars from "../charts/AvailabilityBars";

function formatUptime(ms) {
  if (!ms || ms <= 0) {
    return "Stopped";
  }

  const totalMinutes =
    Math.floor(ms / 60000);

  const days =
    Math.floor(
      totalMinutes / 1440
    );

  const hours =
    Math.floor(
      (totalMinutes % 1440) / 60
    );

  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function ServiceCard({ service }) {
  const meta =
    SERVICE_META[service.id] ?? {};

  const isOnline =
    service.status === "online";

  const isPublic =
    meta.visibility != null
      ? meta.visibility === "public"
      : service.source === "pelican";

  const isGameService =
    service.source === "pelican" ||
    Boolean(service.resources);

  const primaryMetric =
    isGameService
      ? formatUptime(
          service.resources?.uptime
        )
      : service.latency != null
        ? `${service.latency} ms`
        : "—";

  return (
    <article className="group rounded-xl border border-[#30363d] bg-[#161b22] px-5 py-4 transition duration-200 hover:border-[#484f58] hover:bg-[#1c2128]">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {meta.icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <img
                src={meta.icon}
                alt={`${service.name} icon`}
                className="max-h-10 max-w-10 object-contain"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="font-medium text-[#f0f6fc]">
                {service.name}
              </h3>

              <div
                className={`flex items-center gap-1.5 text-sm font-medium ${
                  isOnline
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    isOnline
                      ? "bg-emerald-400"
                      : "bg-red-400"
                  }`}
                />

                <span>
                  {isOnline
                    ? "Online"
                    : "Offline"}
                </span>
              </div>
            </div>

            <p className="mt-1 truncate text-sm text-[#8b949e]">
              {meta.description ||
                service.description ||
                ""}
            </p>
          </div>
        </div>

        <div className="ml-6 flex min-w-[90px] shrink-0 flex-col items-end">
          <span className="text-sm font-medium text-[#f0f6fc]">
            {primaryMetric}
          </span>

          <span
            className={`mt-1 text-xs font-medium ${
              isPublic
                ? "text-emerald-400"
                : "text-orange-400"
            }`}
          >
            {isPublic
              ? "Public"
              : "Private"}
          </span>
        </div>
      </div>

      <AvailabilityBars
        history={service.history}
      />
    </article>
  );
}

export default ServiceCard;
