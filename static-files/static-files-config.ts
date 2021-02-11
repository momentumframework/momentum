export interface StaticFilesConfig {
  /**
   * Path from which to serve static files. By default this is /content
   */
  contentRoot: string;
  /**
   * Path on the server where the static files are located. By default this is /src/content
   */
  serverRoot: string;
  /**
   * Map of custom mime types by file extension
   */
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
