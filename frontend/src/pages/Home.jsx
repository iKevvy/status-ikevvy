import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import OverallStatus from "../components/status/OverallStatus";
import ServiceList from "../components/services/ServiceList";
import { useStatus } from "../hooks/useStatus";

function Home() {
  const {
    statusData,
    loading,
    error,
  } = useStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-sm text-[#8b949e]">
            Loading status...
          </p>
        </main>

        <Footer />
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-sm text-red-400">
            Unable to load status data.
          </p>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <OverallStatus
          overall={statusData.overall}
          groups={statusData.groups}
        />

        <ServiceList groups={statusData.groups} />
      </main>

      <Footer />
    </div>
  );
}

export default Home;
