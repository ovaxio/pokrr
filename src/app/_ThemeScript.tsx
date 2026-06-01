// Script inline injecté avant l'hydration React pour éviter le flash light/dark.
// Lit localStorage + matchMedia synchroniquement et applique `.dark` au <html>.
const script = `(function() {
  try {
    var pref = localStorage.getItem('pokrr:theme');
    var dark;
    if (pref === 'light') dark = false;
    else if (pref === 'dark') dark = true;
    else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();`;

export default function ThemeScript({ nonce }: { nonce?: string | null }) {
  return <script nonce={nonce ?? undefined} dangerouslySetInnerHTML={{ __html: script }} />;
}
