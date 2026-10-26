import { useState } from "react";
import Footer from "../components/layout/Footer";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    website: "",
  });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  function update(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Contact service is temporarily unavailable. Please try again later."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send your message."
        );
      }

      setResult({
        success: true,
        text: "Message sent successfully! We'll get back to you soon.",
      });

      setForm({
        name: "",
        email: "",
        message: "",
        website: "",
      });
    } catch (error) {
      setResult({
        success: false,
        text: error.message || "Something went wrong.",
      });
    } finally {
      setSending(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-[#f0f6fc] outline-none transition-colors placeholder:text-[#6e7681] focus:border-[#58a6ff]";

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117] text-[#f0f6fc]">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <a
          href="/"
          className="text-sm text-[#8b949e] hover:text-[#58a6ff]"
        >
          <span className="inline-flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to status
          </span>
        </a>

        <h1 className="mt-8 text-2xl font-semibold">
          Get in touch
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#8b949e]">
          Interested in joining our game servers, have a question,
          or just want to say hello? We'd love to hear from you.
        </p>

        <form
          onSubmit={submit}
          className="mt-7 space-y-5 rounded-xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6"
        >
          <label className="block text-sm font-medium text-[#c9d1d9]">
            Name
            <input
              name="name"
              value={form.name}
              onChange={update}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              placeholder="Your name"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-medium text-[#c9d1d9]">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              required
              maxLength={254}
              autoComplete="email"
              placeholder="you@example.com"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-medium text-[#c9d1d9]">
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={update}
              required
              
              maxLength={5000}
              rows={5}
              placeholder="What's on your mind?"
              className={fieldClass + " resize-y"}
            />
          </label>

          <div
            className="absolute -left-[9999px]"
            aria-hidden="true"
          >
            <input
              name="website"
              value={form.website}
              onChange={update}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {result && (
            <p
              role="status"
              className={
                result.success
                  ? "text-sm text-emerald-400"
                  : "text-sm text-red-400"
              }
            >
              {result.text}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg border border-[#30363d] bg-[#21262d] px-4 py-3 text-sm font-medium text-[#f0f6fc] transition-colors hover:bg-[#30363d] disabled:cursor-wait disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send message →"}
          </button>
        </form>
      </main>

      <Footer showContact={false} />
    </div>
  );
}

export default Contact;
