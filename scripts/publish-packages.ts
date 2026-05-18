#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const args = Bun.argv.slice(2);

const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.filter((arg) => !arg.startsWith("--"));

const dryRun = flags.has("--dry-run");
const skipChecks = flags.has("--skip-checks");
const skipExisting = flags.has("--skip-existing");

const usage = `Usage: bun run publish:packages [version] [--dry-run] [--skip-checks] [--skip-existing]

Publishes:
  - beeper-cli
  - @beeper/cli-plugin-*

All publishable packages are updated to the same version before publishing.
`;

if (flags.has("--help") || flags.has("-h")) {
  console.log(usage);
  process.exit(0);
}

let version = positional[0];
if (!version) {
  version = prompt("Version to publish (for beeper-cli and @beeper/cli-plugin-*):")?.trim();
}

if (!version || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z-.]+)?$/.test(version)) {
  console.error(`Invalid semver version: ${version ?? "<empty>"}`);
  console.error(usage);
  process.exit(1);
}

const readJson = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path: string, value: unknown) => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
};

const run = async (command: string[], options: { cwd?: string; allowFailure?: boolean } = {}) => {
  console.log(`$ ${command.join(" ")}`);
  const proc = Bun.spawn(command, {
    cwd: options.cwd ?? root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0 && !options.allowFailure) {
    throw new Error(`Command failed (${code}): ${command.join(" ")}`);
  }
  return code;
};

const packagesDir = join(root, "packages");
const packageDirs = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name));

const packageJsonPaths = packageDirs
  .map((dir) => join(dir, "package.json"))
  .filter((path) => existsSync(path));

const packages = await Promise.all(
  packageJsonPaths.map(async (path) => ({ path, dir: dirname(path), json: await readJson(path) })),
);

const publishable = packages.filter(
  (pkg) => pkg.json.name === "beeper-cli" || /^@beeper\/cli-plugin-/.test(pkg.json.name),
);

if (publishable.length === 0) {
  throw new Error("No publishable packages found.");
}

const publishableNames = new Set(publishable.map((pkg) => pkg.json.name));
const pluginNames = [...publishableNames].filter((name) => name.startsWith("@beeper/cli-plugin-"));

for (const pkg of publishable) {
  pkg.json.version = version;

  for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const) {
    const deps = pkg.json[section];
    if (!deps) continue;
    for (const depName of Object.keys(deps)) {
      if (publishableNames.has(depName)) deps[depName] = `^${version}`;
    }
  }

  if (pkg.json.name === "beeper-cli") {
    pkg.json.bin ??= {};
    if (pkg.json.bin.beeper === "./bin/run.js") pkg.json.bin.beeper = "bin/run.js";

    pkg.json.oclif ??= {};
    pkg.json.oclif.jitPlugins ??= {};
    for (const pluginName of pluginNames) {
      pkg.json.oclif.jitPlugins[pluginName] = `^${version}`;
    }
  }

  await writeJson(pkg.path, pkg.json);
}

console.log(`Updated ${publishable.length} package.json file(s) to ${version}:`);
for (const pkg of publishable) console.log(`  - ${pkg.json.name}@${version}`);

await run(["bun", "install", "--lockfile-only"]);

if (!skipChecks) {
  await run(["bun", "run", "check"]);
} else {
  console.warn("Skipping checks because --skip-checks was provided.");
}

const ordered = [
  ...publishable.filter((pkg) => pkg.json.name === "beeper-cli"),
  ...publishable.filter((pkg) => pkg.json.name !== "beeper-cli").sort((a, b) => a.json.name.localeCompare(b.json.name)),
];

for (const pkg of ordered) {
  if (skipExisting) {
    const code = await run(["npm", "view", `${pkg.json.name}@${version}`, "version"], { allowFailure: true });
    if (code === 0) {
      console.log(`Skipping already-published ${pkg.json.name}@${version}`);
      continue;
    }
  }

  const command = ["npm", "publish", "--access", "public"];
  if (dryRun) command.push("--dry-run");
  await run(command, { cwd: pkg.dir });
}

console.log(dryRun ? "Dry run complete." : `Published ${ordered.length} package(s) at ${version}.`);
