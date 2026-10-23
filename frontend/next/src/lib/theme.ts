// Page themes from the "Login Ojo del Caribe" design: every screen has
// its own animal and palette. The palette itself lives in globals.css
// (`[data-theme="…"]` blocks); this file only decides which theme a
// route uses, so the shell and the backdrop always agree.
export type AppTheme = "tortuga" | "jaguar" | "perezoso";

export function themeForPath(pathname: string): AppTheme {
  if (pathname === "/analytics" || pathname.startsWith("/analytics/")) {
    return "jaguar";
  }
  if (pathname === "/businesses" || pathname.startsWith("/businesses/")) {
    return "perezoso";
  }
  return "tortuga";
}
