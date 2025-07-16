#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";

interface GitHubRepoInfo {
  name: string;
  owner: {
    login: string;
  };
}

async function fetchGitHubRepoInfo(): Promise<GitHubRepoInfo> {
  try {
    const result = await Bun.$`gh repo view --json owner,name`;
    return JSON.parse(result.stdout.toString());
  } catch (error) {
    process.stderr.write("Error fetching GitHub repo info:\n");
    throw error;
  }
}

async function updateReadmeFile(
  filePath: string,
  version: string,
  repoInfo: GitHubRepoInfo
): Promise<void> {
  const content = await Bun.file(filePath).text();

  // Define the blocks to replace
  const blocks = [
    {
      name: "devbox_install",
      content: `\`\`\`bash
devbox add github:${repoInfo.owner.login}/${repoInfo.name}/v${version}#karg
\`\`\``,
    },
    {
      name: "nix_install",
      content: `\`\`\`bash
nix run github:${repoInfo.owner.login}/${repoInfo.name}/v${version}#karg -- --help
\`\`\``,
    },
  ];

  let updatedContent = content;
  let updatedCount = 0;

  // Replace each block
  for (const block of blocks) {
    const startMarker = `<!-- begin:${block.name} - DON'T EDIT: This block will be replaced by CI -->`;
    const endMarker = `<!-- end:${block.name} -->`;

    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");

    const replacement = `${startMarker}\n${block.content}\n${endMarker}`;

    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, replacement);
      updatedCount++;
      process.stdout.write(`✅ Updated ${block.name} block\n`);
    } else {
      process.stderr.write(
        `⚠️  Warning: Could not find ${block.name} block in README\n`
      );
    }
  }

  if (updatedCount > 0) {
    await Bun.write(filePath, updatedContent);
    process.stdout.write(
      `\n✅ Successfully updated ${filePath} (${updatedCount} blocks)\n`
    );
  } else {
    process.stderr.write(`❌ No blocks were updated in ${filePath}\n`);
  }
}

const main = defineCommand({
  meta: {
    name: "update-readme",
    version: "1.0.0",
    description: "Update README.md with the latest version information",
  },
  args: {
    version: {
      type: "string",
      alias: "v",
      description: "Version string (e.g., 0.1.0)",
      required: true,
    },
    "readme-path": {
      type: "string",
      alias: "r",
      description: "Path to README.md file",
      default: "README.md",
    },
  },
  async run({ args }) {
    const { version, "readme-path": readmePath } = args;

    // Validate version format (X.Y.Z)
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      process.stderr.write(
        `Error: Version must be in X.Y.Z format (e.g., 1.0.0), got: ${version}\n`
      );
      process.stderr.write(
        "Note: Do not include 'v' prefix in the version number\n"
      );
      process.exit(1);
    }

    process.stdout.write(`Updating README.md for version v${version}\n`);

    try {
      // Fetch GitHub repository info
      const repoInfo = await fetchGitHubRepoInfo();
      process.stdout.write(
        `GitHub repository: ${repoInfo.owner.login}/${repoInfo.name}\n\n`
      );

      // Update the README file
      await updateReadmeFile(readmePath, version, repoInfo);
    } catch (error) {
      process.stderr.write(`\n❌ Error updating README: ${error}\n`);
      process.exit(1);
    }
  },
});

runMain(main);
