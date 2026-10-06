"use client";

import { signIn } from "next-auth/react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function AuthForm({ mode, nextPath }: { mode: "login" | "register"; nextPath: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (registering) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Registreren is niet gelukt.");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) throw new Error("Controleer je e-mailadres en wachtwoord.");
      window.location.assign(nextPath);
    } catch (formError) {
      setError(formError instanceof Error ? formError.message : "Er ging iets mis. Probeer het opnieuw.");
      setPending(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <span className="eyebrow">{registering ? "Begin gratis" : "Welkom terug"}</span>
      <h2>{registering ? "Maak je account" : "Log in"}</h2>
      <p className="auth-subtitle">{registering ? "Start met 50 gratis credits. Geen betaalkaart nodig." : "Log in om je leads en credits te openen."}</p>
      <form method="post" onSubmit={submit}>
        {registering ? <div className="form-field"><label htmlFor="name">Naam</label><input autoComplete="name" id="name" maxLength={80} minLength={2} name="name" required /></div> : null}
        <div className="form-field"><label htmlFor="email">E-mailadres</label><input autoComplete="email" id="email" name="email" required type="email" /></div>
        <div className="form-field">
          <label htmlFor="password">Wachtwoord</label>
          <input autoComplete={registering ? "new-password" : "current-password"} id="password" minLength={10} name="password" required type="password" />
          {registering ? <span className="field-hint">Minimaal 10 tekens.</span> : null}
        </div>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button className="button button-dark auth-submit" disabled={pending || !hydrated} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <ArrowRight aria-hidden="true" size={16} />}
          {pending ? "Even geduld..." : registering ? "Account aanmaken" : "Inloggen"}
        </button>
      </form>
      <p className="auth-bottom">{registering ? "Heb je al een account? " : "Nog geen account? "}<Link className="text-link" href={registering ? "/login" : "/register"}>{registering ? "Log in" : "Maak een account"}</Link></p>
    </div>
  );
}
