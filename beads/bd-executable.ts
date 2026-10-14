import { posix, win32 } from "node:path";

/** A configured tool is bd on PATH, or an absolute path to bd/bd.exe. */
export function isBdExecutable(command: string): boolean {
  if (/[\x00-\x1f\x7f]/.test(command)) return false;
  if (command === "bd" || command === "bd.exe") return true;
  const path = command.startsWith("/") ? posix : win32;
  return path.isAbsolute(command) && /^(bd|bd\.exe)$/.test(path.basename(command));
}
