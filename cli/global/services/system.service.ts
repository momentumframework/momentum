import { Injectable } from "../../deps.ts";

@Injectable()
export class SystemService {
  async executeCommand(cmd: string[]) {
    const p = Deno.run({ cmd, stderr: "piped", stdout: "piped" });

    const [status, stdoutBytes, stderrBytes] = await Promise.all([
      p.status(),
      p.output(),
      p.stderrOutput(),
    ]);
    p.close();

    const stdout = new TextDecoder("utf-8").decode(stdoutBytes);
    const stderror = new TextDecoder("utf-8").decode(stderrBytes);

    return {
      status,
      stdout,
      stderror,
    };
  }
}
