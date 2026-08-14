import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { refresh, authError } = useAuth();
  const { ready, authenticated, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setError("Enter your email address.");
    setIsLoading(true);
    setError("");
    try {
      await sendCode({ email: cleanEmail });
      setPhase("code");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the code.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return setError("Enter the code from your email.");
    setIsLoading(true);
    setError("");
    try {
      await loginWithCode({ code: code.trim() });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That code did not work.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePhrase(event: React.FormEvent) {
    event.preventDefault();
    if (!phrase.trim()) return setError("Enter the admin secure phrase.");
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: phrase.trim() }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Invalid secure phrase.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Secure phrase sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-4 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(0,240,255,.12),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(217,70,239,.12),transparent_30%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03] text-4xl font-black tracking-tight shadow-[0_0_45px_rgba(0,240,255,.12)]">Z</div>
          <h1 className="text-2xl font-semibold">Sign in to ZAR</h1>
          <p className="mt-1 text-sm text-white/55">Your ZCOS identity works everywhere.</p>
        </div>

        <Card className="border-white/10 bg-white/[0.035] text-white backdrop-blur-xl">
          <CardContent className="space-y-4 pt-6">
            {authenticated ? (
              <div className="space-y-3">
                <Button type="button" onClick={() => void refresh()} className="w-full bg-white text-black hover:bg-white/90" disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Continue"}
                </Button>
                <button type="button" onClick={() => void logout()} className="w-full text-xs text-white/55 hover:text-white">Use another email</button>
              </div>
            ) : phase === "code" ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                  <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Email code" inputMode="numeric" autoComplete="one-time-code" className="border-white/10 bg-black/30 pl-10 text-white" disabled={isLoading} autoFocus />
                </div>
                <p className="text-xs text-white/45">Sent to {email.trim()}</p>
                <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={isLoading}>{isLoading ? "Verifying..." : "Verify + Continue"}</Button>
                <button type="button" onClick={() => { setCode(""); setError(""); setPhase("email"); }} className="w-full text-xs text-white/55 hover:text-white">Change email</button>
              </form>
            ) : (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" className="border-white/10 bg-black/30 pl-10 text-white" disabled={isLoading || !ready} autoFocus />
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={isLoading || !ready}>
                  <Sparkles size={16} /> {isLoading || !ready ? (ready ? "Sending..." : "Preparing...") : "Send Code"}
                </Button>
              </form>
            )}

            {(error || authError) && <p className="text-sm text-red-400">{error || authError}</p>}

            <div className="border-t border-white/10 pt-4">
              {!showPhrase ? (
                <button type="button" onClick={() => setShowPhrase(true)} className="text-xs text-white/50 underline-offset-2 hover:text-white hover:underline">Use admin secure phrase</button>
              ) : (
                <form onSubmit={handlePhrase} className="space-y-3">
                  <label className="text-sm font-medium">Admin Secure Phrase</label>
                  <div className="relative">
                    <Input type={phraseVisible ? "text" : "password"} value={phrase} onChange={(event) => setPhrase(event.target.value)} placeholder="Enter admin secure phrase" className="border-white/10 bg-black/30 pr-10 text-white" disabled={isLoading} autoFocus />
                    <button type="button" onClick={() => setPhraseVisible(!phraseVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45" aria-label={phraseVisible ? "Hide phrase" : "Show phrase"}>{phraseVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-white text-black hover:bg-white/90" disabled={isLoading}>{isLoading ? "Verifying..." : "Sign in with phrase"}</Button>
                    <Button type="button" variant="ghost" onClick={() => { setShowPhrase(false); setPhrase(""); setError(""); }}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
