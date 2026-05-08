import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";

export function UserManagement({ user, isAdmin, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [settingNewAdmin, setSettingNewAdmin] = useState(false);

  // Load users from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("Loading users from Firestore...");
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        console.log(`Found ${snapshot.size} users in Firestore`);
        const usersList = snapshot.docs.map((doc) => {
          console.log("User doc:", doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
          };
        });
        console.log("Loaded users:", usersList);
        setUsers(usersList.length > 0 ? usersList : []);
      } catch (err) {
        console.error("Failed to load users - Full error:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        setError(`Failed to load users: ${err.message}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      setLoading(true);
      console.log("Refreshing users...");
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      console.log(`Found ${snapshot.size} users in Firestore`);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Refreshed users:", usersList);
      setUsers(usersList);
      setError("");
    } catch (err) {
      console.error("Failed to refresh users:", err);
      setError(`Failed to refresh: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId, currentIsAdmin) => {
    try {
      setUpdating(userId);
      setError("");

      await updateDoc(doc(db, "users", userId), {
        isAdmin: !currentIsAdmin,
        updatedAt: new Date().toISOString(),
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u
        )
      );

      const userObj = users.find((u) => u.id === userId);
      setMessage(
        `✓ ${userObj.email} is now ${!currentIsAdmin ? "admin" : "regular user"}`
      );
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(`Failed to update admin status: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const promoteNewAdmin = async () => {
    if (!userEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    try {
      setSettingNewAdmin(true);
      setError("");

      // Create or update user document
      const userData = {
        email: userEmail.toLowerCase(),
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Find if user exists by email
      const existingUser = users.find(
        (u) => u.email?.toLowerCase() === userEmail.toLowerCase()
      );

      if (existingUser) {
        if (existingUser.isAdmin) {
          setMessage("✓ This user is already an admin");
        } else {
          await updateDoc(doc(db, "users", existingUser.id), {
            isAdmin: true,
            updatedAt: new Date().toISOString(),
          });
          setUsers((prev) =>
            prev.map((u) =>
              u.id === existingUser.id ? { ...u, isAdmin: true } : u
            )
          );
          setMessage(`✓ ${userEmail} is now an admin`);
        }
      } else {
        // Create new admin user entry
        const newUserId = userEmail.toLowerCase().replace(/[^a-z0-9]/g, "");
        await setDoc(doc(db, "users", newUserId), userData);
        setUsers((prev) => [...prev, { id: newUserId, ...userData }]);
        setMessage(`✓ New admin created: ${userEmail}`);
      }

      setUserEmail("");
      // Refresh the full user list from Firestore to ensure sync
      await refreshUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Failed to create/promote admin:", err);
      setError(`Failed: ${err.message}`);
    } finally {
      setSettingNewAdmin(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="rounded-[20px] border border-rose-400/20 bg-rose-500/10 p-6 text-center max-w-sm">
          <h2 className="text-lg font-semibold text-rose-300 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-rose-200">
            Only administrators can access the user management page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage admin status and user permissions
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 active:bg-white/15"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      {/* Promote New Admin */}
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold mb-3">Promote New Admin</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            onClick={promoteNewAdmin}
            disabled={settingNewAdmin || !userEmail.trim()}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed active:bg-cyan-600"
          >
            {settingNewAdmin ? "Setting..." : "Make Admin"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Create a new admin or promote an existing user to admin status
        </p>
      </div>

      {/* Users List */}
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Users ({users.length})</h2>
          <button
            onClick={refreshUsers}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Refresh user list"
          >
            🔄
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-slate-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-slate-400 mb-2">No users created yet</p>
              <p className="text-xs text-slate-500">Use the "Promote New Admin" section above to add users</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {u.email || u.displayName || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      ID: {u.id}
                    </p>
                    {u.createdAt && (
                      <p className="text-xs text-slate-500">
                        Created: {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.isAdmin && (
                      <span className="rounded-full bg-cyan-500/20 border border-cyan-400/50 px-2 py-1 text-xs font-semibold text-cyan-300">
                        Admin
                      </span>
                    )}
                    {u.id !== user?.uid && (
                      <button
                        onClick={() => toggleAdminStatus(u.id, u.isAdmin)}
                        disabled={updating === u.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          u.isAdmin
                            ? "border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                            : "border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {updating === u.id
                          ? "Updating..."
                          : u.isAdmin
                            ? "Remove Admin"
                            : "Make Admin"}
                      </button>
                    )}
                    {u.id === user?.uid && (
                      <span className="text-xs text-slate-400 italic">
                        (You)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-3 text-xs text-blue-200">
        <p className="font-semibold mb-1">ℹ️ User Management</p>
        <ul className="space-y-1 text-blue-100">
          <li>• Only admins can see this page</li>
          <li>• Toggle user admin status by clicking the buttons</li>
          <li>• Admins can add bosses, edit settings, and access Discord integration</li>
          <li>• You cannot remove your own admin status</li>
        </ul>
      </div>
    </div>
  );
}
