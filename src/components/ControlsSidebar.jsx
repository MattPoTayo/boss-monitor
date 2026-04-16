import { AddBossForm } from "./AddBossForm";
import { AddScheduledBossForm } from "./AddScheduledBossForm";
import { NotificationSettings } from "./NotificationSettings";
import { CalendarExport } from "./CalendarExport";
import { UpcomingBossesReport } from "./UpcomingBossesReport";
import { DiscordIntegration } from "./DiscordIntegration";
import { AdminPanel } from "./AdminPanel";
import { useIsAdmin } from "../hooks/useIsAdmin";

export function ControlsSidebar({
  isOpen,
  onClose,
  user,
  bosses,
  computed,
  now,
  name,
  setName,
  map,
  setMap,
  respawnDays,
  setRespawnDays,
  respawnHours,
  setRespawnHours,
  respawnMinutesPart,
  setRespawnMinutesPart,
  submitting,
  onAddBoss,
  onSeedDefaults,
  scheduledName,
  setScheduledName,
  scheduledMap,
  setScheduledMap,
  onAddScheduledBoss,
  notifyLeadMinutes,
  setNotifyLeadMinutes,
  notificationPermission,
  savingNotifications,
  notificationMessage,
  onEnableBrowserNotifications,
  onSaveNotificationLeadTime,
}) {
  const { isAdmin } = useIsAdmin(user?.uid);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 w-80 bg-slate-950 border-r border-white/10 flex flex-col gap-4 overflow-y-auto p-4 transform transition-transform duration-300 ease-in-out z-50 lg:z-auto lg:transform-none lg:w-80 lg:flex-shrink-0 lg:border-r lg:p-4 scroll-wrapper ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={onClose}
          className="lg:hidden mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 active:bg-white/15"
        >
          <span>Close Controls</span>
          <span>✕</span>
        </button>

        {/* Forms and Settings */}
        <div className="space-y-4 lg:space-y-3">
          {isAdmin && (
            <>
              <AddBossForm
                user={user}
                name={name}
                setName={setName}
                map={map}
                setMap={setMap}
                respawnDays={respawnDays}
                setRespawnDays={setRespawnDays}
                respawnHours={respawnHours}
                setRespawnHours={setRespawnHours}
                respawnMinutesPart={respawnMinutesPart}
                setRespawnMinutesPart={setRespawnMinutesPart}
                bosses={bosses}
                submitting={submitting}
                onAddBoss={onAddBoss}
                onSeedDefaults={onSeedDefaults}
              />

              <AddScheduledBossForm
                user={user}
                name={scheduledName}
                setName={setScheduledName}
                map={scheduledMap}
                setMap={setScheduledMap}
                submitting={submitting}
                onAddScheduledBoss={onAddScheduledBoss}
              />
            </>
          )}

          <NotificationSettings
            user={user}
            notifyLeadMinutes={notifyLeadMinutes}
            setNotifyLeadMinutes={setNotifyLeadMinutes}
            notificationPermission={notificationPermission}
            savingNotifications={savingNotifications}
            notificationMessage={notificationMessage}
            onEnableBrowserNotifications={onEnableBrowserNotifications}
            onSaveNotificationLeadTime={onSaveNotificationLeadTime}
          />

          <UpcomingBossesReport computed={computed} now={now} />

          <DiscordIntegration computed={computed} now={now} />

          <CalendarExport computed={computed} />

          {isAdmin && <AdminPanel user={user} isAdmin={isAdmin} />}
        </div>
      </div>
    </>
  );
}
