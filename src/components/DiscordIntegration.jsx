import { useState, useEffect } from "react";
import { formatDuration } from "../utils/formatting";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useIsAdmin } from "../hooks/useIsAdmin";

const DISCORD_WEBHOOK_KEY = "discord_webhook_url";

export function DiscordIntegration({ computed, now, user }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tempWebhookUrl, setTempWebhookUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useIsAdmin(user?.uid);

  // Load webhook URL from Firestore (source of truth)
  useEffect(() => {
    const loadWebhookUrl = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "discord"));
        if (settingsDoc.exists() && settingsDoc.data()?.webhookUrl) {
          const url = settingsDoc.data().webhookUrl;
          setWebhookUrl(url);
          setTempWebhookUrl(url);
          // Also cache in localStorage
          localStorage.setItem(DISCORD_WEBHOOK_KEY, url);
        } else {
          // Fall back to localStorage if Firestore is empty
          const saved = localStorage.getItem(DISCORD_WEBHOOK_KEY);
          if (saved) {
            setWebhookUrl(saved);
            setTempWebhookUrl(saved);
          }
        }
      } catch (err) {
        console.error("Failed to load webhook URL:", err);
        // Fall back to localStorage
        const saved = localStorage.getItem(DISCORD_WEBHOOK_KEY);
        if (saved) {
          setWebhookUrl(saved);
          setTempWebhookUrl(saved);
        }
      } finally {
        setLoading(false);
      }
    };

    loadWebhookUrl();
  }, []);

  const saveWebhookUrl = async () => {
    if (!tempWebhookUrl.trim()) {
      setError("Webhook URL cannot be empty");
      return;
    }

    if (!tempWebhookUrl.includes("discord.com/api/webhooks/")) {
      setError("Invalid Discord webhook URL");
      return;
    }

    try {
      // Save to Firestore (source of truth)
      await setDoc(doc(db, "settings", "discord"), {
        webhookUrl: tempWebhookUrl,
      });
      // Also cache in localStorage
      localStorage.setItem(DISCORD_WEBHOOK_KEY, tempWebhookUrl);
      setWebhookUrl(tempWebhookUrl);
      setError("");
      setMessage("✓ Webhook URL saved");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Failed to save webhook URL:", err);
      setError("Failed to save webhook URL");
    }
  };

  const clearWebhookUrl = async () => {
    try {
      // Clear from Firestore
      await setDoc(doc(db, "settings", "discord"), {
        webhookUrl: "",
      });
      // Clear from localStorage
      localStorage.removeItem(DISCORD_WEBHOOK_KEY);
      setWebhookUrl("");
      setTempWebhookUrl("");
      setMessage("✓ Webhook URL cleared");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Failed to clear webhook URL:", err);
      setError("Failed to clear webhook URL");
    }
  };

  const generateReportEmbed = () => {
    const upcoming24h = computed
      .filter((boss) => {
        if (!boss.spawnAt) return false;
        const in24Hours = now + 24 * 60 * 60 * 1000;
        return boss.spawnAt >= now && boss.spawnAt <= in24Hours;
      })
      .sort((a, b) => a.spawnAt - b.spawnAt);

    if (upcoming24h.length === 0) {
      return {
        content: '📋 **24-Hour Boss Report**: No bosses spawning in the next 24 hours',
        embeds: [],
      };
    }

    const reportLines = upcoming24h
      .map((boss, idx) => {
        const spawnDate = new Date(boss.spawnAt);
        const spawnTime = spawnDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const timeStr = formatDuration(boss.remaining);
        const bossIcon = boss.type === "scheduled" ? "🔄" : "⏱️";
        return `${idx + 1}. **${boss.name}** @ ${boss.map} - Spawn: ${spawnTime} (${timeStr}) ${bossIcon}`;
      })
      .join("\n");

    return {
      content: `📋 **24-Hour Boss Report** - ${upcoming24h.length} boss(es) spawning`,
      embeds: [
        {
          title: "📊 Upcoming Bosses (Next 24 Hours)",
          description: reportLines,
          color: 3447003, // Blue
          fields: [
            {
              name: "Summary",
              value: `Total: ${upcoming24h.length} boss spawn(s)`,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };
  };

  const postToDiscord = async () => {
    if (!webhookUrl) {
      setError("Webhook URL not configured");
      return;
    }

    try {
      setPosting(true);
      setError("");

      const reportEmbed = generateReportEmbed();

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportEmbed),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      setMessage("✓ Posted to Discord");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Failed to post to Discord:", err);
      setError(`Failed to post: ${err.message}`);
    } finally {
      setPosting(false);
    }
  };



  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Discord Integration</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Post reports to Discord.</p>
      </div>

      <div className="space-y-3 sm:space-y-3">
        {/* Webhook URL Setup */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <p className="text-xs font-semibold text-slate-300 mb-2">Webhook URL</p>
          {loading ? (
            <div className="text-xs text-slate-400 p-2">Loading webhook URL...</div>
          ) : webhookUrl ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 break-all p-2 bg-black/30 rounded border border-white/10">
                {webhookUrl.substring(0, 50)}...
              </div>
              {isAdmin && (
                <button
                  onClick={clearWebhookUrl}
                  className="w-full rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 active:bg-rose-500/30"
                >
                  Remove Webhook
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                value={tempWebhookUrl}
                onChange={(e) => setTempWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              <button
                onClick={saveWebhookUrl}
                className="w-full rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 active:bg-cyan-600"
              >
                Save Webhook
              </button>
              <p className="text-xs text-slate-500 leading-4">
                <strong>How to get a webhook:</strong> Discord Server → Channel Settings → Integrations → Webhooks → New Webhook
              </p>
            </div>
          )}
        </div>

        {/* Post Button */}
        {webhookUrl && (
          <>
            <button
              onClick={postToDiscord}
              disabled={posting}
              className="w-full rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60 active:bg-blue-600 sm:py-2.5"
            >
              {posting ? "Posting..." : "📤 Post Report Now"}
            </button>
          </>
        )}

        {/* Messages */}
        {message && (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 sm:text-sm">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs leading-5 text-slate-400 sm:text-sm">
          Click "Post Report Now" to send an immediate report to Discord. Periodic updates are handled by Cloud Functions every 15 minutes.
        </div>
      </div>
    </div>
  );
}
