function StatusDot({ animated = false }) {
  if (animated) {
    return (
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
      </span>
    );
  }

  return <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />;
}

export default StatusDot;
