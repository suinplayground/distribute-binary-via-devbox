#!/usr/bin/env bun
import { readdirSync } from "node:fs";
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

async function updateFlakeFile(
  filePath: string,
  version: string,
  hashes: Map<string, string>
): Promise<void> {
  const content = await Bun.file(filePath).text();

  // Build replacements object with version and hashes
  const replacements: Record<string, string> = {
    version: `version = "${version}";`,
  };

  // Add hash replacements using the platform names as tags
  for (const [platform, hash] of hashes) {
    // The tags in flake.nix match the platform names exactly
    replacements[platform] = `hash = "${hash}";`;
  }

  const mustReplace = new Set<string>(Object.keys(replacements));
  const replaced = new Set<string>();

  // Replace all lines that have comment tags
  const result = content.replaceAll(
    /^([ \t]*).+#([a-z0-9_-]+).*$/gm,
    (match, indent, tag) => {
      const replacement = replacements[tag];
      if (!replacement) {
        // If no replacement for this tag, keep the original line
        return match;
      }
      mustReplace.delete(tag);
      replaced.add(tag);
      process.stdout.write(`Updated ${tag}\n`);
      return `${indent}${replacement} #${tag} - This line is replaced by CI`;
    }
  );

  // Check if all expected replacements were made
  if (mustReplace.size > 0) {
    const missing = Array.from(mustReplace).join(", ");
    process.stderr.write(`⚠️  Warning: Could not find tags in flake.nix: ${missing}\n`);
  }
  
  if (replaced.size > 0) {
    process.stdout.write(`\n✅ Made ${replaced.size} replacements\n`);
  }

  await Bun.write(filePath, result);
  process.stdout.write(`✅ Successfully updated ${filePath}\n`);
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
      await updateFlakeFile(flakePath, version, hashes);
    } catch (error) {
      process.stderr.write(`\n❌ Error updating flake: ${error}\n`);
      process.exit(1);
    }
  },
});

runMain(main);
