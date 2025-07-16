#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { defineCommand, runMain } from "citty";
import { glob } from "glob";
import { convertCRDsToDocuments } from "../models/converter.js";
import type { CustomResourceDefinition } from "../models/crd.js";
import type { DocumentModel } from "../models/document.js";
import { parseContent } from "../reader/yaml.js";
import {
  renderAPIDocumentation,
  renderCombinedDocumentation,
} from "../writer/markdown.js";

const main = defineCommand({
  meta: {
    name: "karg",
    version:
      // @ts-expect-error
      Bun.env.VERSION ?? "dev",
    description:
      "KARG - Kubernetes API Reference Generator. Generate markdown documentation from Kubernetes CRD YAML files",
  },
  args: {
    input: {
      type: "string",
      description: "Glob pattern for input CRD YAML files",
      required: true,
    },
    "output-directory": {
      type: "string",
      description: "Output directory for generated markdown files",
      required: false,
    },
    "output-file": {
      type: "string",
      description:
        "Output file for single file mode (alternative to --output-directory)",
      required: false,
    },
    verbose: {
      type: "boolean",
      description: "Enable verbose logging",
      default: false,
    },
  },
  async run({ args }) {
    const {
      input,
      "output-directory": outputDirectory,
      "output-file": outputFile,
      verbose,
    } = args;

    validateArgs(outputDirectory, outputFile);

    try {
      const documentModel = await findAndParseFiles(input, verbose);

      if (outputFile) {
        generateSingleFileOutput(outputFile, documentModel, verbose);
      } else {
        generateMultiFileOutput(outputDirectory, documentModel, verbose);
      }
    } catch (error) {
      process.stderr.write(`Error: ${error}\n`);
      process.exit(1);
    }
  },
});

function validateArgs(
  outputDirectory: string | undefined,
  outputFile: string | undefined
): void {
  if (!(outputDirectory || outputFile)) {
    process.stderr.write(
      "Error: Either --output-directory or --output-file must be specified\n"
    );
    process.exit(1);
  }

  if (outputDirectory && outputFile) {
    process.stderr.write(
      "Error: --output-directory and --output-file cannot be used together\n"
    );
    process.exit(1);
  }
}

async function findAndParseFiles(input: string, verbose: boolean) {
  const inputFiles = await glob(input);

  if (inputFiles.length === 0) {
    process.stderr.write(`No files found matching pattern: ${input}\n`);
    process.exit(1);
  }

  if (verbose) {
    process.stdout.write(`Found ${inputFiles.length} files:\n`);
    for (const file of inputFiles) {
      process.stdout.write(`  - ${file}\n`);
    }
  }

  const allCRDs: Array<CustomResourceDefinition> = [];
  for (const file of inputFiles) {
    try {
      const content = readFileSync(file, "utf8");
      const crds = parseContent(content);
      allCRDs.push(...crds);
      if (verbose) {
        process.stdout.write(`Parsed ${crds.length} CRDs from ${file}\n`);
      }
    } catch (error) {
      process.stderr.write(`Error parsing ${file}: ${error}\n`);
      process.exit(1);
    }
  }

  if (allCRDs.length === 0) {
    process.stderr.write("No CRDs found in input files\n");
    process.exit(1);
  }

  return convertCRDsToDocuments(allCRDs, inputFiles);
}

function generateSingleFileOutput(
  outputFile: string,
  documentModel: DocumentModel,
  verbose: boolean
): void {
  const outputPath = outputFile;
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const combinedMarkdown = renderCombinedDocumentation(documentModel.apiDocs);

  try {
    writeFileSync(outputPath, combinedMarkdown, "utf8");
    process.stdout.write(
      `✅ Generated combined markdown file: ${outputPath}\n`
    );

    if (verbose) {
      process.stdout.write("\nIncluded APIs:\n");
      for (const apiDoc of documentModel.apiDocs) {
        process.stdout.write(
          `  - ${apiDoc.kind} (${apiDoc.group}/${apiDoc.version})\n`
        );
      }
    }
  } catch (error) {
    process.stderr.write(`Error writing ${outputPath}: ${error}\n`);
    process.exit(1);
  }
}

function generateMultiFileOutput(
  outputDirectory: string,
  documentModel: DocumentModel,
  verbose: boolean
): void {
  if (!existsSync(outputDirectory)) {
    mkdirSync(outputDirectory, { recursive: true });
  }

  let generatedCount = 0;

  for (const apiDoc of documentModel.apiDocs) {
    const markdown = renderAPIDocumentation(apiDoc);
    const filename = `${apiDoc.group}-${apiDoc.version}-${apiDoc.metadata?.singular.toLowerCase() || apiDoc.kind.toLowerCase()}.md`;
    const outputPath = join(outputDirectory, filename);

    try {
      writeFileSync(outputPath, markdown, "utf8");
      generatedCount++;

      if (verbose) {
        process.stdout.write(`Generated: ${outputPath}\n`);
      }
    } catch (error) {
      process.stderr.write(`Error writing ${outputPath}: ${error}\n`);
      process.exit(1);
    }
  }

  process.stdout.write(
    `✅ Generated ${generatedCount} markdown files in ${outputDirectory}\n`
  );

  if (verbose) {
    process.stdout.write("\nGenerated files:\n");
    for (const apiDoc of documentModel.apiDocs) {
      const filename = `${apiDoc.group}-${apiDoc.version}-${apiDoc.metadata?.singular.toLowerCase() || apiDoc.kind.toLowerCase()}.md`;
      process.stdout.write(`  - ${filename} (${apiDoc.kind})\n`);
    }
  }
}

runMain(main);
