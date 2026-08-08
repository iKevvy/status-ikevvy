import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Never";

  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function StatusBadge({ status }) {
  const online =
    status === "online" ||
    status === "running";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        online
          ? "text-emerald-400"
          : "text-red-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online
            ? "bg-emerald-400"
            : "bg-red-400"
        }`}
      />

      {online ? "Online" : "Offline"}
    </span>
  );
}

function PublishToggle({
  published,
  disabled,
  onChange,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!published)}
      className={`relative h-6 w-11 rounded-full transition ${
        published
          ? "bg-emerald-500"
          : "bg-[#30363d]"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer"
      }`}
      aria-label={
        published
          ? "Unpublish service"
          : "Publish service"
      }
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
          published
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

function ServiceRow({
  service,
  updating,
  onToggle,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#21262d] px-4 py-3 first:border-t-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="truncate text-sm font-medium text-[#f0f6fc]">
            {service.name}
          </p>

          <StatusBadge status={service.status} />
        </div>

        <p className="mt-1 text-xs text-[#6e7681]">
          {service.source === "kuma"
            ? `Kuma monitor #${service.id}`
            : `Pelican ID ${service.id}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`hidden text-xs sm:inline ${
            service.published
              ? "text-emerald-400"
              : "text-[#6e7681]"
          }`}
        >
          {service.published
            ? "Published"
            : "Hidden"}
        </span>

        <PublishToggle
          published={service.published}
          disabled={updating}
          onChange={(published) =>
            onToggle(
              service.source,
              service.id,
              published
            )
          }
        />
      </div>
    </div>
  );
}

function Admin() {
  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [session, setSession] =
    useState(null);

  const [adminData, setAdminData] =
    useState(null);

  const [services, setServices] =
    useState({
      kuma: [],
      pelican: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [servicesLoading, setServicesLoading] =
    useState(false);

  const [updatingService, setUpdatingService] =
    useState(null);

  const [error, setError] =
    useState("");

  const publishedCount = useMemo(() => {
    return [
      ...services.kuma,
      ...services.pelican,
    ].filter((service) => service.published)
      .length;
  }, [services]);

  async function loadAdminData() {
    try {
      const response = await fetch(
        "/api/v1/admin/status",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load admin status"
        );
      }

      const data = await response.json();

      setAdminData(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadServices() {
    setServicesLoading(true);

    try {
      const response = await fetch(
        "/api/v1/admin/services",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load service discovery"
        );
      }

      const data = await response.json();

      setServices({
        kuma: data.kuma ?? [],
        pelican: data.pelican ?? [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setServicesLoading(false);
    }
  }

  async function checkSession() {
    try {
      const response = await fetch(
        "/api/v1/admin/auth/session",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setSession(null);
        return;
      }

      const data = await response.json();

      setSession(data);

      if (data.authenticated) {
        await Promise.all([
          loadAdminData(),
          loadServices(),
        ]);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/v1/admin/auth/login",
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            identifier,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Login failed"
        );
      }

      setSession({
        authenticated: true,
        user: data.user,
      });

      setPassword("");

      await Promise.all([
        loadAdminData(),
        loadServices(),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch(
      "/api/v1/admin/auth/logout",
      {
        method: "POST",
        credentials: "include",
      }
    );

    setSession(null);
    setAdminData(null);

    setServices({
      kuma: [],
      pelican: [],
    });
  }

  async function handleRefresh() {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/v1/admin/refresh",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Refresh failed"
        );
      }

      setAdminData(data.data);

      await loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishToggle(
    source,
    id,
    published
  ) {
    const key = `${source}:${id}`;

    setUpdatingService(key);
    setError("");

    try {
      const response = await fetch(
        `/api/v1/admin/services/${source}/${id}`,
        {
          method: "PATCH",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            published,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update service"
        );
      }

      setServices((current) => ({
        ...current,

        [source]: current[source].map(
          (service) =>
            String(service.id) ===
            String(id)
              ? {
                  ...service,
                  published,
                }
              : service
        ),
      }));

      await loadAdminData();
    } catch (err) {
      setError(err.message);

      await loadServices();
    } finally {
      setUpdatingService(null);
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] px-4 py-10 text-[#f0f6fc]">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-[#8b949e]">
            Checking admin session...
          </p>
        </div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] px-4 py-10 text-[#f0f6fc]">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-6">
            <h1 className="text-xl font-semibold">
              iKevvy Status Admin
            </h1>

            <p className="mt-2 text-sm text-[#8b949e]">
              Sign in with your username or email.
            </p>

            <form
              onSubmit={handleLogin}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-1.5 block text-sm text-[#c9d1d9]"
                >
                  Username or email
                </label>

                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-[#f0f6fc] outline-none transition focus:border-[#58a6ff]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm text-[#c9d1d9]"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-[#f0f6fc] outline-none transition focus:border-[#58a6ff]"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-[#238636] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-8 text-[#f0f6fc] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              iKevvy Status Admin
            </h1>

            <p className="mt-1 text-sm text-[#8b949e]">
              Signed in as{" "}
              {session.user?.email ||
                session.user?.username}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={submitting}
              className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-2 text-sm transition hover:bg-[#21262d]"
            >
              Refresh now
            </button>

            <button
              onClick={handleLogout}
              className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-2 text-sm text-red-300 transition hover:bg-[#21262d]"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {adminData && (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
                <p className="text-sm text-[#8b949e]">
                  API
                </p>

                <p className="mt-2 text-lg font-medium text-emerald-400">
                  Online
                </p>

                <p className="mt-2 text-sm text-[#8b949e]">
                  Uptime:{" "}
                  {adminData.api
                    ?.uptimeSeconds ?? 0}{" "}
                  seconds
                </p>
              </div>

              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
                <p className="text-sm text-[#8b949e]">
                  Uptime Kuma
                </p>

                <p
                  className={`mt-2 text-lg font-medium ${
                    adminData
                      .integrations?.kuma
                      ?.status ===
                    "online"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {adminData.integrations
                    ?.kuma?.status ||
                    "unknown"}
                </p>

                <p className="mt-2 text-xs text-[#6e7681]">
                  Last success:{" "}
                  {formatDate(
                    adminData.integrations
                      ?.kuma?.lastSuccess
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
                <p className="text-sm text-[#8b949e]">
                  Pelican
                </p>

                <p
                  className={`mt-2 text-lg font-medium ${
                    adminData
                      .integrations
                      ?.pelican
                      ?.status ===
                    "online"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {adminData.integrations
                    ?.pelican?.status ||
                    "unknown"}
                </p>

                <p className="mt-2 text-xs text-[#6e7681]">
                  Last success:{" "}
                  {formatDate(
                    adminData.integrations
                      ?.pelican?.lastSuccess
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5 md:col-span-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[#8b949e]">
                    Monitoring
                  </p>

                  <p className="text-xs text-[#6e7681]">
                    {publishedCount} published
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-semibold">
                      {adminData.monitoring
                        ?.infrastructureServices ??
                        0}
                    </p>

                    <p className="mt-1 text-xs text-[#8b949e]">
                      Infrastructure
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-semibold">
                      {adminData.monitoring
                        ?.gameServers ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-[#8b949e]">
                      Game servers
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-semibold">
                      {adminData.monitoring
                        ?.totalServices ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-[#8b949e]">
                      Total public
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Service Management
                  </h2>

                  <p className="mt-1 text-sm text-[#8b949e]">
                    Control which discovered services appear on the public status page.
                  </p>
                </div>

                <p className="text-xs text-[#6e7681]">
                  {services.kuma.length +
                    services.pelican
                      .length}{" "}
                  discovered
                </p>
              </div>

              {servicesLoading ? (
                <p className="mt-6 text-sm text-[#8b949e]">
                  Discovering services...
                </p>
              ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]">
                    <div className="flex items-center justify-between border-b border-[#30363d] px-4 py-3">
                      <div>
                        <h3 className="font-medium">
                          Uptime Kuma
                        </h3>

                        <p className="mt-0.5 text-xs text-[#8b949e]">
                          {services.kuma.length} monitors discovered
                        </p>
                      </div>
                    </div>

                    <div>
                      {services.kuma.map(
                        (service) => (
                          <ServiceRow
                            key={`kuma-${service.id}`}
                            service={service}
                            updating={
                              updatingService ===
                              `kuma:${service.id}`
                            }
                            onToggle={
                              handlePublishToggle
                            }
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]">
                    <div className="flex items-center justify-between border-b border-[#30363d] px-4 py-3">
                      <div>
                        <h3 className="font-medium">
                          Pelican Servers
                        </h3>

                        <p className="mt-0.5 text-xs text-[#8b949e]">
                          {services.pelican.length} servers discovered
                        </p>
                      </div>
                    </div>

                    <div className="max-h-[640px] overflow-y-auto">
                      {services.pelican.map(
                        (service) => (
                          <ServiceRow
                            key={`pelican-${service.id}`}
                            service={service}
                            updating={
                              updatingService ===
                              `pelican:${service.id}`
                            }
                            onToggle={
                              handlePublishToggle
                            }
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Admin;
