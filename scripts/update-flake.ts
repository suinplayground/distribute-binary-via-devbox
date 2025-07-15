#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
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

async function downloadAndHashAsset(
  repository: string,
  version: string,
  platform: string
): Promise<string> {
  const assetName = `rdd-${version}-${platform}.tar.gz`;
  const url = `https://github.com/${repository}/releases/download/${version}/${assetName}`;

  process.stdout.write(`Downloading and hashing ${assetName}...\n`);

  try {
    // Download and calculate hash using nix-prefetch-url
    const hashResult = await $`nix-prefetch-url --unpack ${url}`.text();
    const hash256 = hashResult.trim();

    // Convert to SRI format
    const sriHash = await $`nix hash to-sri --type sha256 ${hash256}`.text();
    return sriHash.trim();
  } catch (error) {
    process.stderr.write(`\nError processing ${platform}: ${error}\n`);
    process.stderr.write(`Failed to download/hash: ${url}\n`);
    process.stderr.write(
      "Make sure the release assets are uploaded to GitHub\n"
    );
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
    name: "update-flake",
    version: "1.0.0",
    description: "Update flake.nix with new version and hashes after a release",
  },
  args: {
    version: {
      type: "string",
      alias: "v",
      description: "Version tag for the release (e.g., v0.1.0)",
      required: true,
    },
    repository: {
      type: "string",
      alias: "r",
      description: "GitHub repository in format owner/repo",
      default: "appthrust/rdd",
    },
    "flake-path": {
      type: "string",
      alias: "f",
      description: "Path to flake.nix file",
      default: "packaging/flake.nix",
    },
    "dry-run": {
      type: "boolean",
      alias: "d",
      description: "Show what would be changed without modifying files",
      default: false,
    },
  },
  async run({ args }) {
    const {
      version,
      repository,
      "flake-path": flakePath,
      "dry-run": dryRun,
    } = args;

    process.stdout.write(`Updating flake.nix for release ${version}\n`);
    process.stdout.write(`Repository: ${repository}\n`);
    process.stdout.write(`Flake path: ${flakePath}\n\n`);

    // Collect hashes for all platforms
    const hashes = new Map<string, string>();

    try {
      // Process all platforms in parallel for speed
      const hashPromises = PLATFORMS.map(async (platform) => {
        const hash = await downloadAndHashAsset(
          repository,
          version,
          platform.name
        );
        return { platform: platform.nixName, hash };
      });

      const results = await Promise.all(hashPromises);

      for (const { platform, hash } of results) {
        hashes.set(platform, hash);
      }

      if (dryRun) {
        process.stdout.write("\n🔍 Dry run mode - no files will be modified\n");
        process.stdout.write("\nWould update flake.nix with:\n");
        process.stdout.write(`  version = "${version}";\n`);
        for (const [platform, hash] of hashes) {
          process.stdout.write(`  ${platform}.hash = "${hash}";\n`);
        }
      } else {
        // Update the flake file
        updateFlakeFile(flakePath, version, hashes);
      }
    } catch (error) {
      process.stderr.write(`\n❌ Error updating flake: ${error}\n`);
      process.exit(1);
    }
  },
});

runMain(main);
