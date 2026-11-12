"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

type Lang = "en" | "hi" | "gu";

export function HelperChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    {
      role: "bot",
      text: "Hi! Ask me about food safety windows (e.g. 'How long can sweets stay out?') or pickup status in English, Hindi, or Gujarati.",
    },
  ]);

  const { tasks, impactRecords } = useAppStore();

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const activeTask = tasks[0];
      const totalMeals = impactRecords.reduce((a, b) => a + b.meals, 0);
      const totalKg = impactRecords.reduce((a, b) => a + b.kg, 0);
      const totalCo2 = impactRecords.reduce((a, b) => a + b.co2eKg, 0);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          language: lang,
          task_summary: activeTask
            ? {
                status: activeTask.status,
                eta_minutes: activeTask.etaMinutes,
                area: activeTask.pickupArea,
              }
            : null,
          impact_summary: { meals: totalMeals, kg: totalKg, co2e_kg: totalCo2 },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply || "Please check with the admin." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Unable to reach assistant right now. Check with the admin." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Helper Chat Assistant"
          className="inline-flex min-h-[54px] items-center gap-2 rounded-full bg-teal px-5 py-3 text-sm font-bold text-white shadow-xl shadow-teal/30 transition hover:bg-teal-700"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span>Safety & Pickup Help</span>
        </button>
      ) : (
        <div className="glass flex h-[420px] w-[340px] flex-col overflow-hidden border border-white/90 bg-white/90 shadow-2xl">
          <div className="flex items-center justify-between bg-teal px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">FoodRescue Helper</p>
              <p className="text-[11px] opacity-90">Rules & tool-backed only</p>
            </div>
            <div className="flex items-center gap-1">
              {(["en", "hi", "gu"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                    lang === code ? "bg-white text-teal-700" : "bg-white/20 text-white"
                  }`}
                >
                  {code}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="ml-1 rounded-full p-1 hover:bg-white/20"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-tangerine text-white"
                    : "bg-teal-50 text-ink"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-ink/10 p-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask safety or pickup question..."
              className="min-h-[42px] flex-1 rounded-full border border-ink/15 bg-white px-3.5 text-xs text-ink"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Send message"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-tangerine text-white hover:bg-tangerine-700"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

