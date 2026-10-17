"use client";

import { useEffect, useRef, useState } from "react";

import { SectionRail } from "@/components/portfolio/SectionRail";
import { profile, socials } from "@/data/portfolio";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { sendContactMessage } from "@/lib/emailjs";

type FieldName = "name" | "email" | "subject" | "message";
type Values = Record<FieldName, string> & { company: string };
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = { name: "", email: "", subject: "", message: "", company: "" };

/** Mirrors the server rules so feedback is instant — the server still decides. */
function validate(values: Values): Errors {
  const errors: Errors = {};

  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (values.subject.trim().length < 3) errors.subject = "Please add a subject.";
  if (values.message.trim().length < 10) {
    errors.message = "Please write at least 10 characters.";
  }

  return errors;
}

const FIELDS: { name: FieldName; label: string; type: string; multiline?: boolean }[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "subject", label: "Subject", type: "text" },
  { name: "message", label: "Message", type: "text", multiline: true },
];

const CONTACT_LINKS = socials.filter((s) =>
  ["GitHub", "LinkedIn"].includes(s.label),
);

/**
 * Contact — the final room of the experience (spec §27, §28).
 *
 * Client validation, a honeypot, and a local rate guard; success and error both
 * surface through the same toast channel. Delivery goes through EmailJS so the
 * form works on a static host — the Gmail credential lives in the EmailJS
 * dashboard, never in this bundle. See src/lib/emailjs.ts.
 */
export function Contact() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, threshold: 0.12 });
  const shown = inView || reduced;

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [toast, setToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (tone: "success" | "error", text: string) => {
    setToast({ tone, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 8000);
  };

  const setField = (field: keyof Values) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    if (field !== "company" && errors[field as FieldName]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setStatus("error");
      showToast("error", "Please correct the highlighted fields.");
      const firstInvalid = Object.keys(found)[0];
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setStatus("sending");
    const result = await sendContactMessage(values);

    if (!result.ok) {
      setStatus("error");
      showToast("error", result.error);
      return;
    }

    setValues(EMPTY);
    setErrors({});
    setStatus("success");
    showToast("success", "Message sent. I'll reply as soon as I can.");
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative px-6 py-28 sm:px-10 sm:py-36"
    >
      <div ref={ref} className="mx-auto max-w-[1400px]">
        <SectionRail index="09" label="Contact" className="mb-12 sm:mb-16" />

        <h2
          id="contact-title"
          className={[
            "t-section max-w-4xl text-fg",
            reduced
              ? ""
              : "transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
            shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          ].join(" ")}
        >
          LET&apos;S BUILD
          <br />
          <span className="text-fg-muted">SOMETHING REAL.</span>
        </h2>

        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-10">
          {/* Direct channels */}
          <div className="lg:col-span-4">
            <dl className="space-y-0">
              <div className="border-t border-line py-5">
                <dt className="t-meta mb-2">Email</dt>
                <dd>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-base text-fg underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {profile.email}
                  </a>
                </dd>
              </div>

              <div className="border-t border-line py-5">
                <dt className="t-meta mb-2">Phone</dt>
                <dd>
                  <a
                    href={`tel:${profile.phone.replace(/\s/g, "")}`}
                    className="text-base text-fg underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {profile.phone}
                  </a>
                </dd>
              </div>

              {CONTACT_LINKS.map((link) => (
                <div key={link.label} className="border-t border-line py-5">
                  <dt className="t-meta mb-2">{link.label}</dt>
                  <dd>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-base text-fg underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {link.href.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              ))}

              <div className="border-t border-line py-5">
                <dt className="t-meta mb-2">Based in</dt>
                <dd className="t-label">{profile.location}</dd>
              </div>
            </dl>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 lg:col-start-6">
            <form onSubmit={onSubmit} noValidate className="space-y-7">
              {FIELDS.map((field) => (
                <div key={field.name} className="field">
                  {field.multiline ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={5}
                      placeholder=" "
                      value={values[field.name]}
                      onChange={setField(field.name)}
                      aria-invalid={errors[field.name] ? "true" : undefined}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                      className="field-input"
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      autoComplete={
                        field.name === "name"
                          ? "name"
                          : field.name === "email"
                            ? "email"
                            : "off"
                      }
                      placeholder=" "
                      value={values[field.name]}
                      onChange={setField(field.name)}
                      aria-invalid={errors[field.name] ? "true" : undefined}
                      aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                      className="field-input"
                    />
                  )}

                  {/* Must follow the input directly — the floating-label CSS
                      depends on that adjacency. */}
                  <label htmlFor={field.name} className="field-label">
                    {field.label}
                  </label>

                  {errors[field.name] ? (
                    <span id={`${field.name}-error`} role="alert" className="field-error">
                      {errors[field.name]}
                    </span>
                  ) : null}
                </div>
              ))}

              {/* Honeypot. Real visitors never see or reach this. */}
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.company}
                  onChange={setField("company")}
                />
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="group inline-flex items-center gap-2.5 bg-fg px-7 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {status === "sending" ? "Sending…" : "Send message"}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>

                <p className="t-meta">Or email directly — whichever is easier.</p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast. One channel for both outcomes, announced politely. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-6 z-[130] flex justify-center"
      >
        {toast ? (
          <div
            className={[
              "pointer-events-auto max-w-md border px-5 py-3.5 backdrop-blur-md",
              toast.tone === "success"
                ? "border-accent/45 bg-charcoal/95"
                : "border-[#f1707a]/50 bg-charcoal/95",
            ].join(" ")}
          >
            <p className="t-meta mb-1.5 text-fg-faint">
              {toast.tone === "success" ? "Sent" : "Not sent"}
            </p>
            <p className="text-sm leading-relaxed text-fg">{toast.text}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
