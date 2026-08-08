import { useState } from "react";

const BAR_COUNT = 60;

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Unknown time";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function AvailabilityBars({ history = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const samples = history.slice(-BAR_COUNT);

  const missingCount = Math.max(
    BAR_COUNT - samples.length,
    0
  );

  const bars = [
    ...Array.from(
      { length: missingCount },
      () => null
    ),
    ...samples,
  ];

  return (
    <div className="mt-4">
      <div
        className="grid gap-[3px] sm:gap-1"
        style={{
          gridTemplateColumns: `repeat(${BAR_COUNT}, minmax(0, 1fr))`,
        }}
      >
        {bars.map((sample, index) => {
          const isOnline =
            sample?.online === true;

          const isOffline =
            sample?.online === false;

          const barColor = isOnline
            ? "bg-emerald-400"
            : isOffline
              ? "bg-red-400"
              : "bg-[#30363d]";

          return (
            <div
              key={
                sample?.timestamp ??
                `empty-${index}`
              }
              className="relative"
              onMouseEnter={() =>
                setHoveredIndex(index)
              }
              onMouseLeave={() =>
                setHoveredIndex(null)
              }
            >
              <div
                className={`h-5 rounded-sm ${barColor} transition duration-150 hover:scale-y-125`}
              />

              {hoveredIndex === index && (
                <div
                  className={`absolute bottom-8 z-50 w-max max-w-[220px] rounded-md border border-[#30363d] bg-[#010409] px-3 py-2 text-xs shadow-xl ${
                    index > BAR_COUNT - 10
                      ? "right-0"
                      : index < 10
                        ? "left-0"
                        : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  {sample ? (
                    <>
                      <div className="font-medium text-[#f0f6fc]">
                        {isOnline
                          ? "Online"
                          : "Offline"}
                      </div>

                      <div className="mt-1 text-[#8b949e]">
                        {formatTimestamp(
                          sample.timestamp
                        )}
                      </div>

                      {sample.latency != null && (
                        <div className="mt-1 text-[#8b949e]">
                          Latency:{" "}
                          {sample.latency} ms
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-[#8b949e]">
                        No data
                      </div>

                      <div className="mt-1 text-[#6e7681]">
                        No sample recorded yet
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-[#8b949e]">
        <span>2h</span>
        <span>now</span>
      </div>
    </div>
  );
}

export default AvailabilityBars;
