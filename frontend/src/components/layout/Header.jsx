import { SITE } from "../../config/site";

function Header() {
  return (
    <header className="border-b border-[#30363d] bg-[#010409]">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <h1 className="text-base font-semibold text-[#f0f6fc] sm:text-lg">
          {SITE.title}
        </h1>

        <p className="mt-0.5 text-xs text-[#8b949e]">
          {SITE.description}
        </p>
      </div>
    </header>
  );
}

export default Header;
