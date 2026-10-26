function Footer({ showContact = true }) {
  return (
    <footer className="mt-14 px-4 pb-6 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-xl bg-[#0d1117] px-4 py-5 sm:px-6">
        {showContact && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#f0f6fc]">
              Want to join our game servers?
            </h2>
            <p className="mt-1 text-xs text-[#8b949e]">
              Have a question or want to play with us?
            </p>
          </div>

          <a
            href="/contact"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#30363d] px-4 py-2 text-sm font-medium text-[#c9d1d9] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff]"
          >
            <span>✉</span>
            Get in touch
            <span aria-hidden="true">→</span>
          </a>
        </div>

        )}

        <div className={showContact ? "mt-5 border-t border-[#30363d] pt-5" : ""}>
          <div className="flex flex-col gap-2 text-xs text-[#6e7681] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} iKevvy. All rights reserved.
            </p>

            <p>
              Powered in part by{" "}
              <a
                href="https://pelican.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b949e] hover:text-[#f0f6fc]"
              >
                Pelican
              </a>
              {" "}and{" "}
              <a
                href="https://uptime.kuma.pet/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8b949e] hover:text-[#f0f6fc]"
              >
                Uptime Kuma
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
