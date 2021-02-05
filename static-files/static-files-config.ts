export interface StaticFilesConfig {
  contentRoot: string;
  serverRoot: string;
  mimeMap?: Record<string, string>;
}

export const defaultConfig = {
  mimeMap: {
    ".css": "text/css",
    ".eot": "application/vnd.ms-fontobject",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".html": "text/html",
    ".jpeg": "image/jpeg",
    ".js": "application/javascript",
    ".json": "application/json",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".otf": "application/font-sfnt",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".tgz": "application/x-compressed",
    ".ttf": "application/font-sfnt",
    ".txt": "text/plain",
    ".wasm": "application/wasm",
    ".wav": "audio/wav",
    ".woff": "application/font-woff",
    ".woff2": "application/font-woff2",
    ".zip": "application/zip",
  },
  contentRoot: "./src/content",
  serverRoot: "/content",
};
