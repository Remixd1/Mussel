/** Dev-time notice before .env.local is filled in (CLAUDE.md §17). */
export function FirebaseUnavailableNotice() {
  return (
    <p className="form-error" role="note">
      Firebase isn't configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and
      add your web app config, or set <code>VITE_USE_EMULATORS=true</code>.
    </p>
  );
}
