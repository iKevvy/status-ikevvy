import ServiceCard from "./ServiceCard";

function ServiceList({ groups }) {
  return (
    <section className="mt-10 space-y-10">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {group.name}
            </h2>

            <span className="text-xs text-[#8b949e]">
              {group.services.length} monitored
            </span>
          </div>

          <div className="grid gap-3">
            {group.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default ServiceList;
