import { useState, useEffect } from "react";
import { formatDuration } from "../utils/formatting";

const DISCORD_WEBHOOK_KEY = "discord_webhook_url";
const DISCORD_UPDATES_KEY = "discord_auto_updates";
const DISCORD_INTERVAL_KEY = "discord_update_interval";
const DISCORD_LAST_POST_KEY = "discord_last_post";

export function DiscordIntegration({ computed, now }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tempWebhookUrl, setTempWebhookUrl] = useState("");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(10); // minutes
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastPosted, setLastPosted] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(DISCORD_WEBHOOK_KEY);
    const savedAutoUpdate = localStorage.getItem(DISCORD_UPDATES_KEY) === "true";
    const savedInterval = parseInt(localStorage.getItem(DISCORD_INTERVAL_KEY) || "10");
    const savedLastPost = localStorage.getItem(DISCORD_LAST_POST_KEY);

    if (saved) setWebhookUrl(saved);
    if (saved) setTempWebhookUrl(saved);
    setAutoUpdate(savedAutoUpdate);
    setUpdateInterval(savedInterval);
    if (savedLastPost) setLastPosted(new Date(parseInt(savedLastPost)));
  }, []);

  // Auto-update effect
  useEffect(() => {
    if (!autoUpdate || !webhookUrl) {
      setNextUpdate(null);
      return;
    }

    const interval = setInterval(async () => {
      try {
        await postToDiscord();
      } catch (err) {
        console.error("Auto-update failed:", err);
      }
    }, updateInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval, webhookUrl, computed, now]);

  // Calculate next update time
  useEffect(() => {
    if (!autoUpdate || !lastPosted) {
      setNextUpdate(null);
      return;
    }

    const next = new Date(lastPosted.getTime() + updateInterval * 60 * 1000);
    setNextUpdate(next);
  }, [autoUpdate, lastPosted, updateInterval]);

  const saveWebhookUrl = () => {
    if (!tempWebhookUrl.trim()) {
      setError("Webhook URL cannot be empty");
      return;
    }

    if (!tempWebhookUrl.includes("discord.com/api/webhooks/")) {
      setError("Invalid Discord webhook URL");
      return;
    }

    localStorage.setItem(DISCORD_WEBHOOK_KEY, tempWebhookUrl);
    setWebhookUrl(tempWebhookUrl);
    setError("");
    setMessage("✓ Webhook URL saved");
    setTimeout(() => setMessage(""), 2000);
  };

  const clearWebhookUrl = () => {
    localStorage.removeItem(DISCORD_WEBHOOK_KEY);
    setWebhookUrl("");
    setTempWebhookUrl("");
    setAutoUpdate(false);
    setMessage("✓ Webhook URL cleared");
    setTimeout(() => setMessage(""), 2000);
  };

  const generateReport = () => {
    const upcoming24h = computed
      .filter((boss) => {
        if (!boss.spawnAt) return false;
        const in24Hours = now + 24 * 60 * 60 * 1000;
        return boss.spawnAt >= now && boss.spawnAt <= in24Hours;
      })
      .sort((a, b) => a.spawnAt - b.spawnAt);

    if (upcoming24h.length === 0) {
      return "No bosses spawning in the next 24 hours.";
    }

    const now_date = new Date(now);
    const lines = [
      `📋 **BOSS SPAWN REPORT** - ${now_date.toLocaleString()}`,
      `Upcoming bosses in next 24 hours: **${upcoming24h.length}**`,
      "",
    ];

    upcoming24h.forEach((boss, idx) => {
      const spawnTime = new Date(boss.spawnAt);
      const timeStr = spawnTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dateStr = spawnTime.toLocaleDateString([], { month: "short", day: "numeric" });
      const durationStr = formatDuration(boss.remaining);
      const bossType = boss.type === "scheduled" ? "🔄" : "⏱️";

      lines.push(`${idx + 1}. [${timeStr}] **${boss.name}** @ ${boss.map} (${durationStr}) ${bossType}`);
    });

    lines.push("");
    lines.push(`**Total:** ${upcoming24h.length} boss spawn(s) in next 24 hours`);

    return lines.join("\n");
  };

  const postToDiscord = async () => {
    if (!webhookUrl) {
      setError("Webhook URL not configured");
      return;
    }

    try {
      setPosting(true);
      setError("");

      const reportText = generateReport();

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reportText,
          username: "Boss Monitor",
          avatar_url: "https://emoji.discadia.com/emojis/22f629f9-32c2-4a89-a8c5-2969978d63c3.PNG",
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      const now_date = new Date();
      setLastPosted(now_date);
      localStorage.setItem(DISCORD_LAST_POST_KEY, now_date.getTime().toString());
      setMessage("✓ Posted to Discord");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Failed to post to Discord:", err);
      setError(`Failed to post: ${err.message}`);
    } finally {
      setPosting(false);
    }
  };

  const toggleAutoUpdate = () => {
    const newValue = !autoUpdate;
    localStorage.setItem(DISCORD_UPDATES_KEY, newValue.toString());
    setAutoUpdate(newValue);
    if (newValue) {
      setMessage("✓ Auto-updates enabled");
    } else {
      setMessage("✓ Auto-updates disabled");
      setNextUpdate(null);
    }
    setTimeout(() => setMessage(""), 2000);
  };

  const changeInterval = (newInterval) => {
    setUpdateInterval(newInterval);
    localStorage.setItem(DISCORD_INTERVAL_KEY, newInterval.toString());
  };

  const getTimeUntilNextUpdate = () => {
    if (!nextUpdate) return null;
    const ms = nextUpdate.getTime() - Date.now();
    if (ms <= 0) return "soon";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold sm:text-lg">Discord Integration</h2>
        <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Post and auto-update reports to Discord.</p>
      </div>

      <div className="space-y-3 sm:space-y-3">
        {/* Webhook URL Setup */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <p className="text-xs font-semibold text-slate-300 mb-2">Webhook URL</p>
          {webhookUrl ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 break-all p-2 bg-black/30 rounded border border-white/10">
                {webhookUrl.substring(0, 50)}...
              </div>
              <button
                onClick={clearWebhookUrl}
                className="w-full rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 active:bg-rose-500/30"
              >
                Remove Webhook
              </button>
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

            {/* Auto-Update Settings */}
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">Auto-Update</p>
                <button
                  onClick={toggleAutoUpdate}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    autoUpdate
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-slate-700/30 text-slate-400 border border-white/10"
                  }`}
                >
                  {autoUpdate ? "ON" : "OFF"}
                </button>
              </div>

              {autoUpdate && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Update Interval</p>
                    <div className="grid grid-cols-4 gap-1">
                      {[5, 10, 15, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => changeInterval(mins)}
                          className={`rounded px-2 py-1 text-xs font-semibold transition ${
                            updateInterval === mins
                              ? "bg-cyan-500 text-slate-950"
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {lastPosted && (
                    <div className="text-xs text-slate-400 pt-1 border-t border-white/10">
                      <div>Last posted: {lastPosted.toLocaleTimeString()}</div>
                      {nextUpdate && (
                        <div className="text-emerald-300 font-semibold">
                          Next update: {getTimeUntilNextUpdate()}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
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
          Updates are sent to Discord every few minutes. Click "Post Report Now" for an immediate update, or enable auto-updates for periodic reports.
        </div>
      </div>
    </div>
  );
}
