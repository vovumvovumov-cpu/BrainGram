import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";
import "../auth.css";

type Props = { children: ReactNode };

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setReady(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: displayName.trim() || email.split("@")[0] } },
        });
        if (authError) throw authError;
        if (!data.session) setMessage("Аккаунт создан! Проверь почту и подтверди адрес, затем войди.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось выполнить вход."); }
    finally { setBusy(false); }
  }

  if (!ready) return <div className="auth-loading">BrainGram загружается…</div>;
  if (session) return <>{children}</>;
  return <main className="auth-screen"><section className="auth-card">
    <div className="auth-logo">B</div><div className="auth-kicker">ТВОЁ ПРОСТРАНСТВО ДЛЯ ОБЩЕНИЯ</div>
    <h1>{mode === "signup" ? "Создать аккаунт" : "С возвращением"}</h1>
    <p className="auth-subtitle">Войди в BrainGram, чтобы продолжить.</p>
    {!supabaseConfigured ? <div className="auth-alert">Supabase пока не настроен для публикации. Нужно добавить два GitHub Actions secret: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.</div> : <form onSubmit={submit}>
      {mode === "signup" && <label>ИМЯ<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Как тебя называть?" maxLength={32}/></label>}
      <label>ЭЛЕКТРОННАЯ ПОЧТА<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>ПАРОЛЬ<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов"/></label>
      {error && <p className="auth-error">{error}</p>}{message && <p className="auth-message">{message}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? "Подожди…" : mode === "signup" ? "Зарегистрироваться" : "Войти"}</button>
    </form>}
    {supabaseConfigured && <button className="auth-switch" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); }}>{mode === "signup" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}</button>}
    <small className="auth-foot">BrainGram · безопасный вход через Supabase</small>
  </section></main>;
}
