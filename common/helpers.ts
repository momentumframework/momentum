export function trimSlashes(path?: string) {
  return path?.replace(/^[\/]+|[\/]+$/g, "");
}

export function trimTrailingSlashes(path?: string) {
  return path?.replace(/^|[\/]+$/g, "");
}
