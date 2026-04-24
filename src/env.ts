import { resolve, dirname } from "node:path";

export const loadEnv = async (): Promise<void> => {
  const scriptDir = dirname(Bun.main);
  const projectRoot = resolve(scriptDir, "../..");
  const envPath = resolve(projectRoot, ".env");

  const envFile = Bun.file(envPath);
  if (!(await envFile.exists())) return;

  const envContent = await envFile.text();
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const raw = trimmed.slice(eqIndex + 1).trim();
    const value = raw.replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};
