import * as path from "https://deno.land/std@0.85.0/path/mod.ts";
import { existsSync, Injectable } from "../../deps.ts";

@Injectable()
export class FileIOService {
  get pathDelimiter() {
    return path.SEP;
  }

  getCliWorkingDirectoryPath(subpath?: string | string[]) {
    let pathParts = path
      .dirname(path.fromFileUrl(import.meta.url))
      .split(this.pathDelimiter);

    // remove the `global/services/` part of the path
    pathParts.pop();
    pathParts.pop();

    if (subpath?.length) {
      pathParts = pathParts.concat(
        Array.isArray(subpath) ? subpath : [subpath],
      );
    }

    return path.join(...pathParts);
  }

  getUserWorkingDirectoryPath(subpath?: string | string[]) {
    let pathParts = [Deno.cwd()];

    if (subpath?.length) {
      pathParts = pathParts.concat(
        Array.isArray(subpath) ? subpath : [subpath],
      );
    }

    return path.join(...pathParts);
  }

  getRelativePathBetween(from: string, to: string) {
    return path.relative(from, to);
  }

  getDirectoryContents(path: string) {
    const dirEntries = [];
    for (const dirEntry of Deno.readDirSync(path)) {
      dirEntries.push(dirEntry);
    }
    return dirEntries;
  }

  recursiveFileSearch(fileName: string, options?: {
    maxDirectoryAttempts?: number;
    findType?: "equals" | "endsWith";
  }) {
    let attempts = 0;

    if (!options) {
      options = {
        maxDirectoryAttempts: 1,
        findType: "equals",
      };
    }
    if (!options.maxDirectoryAttempts) {
      options.maxDirectoryAttempts = 1;
    }
    if (!options.findType) {
      options.findType = "equals";
    }

    while (attempts < options.maxDirectoryAttempts) {
      const folderPath = [];
      for (let i = 0; i < attempts; i++) {
        folderPath.push("..");
      }

      const files = this.getDirectoryContents(
        this.getUserWorkingDirectoryPath(
          path.join(...folderPath),
        ),
      );

      const file = options.findType === "equals"
        ? files.find((f) => f.name === fileName)
        : files.find((f) => f.name.endsWith(fileName));

      if (file) {
        return attempts >= 1
          ? [folderPath, file.name].join("/")
          : `./${file.name}`;
      }
      attempts++;
    }

    return `./${fileName}`;
  }

  readFile(path: string) {
    return Deno.readTextFileSync(path);
  }

  writeFile(path: string, contents: string) {
    return Deno.writeTextFileSync(path, contents);
  }

  doesPathExist(path: string) {
    return existsSync(path);
  }
}
