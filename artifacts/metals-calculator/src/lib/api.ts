export function getApiBase(): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api`;
}

export function getAuthApiBase(): string {
  const remoteUrl = import.meta.env.VITE_VISION_API_URL;
  if (remoteUrl) return remoteUrl.replace(/\/$/, "");
  return getApiBase();
}
