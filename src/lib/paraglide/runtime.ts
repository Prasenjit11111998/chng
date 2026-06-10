export function getLocale() {
  return localStorage.getItem("locale") || "en";
}

export function setLocale(newLocale: string, options?: any) {
  localStorage.setItem("locale", newLocale);
  console.log("Locale updated to", newLocale);
}
