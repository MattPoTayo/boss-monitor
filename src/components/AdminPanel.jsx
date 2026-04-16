import { useState } from "react";
import { setUserAsAdmin } from "../services/userService";

export function AdminPanel({ user, isAdmin }) {
  const [userEmail, setUserEmail] = useState("");
  const [setting, setSetting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSetAdmin = async () => {
    if (!userEmail.trim()) {
      setMessage("Please enter a user email.");
      return;
    }

    try {
      setSetting(true);
      setMessage("");
      
      // In a real app, you'd need a backend to properly set admin status
      // For now, show instructions
      setMessage(`To make ${userEmail} an admin, you would need a backend endpoint or security rules configured in Firestore. Currently, direct client-side changes to admin status are not recommended for security reasons.`);
      
      setUserEmail("");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update admin status.");
    } finally {
      setSetting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur space-y-3">
      <div>
        <h3 className="text-base font-semibold">Admin Panel</h3>
        <p className="text-xs text-slate-400 mt-0.5">Manage administrator users</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-slate-300">User Email</label>
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
      </div>

      <button
        onClick={handleSetAdmin}
        disabled={setting || !userEmail.trim()}
        className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 active:bg-cyan-500"
      >
        {setting ? "Setting..." : "Make Admin"}
      </button>

      {message && (
        <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-2 text-xs text-blue-200">
          {message}
        </div>
      )}

      <div className="text-xs text-slate-400 p-2 bg-black/30 rounded-lg">
        <p className="font-semibold mb-1">Note:</p>
        <p>For security, admin status should be managed through Firebase Security Rules or a trusted backend. Use the Firebase Console to set the <code className="bg-black/50 px-1">isAdmin</code> field to <code className="bg-black/50 px-1">true</code> in user documents.</p>
      </div>
    </div>
  );
}
