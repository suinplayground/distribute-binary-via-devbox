#!/usr/bin/env bun
import { existsSync, mkdirSync } from "node:fs";
import { $ } from "bun";
import { defineCommand, runMain } from "citty";

// Platform configuration
interface Platform {
  name: string;
  bunTarget: string;
  archName: string;
  displayName: string;
}

const PLATFORMS: Array<Platform> = [
  {
    name: "linux-x64",
    bunTarget: "bun-linux-x64",
    archName: "x86_64-linux",
    displayName: "Linux x86_64",
  },
  {
    name: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    archName: "aarch64-linux",
    displayName: "Linux ARM64",
  },
  {
    name: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    archName: "x86_64-darwin",
    displayName: "macOS x86_64",
  },
  {
    name: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    archName: "aarch64-darwin",
    displayName: "macOS ARM64",
  },
];

// Build functions
function prepareBuildDirectory() {
  if (!existsSync("dist")) {
    mkdirSync("dist", { recursive: true });
  }
}

async function buildBinary(platform: Platform, version: string) {
  // Add 'v' prefix to archive names for consistency with Git tags
  const archiveVersion = version === "dev" ? version : `v${version}`;
  const targetDir = `karg-${archiveVersion}-${platform.archName}`;
  const outputPath = `dist/${targetDir}/karg`;

  process.stdout.write(`Building binary for ${platform.displayName}...\n`);

  await $`bun build --compile --target=${platform.bunTarget} ./ts/cli/index.ts --outfile=${outputPath} --define 'Bun.env.VERSION="${version}"'`;

  return targetDir;
}

async function createArchive(targetDir: string, platform: Platform) {
  process.stdout.write(`Creating archive for ${platform.displayName}...\n`);

  await $`cd dist && tar -czf ${targetDir}.tar.gz ${targetDir}/karg`;
  await $`rm -rf dist/${targetDir}`;
}

async function buildPlatform(
  platform: Platform,
  version: string,
  options: { binariesOnly?: boolean; archivesOnly?: boolean }
) {
  if (options.archivesOnly) {
    // For archives-only mode, check if binary exists
    const archiveVersion = version === "dev" ? version : `v${version}`;
    const targetDir = `karg-${archiveVersion}-${platform.archName}`;
    const binaryPath = `dist/${targetDir}/karg`;

    if (!existsSync(binaryPath)) {
      process.stdout.write(
        `Binary not found for ${platform.displayName}, building it first...\n`
      );
      await buildBinary(platform, version);
    }

    await createArchive(targetDir, platform);
  } else {
    const targetDir = await buildBinary(platform, version);

    if (!options.binariesOnly) {
      await createArchive(targetDir, platform);
    }
  }
}

// Define the CLI command
const main = defineCommand({
  meta: {
    name: "build",
    version: "1.0.0",
    description: "Build KARG binaries for multiple platforms",
  },
  args: {
    version: {
      type: "string",
      alias: "v",
      description: "Version string for the build",
      default: "dev",
    },
    platform: {
      type: "string",
      alias: "p",
      description: `Build only for specific platform: ${PLATFORMS.map((p) => p.name).join(", ")}`,
      required: false,
    },
    "binaries-only": {
      type: "boolean",
      alias: "b",
      description: "Build only binaries, skip archive creation",
      default: false,
    },
    "archives-only": {
      type: "boolean",
      alias: "a",
      description: "Create only archives from existing binaries",
      default: false,
    },
  },
  async run({ args }) {
    const {
      version,
      platform: selectedPlatform,
      "binaries-only": binariesOnly,
      "archives-only": archivesOnly,
    } = args;

    if (binariesOnly && archivesOnly) {
      process.stderr.write(
        "Error: Cannot use --binaries-only and --archives-only together\n"
      );
      process.exit(1);
    }

    // Validate version format (X.Y.Z)
    if (version !== "dev" && !/^\d+\.\d+\.\d+$/.test(version)) {
      process.stderr.write(
        `Error: Version must be in X.Y.Z format (e.g., 1.0.0), got: ${version}\n`
      );
      process.stderr.write(
        "Note: Do not include 'v' prefix in the version number\n"
      );
      process.exit(1);
    }

    process.stdout.write(`Building KARG version: ${version}\n`);

    prepareBuildDirectory();

    // Filter platforms if specific one is requested
    const platformsToBuild = selectedPlatform
      ? PLATFORMS.filter((p) => p.name === selectedPlatform)
      : PLATFORMS;

    if (selectedPlatform && platformsToBuild.length === 0) {
      process.stderr.write(`Error: Unknown platform '${selectedPlatform}'\n`);
      process.stderr.write(
        `Available platforms: ${PLATFORMS.map((p) => p.name).join(", ")}\n`
      );
      process.exit(1);
    }

    // Build all platforms sequentially
    for (const platform of platformsToBuild) {
      try {
        // biome-ignore lint/nursery/noAwaitInLoop: we choose sequential build for simplicity and stability
        await buildPlatform(platform, version, { binariesOnly, archivesOnly });
      } catch (error) {
        process.stderr.write(
          `Error building ${platform.displayName}: ${error}\n`
        );
        process.exit(1);
      }
    }

    process.stdout.write("\n✅ Build completed successfully!\n");

    // List created files
    try {
      const result = await $`ls -1 dist/*.tar.gz 2>/dev/null || true`.text();
      const files = result
        .trim()
        .split("\n")
        .filter((f) => f);
      if (files.length > 0) {
        process.stdout.write("\nCreated files:\n");
        for (const file of files) {
          const fileName = file.replace("dist/", "");
          process.stdout.write(`  - ${fileName}\n`);
        }
      }
    } catch (_error) {
      // Ignore errors from ls command
    }
  },
});

// Run the CLI
runMain(main);
