function Footer() {
  return (
    <footer className="mt-14 border-t border-[#21262d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-[#6e7681] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} iKevvy. All rights reserved.
        </p>

        <p>
          Powered in part by{" "}
          <a
            href="https://pelican.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8b949e] transition-colors hover:text-[#f0f6fc]"
          >
            Pelican
          </a>
          {" "}and{" "}
          <a
            href="https://uptime.kuma.pet/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8b949e] transition-colors hover:text-[#f0f6fc]"
          >
            Uptime Kuma
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

export default Footer;
