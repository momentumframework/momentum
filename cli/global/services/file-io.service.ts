import {
  dirname,
  fromFileUrl,
  join,
  relative,
  SEP,
} from "https://deno.land/std@0.85.0/path/mod.ts";
import { existsSync, Injectable } from "../../deps.ts";
import { FileInfo } from "../models/file-info.dto.ts";

@Injectable()
export class FileIOService {
  get pathDelimiter() {
    return SEP;
  }

  getCliWorkingDirectoryPath(subpath?: string | string[]) {
    let pathParts = dirname(fromFileUrl(import.meta.url))
      .split(this.pathDelimiter);

    // remove the `global/services/` part of the path
    pathParts.pop();
    pathParts.pop();

    if (subpath?.length) {
      pathParts = pathParts.concat(
        Array.isArray(subpath) ? subpath : [subpath],
      );
    }

    return join(...pathParts);
  }

  getUserWorkingDirectoryPath(subpath?: string | string[]) {
    let pathParts = [Deno.cwd()];

    if (subpath?.length) {
      pathParts = pathParts.concat(
        Array.isArray(subpath) ? subpath : [subpath],
      );
    }

    return join(...pathParts);
  }

  getRelativePathBetween(fromFile: string, toFile: string) {
    const fromFileArr = fromFile.split(this.pathDelimiter);
    const toFileArr = toFile.split(this.pathDelimiter);

    fromFileArr.pop();
    const toFileName = toFileArr.pop();

    fromFile = this.joinPaths(...fromFileArr);
    toFile = this.joinPaths(...toFileArr);

    const relativePath = relative(fromFile, toFile).replaceAll(`\\`, `/`);

    if (relativePath === "") {
      return `./${toFileName}`;
    }

    if (relativePath.startsWith(".")) {
      return `${relativePath}/${toFileName}`;
    }

    return `./${relativePath}/${toFileName}`;
  }

  getDirectoryContents(dirPath: string) {
    const dirEntries: Deno.DirEntry[] = [];

    if (!existsSync(dirPath)) {
      return dirEntries;
    }

    for (const dirEntry of Deno.readDirSync(dirPath)) {
      dirEntries.push(dirEntry);
    }

    return dirEntries;
  }

  readFile(filePath: string) {
    return Deno.readTextFileSync(filePath);
  }

  writeFile(filePath: string, contents: string) {
    return Deno.writeTextFileSync(filePath, contents);
  }

  createDirectory(dirPath: string) {
    return Deno.mkdirSync(dirPath);
  }

  joinPaths(...paths: string[]) {
    return join(...paths);
  }

  getFileInfo(pathRelativeToUserDirectory: string) {
    const pathAbsolute = this.getUserWorkingDirectoryPath(
      pathRelativeToUserDirectory,
    );
    const exists = existsSync(pathAbsolute);
    const details: Deno.FileInfo | null = exists
      ? Deno.statSync(pathAbsolute)
      : null;

    return new FileInfo({
      pathRelativeToUserDirectory,
      pathAbsolute,
      exists,
      isFile: details?.isFile ?? false,
      isDirectory: details?.isDirectory ?? false,
    });
  }
}
