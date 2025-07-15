#!/usr/bin/env bun
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";
import { defineCommand, runMain } from "citty";

interface Platform {
  name: string;
  nixName: string;
}

const PLATFORMS: Array<Platform> = [
  { name: "x86_64-linux", nixName: "x86_64-linux" },
  { name: "aarch64-linux", nixName: "aarch64-linux" },
  { name: "x86_64-darwin", nixName: "x86_64-darwin" },
  { name: "aarch64-darwin", nixName: "aarch64-darwin" },
];

async function calculateHashFromLocalFile(filePath: string): Promise<string> {
  process.stdout.write(`Calculating hash for ${filePath}...\n`);

  try {
    // Calculate SRI hash directly using nix hash
    const sriHash =
      await $`nix hash file --type sha256 --sri ${filePath}`.text();
    return sriHash.trim();
  } catch (error) {
    process.stderr.write(`Error hashing ${filePath}: ${error}\n`);
    throw error;
  }
}

function updateFlakeFile(
  filePath: string,
  version: string,
  hashes: Map<string, string>
) {
  let content = readFileSync(filePath, "utf-8");

  // Update version
  content = content.replace(/version = ".*";/, `version = "${version}";`);

  process.stdout.write(`Updated version to ${version}\n`);

  // Update hashes for each platform
  for (const [platform, hash] of hashes) {
    // Match the platform hash pattern: "platform" = { hash = "..."; };
    const platformPattern = `"${platform}"\\s*=\\s*{\\s*hash\\s*=\\s*"[^"]*"`;
    const replacement = `"${platform}" = {\n            hash = "${hash}"`;

    const regex = new RegExp(platformPattern);
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      process.stdout.write(`Updated hash for ${platform}\n`);
    } else {
      process.stderr.write(
        `Warning: Could not find hash location for ${platform}\n`
      );
    }
  }

  writeFileSync(filePath, content, "utf-8");
  process.stdout.write(`\n✅ Successfully updated ${filePath}\n`);
}

const main = defineCommand({
  meta: {
    name: "update-flake-local",
    version: "1.0.0",
    description: "Update flake.nix with hashes from local build artifacts",
  },
  args: {
    version: {
      type: "string",
      alias: "v",
      description: "Version string (e.g., 0.1.0)",
      required: true,
    },
    "dist-dir": {
      type: "string",
      alias: "d",
      description: "Directory containing built artifacts",
      default: "dist",
    },
    "flake-path": {
      type: "string",
      alias: "f",
      description: "Path to flake.nix file",
      default: "packaging/flake.nix",
    },
  },
  async run({ args }) {
    const { version, "dist-dir": distDir, "flake-path": flakePath } = args;

    process.stdout.write(`Updating flake.nix for version ${version}\n`);
    process.stdout.write(`Using artifacts from: ${distDir}\n`);
    process.stdout.write(`Flake path: ${flakePath}\n\n`);

    // Collect hashes for all platforms
    const hashes = new Map<string, string>();

    try {
      // Read all tar.gz files from dist directory
      const files = readdirSync(distDir);
      const tarFiles = files.filter((f) => f.endsWith(".tar.gz"));

      if (tarFiles.length === 0) {
        throw new Error(`No .tar.gz files found in ${distDir}`);
      }

      // Process each platform
      for (const platform of PLATFORMS) {
        // Find the corresponding file
        const pattern = new RegExp(
          `rdd-${version}-${platform.name}\\.tar\\.gz$`
        );
        const file = tarFiles.find((f) => pattern.test(f));

        if (!file) {
          process.stderr.write(`Warning: No file found for ${platform.name}\n`);
          continue;
        }

        const filePath = join(distDir, file);
        const hash = await calculateHashFromLocalFile(filePath);
        hashes.set(platform.nixName, hash);
      }

      if (hashes.size === 0) {
        throw new Error("No hashes calculated");
      }

      // Update the flake file
      updateFlakeFile(flakePath, version, hashes);
    } catch (error) {
      process.stderr.write(`\n❌ Error updating flake: ${error}\n`);
      process.exit(1);
    }
  },
});

runMain(main);
