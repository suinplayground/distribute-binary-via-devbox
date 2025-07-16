import { dump as yamlDump } from "js-yaml";
import type {
  Code,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  InlineCode,
  Link,
  List,
  ListItem,
  Table as MdastTable,
  TableCell as MdastTableCell,
  TableRow as MdastTableRow,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Text,
} from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFootnoteToMarkdown } from "mdast-util-gfm-footnote";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import { toMarkdown } from "mdast-util-to-markdown";
import { gfmTable } from "micromark-extension-gfm-table";
import { u } from "unist-builder";
import type {
  APIDocumentation,
  FieldDocumentation,
} from "../models/document.js";
import type { QuickReferenceTable } from "../models/table.js";
import { getQuickReferenceTable } from "../models/table.js";

// Exported functions (High-level API)
export function renderAPIDocumentation(apiDoc: APIDocumentation): string {
  const footnotes = new Map<string, string>();
  const root = buildDocumentASTWithFootnotes(apiDoc, 1, footnotes);

  const markdown = toMarkdown(root, {
    bullet: "-",
    emphasis: "*",
    strong: "*",
    fence: "`",
    fences: true,
    listItemIndent: "one",
    join: [
      // Join list items with no blank lines
      (left, right, _parent) => {
        if (left.type === "listItem" && right.type === "listItem") {
          return 0;
        }
        // No blank line between paragraph and code block
        if (left.type === "paragraph" && right.type === "code") {
          return 0;
        }
        // No blank line between paragraph and list when inside a list item
        // This prevents blank lines after "Constraints" or "Example" labels
        if (left.type === "paragraph" && right.type === "list") {
          // Check if both are children of a list item by looking at their positions
          // If they're consecutive and the list is indented, they're likely in the same list item
          const leftContent = "children" in left ? left.children : [];
          const hasConstraintsOrExample = leftContent.some(
            (child) =>
              child.type === "strong" &&
              "children" in child &&
              child.children?.some(
                (textNode) =>
                  textNode.type === "text" &&
                  "value" in textNode &&
                  (textNode.value === "Constraints" ||
                    textNode.value === "Example")
              )
          );
          if (hasConstraintsOrExample) {
            return 0;
          }
        }
        return 1;
      },
    ],
    extensions: [gfmTableToMarkdown(), gfmFootnoteToMarkdown()],
  });

  return markdown;
}

export function renderCombinedDocumentation(
  apiDocs: Array<APIDocumentation>
): string {
  const children: Array<RootContent> = [];
  const footnotes = new Map<string, string>(); // Shared footnotes across all API docs

  // Add main title
  children.push(heading(1, "API Documentation"));

  // Sort API docs alphabetically by Kind name
  const sortedApiDocs = [...apiDocs].sort((a, b) =>
    a.kind.localeCompare(b.kind)
  );

  // Add Table of Contents
  if (sortedApiDocs.length > 0) {
    const tocItems = sortedApiDocs.map((apiDoc) => {
      const anchor = apiDoc.kind.toLowerCase().replace(/\s+/g, "-");
      return [link(`#${anchor}`, [text(apiDoc.kind)])];
    });
    children.push(bulletList(tocItems));
  }

  // Add each API documentation with base heading level 2
  for (const apiDoc of sortedApiDocs) {
    const apiAST = buildDocumentASTWithFootnotes(apiDoc, 2, footnotes);
    // Add all children except footnote definitions (we'll add them at the end)
    children.push(
      ...apiAST.children.filter((child) => child.type !== "footnoteDefinition")
    );
  }

  // Add all footnote definitions at the end
  for (const [footnoteId, celFormula] of footnotes) {
    const footnoteDefinition: FootnoteDefinition = {
      type: "footnoteDefinition",
      identifier: footnoteId,
      children: [
        paragraph([
          text(
            "This field is immutable. Once set, it cannot be modified as enforced by the CEL validation rule: "
          ),
          inlineCode(celFormula),
        ]),
      ],
    };
    // Type assertion needed as FootnoteDefinition extends RootContent but isn't in the union
    children.push(footnoteDefinition as RootContent);
  }

  const root = u("root", children) as Root;
  const markdown = toMarkdown(root, {
    bullet: "-",
    emphasis: "*",
    strong: "*",
    fence: "`",
    fences: true,
    listItemIndent: "one",
    join: [
      // Join list items with no blank lines
      (left, right, _parent) => {
        if (left.type === "listItem" && right.type === "listItem") {
          return 0;
        }
        // No blank line between paragraph and code block
        if (left.type === "paragraph" && right.type === "code") {
          return 0;
        }
        // No blank line between paragraph and list when inside a list item
        // This prevents blank lines after "Constraints" or "Example" labels
        if (left.type === "paragraph" && right.type === "list") {
          // Check if both are children of a list item by looking at their positions
          // If they're consecutive and the list is indented, they're likely in the same list item
          const leftContent = "children" in left ? left.children : [];
          const hasConstraintsOrExample = leftContent.some(
            (child) =>
              child.type === "strong" &&
              "children" in child &&
              child.children?.some(
                (textNode) =>
                  textNode.type === "text" &&
                  "value" in textNode &&
                  (textNode.value === "Constraints" ||
                    textNode.value === "Example")
              )
          );
          if (hasConstraintsOrExample) {
            return 0;
          }
        }
        return 1;
      },
    ],
    extensions: [gfmTableToMarkdown(), gfmFootnoteToMarkdown()],
  });

  return markdown;
}

// Main document building function (High-level orchestration)
function buildDocumentASTWithFootnotes(
  apiDoc: APIDocumentation,
  baseHeadingLevel: number,
  footnotes: Map<string, string>
): Root {
  const children: Array<RootContent> = [];

  // Title
  children.push(heading(baseHeadingLevel, apiDoc.title));

  // API description (right after title)
  if (apiDoc.description) {
    const parsed = fromMarkdown(apiDoc.description, {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown()],
    });
    children.push(...parsed.children);
  }

  // Overview section
  addOverviewSection(children, apiDoc);

  // Quick Reference Table
  addQuickReferenceSection(children, apiDoc, baseHeadingLevel);

  // Spec fields section
  addFieldsSection(
    children,
    apiDoc.specFields,
    "Spec",
    baseHeadingLevel,
    footnotes
  );

  // Status fields section
  addFieldsSection(
    children,
    apiDoc.statusFields,
    "Status",
    baseHeadingLevel,
    footnotes
  );

  // Add footnote definitions at the end
  addFootnoteDefinitions(children, footnotes);

  return u("root", children) as Root;
}

function addOverviewSection(
  children: Array<RootContent>,
  apiDoc: APIDocumentation
): void {
  const overviewItems: Array<Array<PhrasingContent>> = [
    [
      strong([text("API version:")]),
      text(" "),
      inlineCode(`${apiDoc.group}/${apiDoc.version}`),
    ],
    [strong([text("Scope:")]), text(` ${apiDoc.scope}`)],
  ];

  if (apiDoc.metadata?.plural) {
    overviewItems.push([
      strong([text("Plural:")]),
      text(" "),
      inlineCode(apiDoc.metadata.plural),
    ]);
  }

  if (apiDoc.metadata?.singular) {
    overviewItems.push([
      strong([text("Singular:")]),
      text(" "),
      inlineCode(apiDoc.metadata.singular),
    ]);
  }

  if (apiDoc.metadata?.shortNames && apiDoc.metadata.shortNames.length > 0) {
    const shortNameNodes: Array<PhrasingContent> = [
      strong([text("Short names:")]),
      text(" "),
    ];

    // Add each short name as inline code, separated by commas
    const shortNames = apiDoc.metadata?.shortNames;
    if (shortNames) {
      shortNames.forEach((name, index) => {
        shortNameNodes.push(inlineCode(name));
        if (index < shortNames.length - 1) {
          shortNameNodes.push(text(", "));
        }
      });
    }

    overviewItems.push(shortNameNodes);
  }

  children.push(bulletList(overviewItems));
}

function addQuickReferenceSection(
  children: Array<RootContent>,
  apiDoc: APIDocumentation,
  baseHeadingLevel: number
): void {
  const maxDepth = 2;
  const quickRefTable = getQuickReferenceTable(apiDoc, { maxDepth });
  if (quickRefTable.fields.length > 0) {
    children.push(heading(baseHeadingLevel + 1, "Quick Reference"));
    children.push(renderQuickReferenceTable(quickRefTable));

    // Add note about omitted fields if any
    if (quickRefTable.hasOmittedFieldsDueToDepth) {
      children.push(
        paragraph([
          text(`Note: This table shows fields up to ${maxDepth} levels deep. `),
          text("Deeper nested fields are documented in the sections below."),
        ])
      );
    }
  }
}

function addFieldsSection(
  children: Array<RootContent>,
  fields: Array<FieldDocumentation>,
  sectionName: string,
  baseHeadingLevel: number,
  footnotes: Map<string, string>
): void {
  children.push(heading(baseHeadingLevel + 1, sectionName));
  if (fields.length > 0) {
    for (const field of fields) {
      addFieldSection(children, field, baseHeadingLevel + 2, footnotes);
    }
  } else {
    children.push(
      paragraph([
        text(
          `No ${sectionName.toLowerCase()} fields defined for this resource.`
        ),
      ])
    );
  }
}

function addFootnoteDefinitions(
  children: Array<RootContent>,
  footnotes: Map<string, string>
): void {
  for (const [footnoteId, celFormula] of footnotes) {
    const footnoteDefinition: FootnoteDefinition = {
      type: "footnoteDefinition",
      identifier: footnoteId,
      children: [
        paragraph([
          text(
            "This field is immutable. Once set, it cannot be modified as enforced by the CEL validation rule: "
          ),
          inlineCode(celFormula),
        ]),
      ],
    };
    // Type assertion needed as FootnoteDefinition extends RootContent but isn't in the union
    children.push(footnoteDefinition as RootContent);
  }
}

// Field section building (Mid-level abstraction)
function addFieldSection(
  children: Array<RootContent>,
  field: FieldDocumentation,
  headingLevel = 3,
  footnotes?: Map<string, string>
): void {
  // Field heading
  children.push(heading(headingLevel, [inlineCode(field.fieldPath)]));

  // Description paragraph(s) - parse as markdown since it comes from user input
  if (field.description) {
    const parsed = fromMarkdown(field.description, {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown()],
    });
    children.push(...parsed.children);
  }

  // Create a unified list with all field information
  const fieldInfoList: Array<Array<PhrasingContent | RootContent>> = [];

  // Add basic field information
  addBasicFieldInfoToList(fieldInfoList, field);

  // Add constraints as nested list items
  addConstraintsToList(fieldInfoList, field, footnotes);

  // Add default value as nested list item
  addDefaultValueToList(fieldInfoList, field);

  // Add examples as nested list items
  addExamplesToList(fieldInfoList, field);

  children.push(complexBulletList(fieldInfoList));
}

// Field detail functions (Mid-level abstraction)
function addBasicFieldInfoToList(
  fieldInfoList: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation
): void {
  // Type with format
  const typeNodes: Array<PhrasingContent> = [
    strong([text("Type:")]),
    text(" "),
    inlineCode(field.type),
  ];
  if (field.format) {
    typeNodes.push(text(" ("), inlineCode(field.format), text(")"));
  }
  fieldInfoList.push(typeNodes);

  // Required/Optional
  fieldInfoList.push([
    strong([text(field.required ? "Required" : "Optional")]),
  ]);
}

function addConstraintsToList(
  fieldInfoList: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation,
  footnotes?: Map<string, string>
): void {
  const constraints: Array<Array<PhrasingContent | RootContent>> = [];

  // Add immutability constraint if present
  addImmutabilityConstraint(constraints, field, footnotes);

  // Add numeric constraints
  addNumericConstraints(constraints, field);

  // Add other constraints
  addOtherConstraints(constraints, field);

  if (constraints.length > 0) {
    // Create a list item with "Constraints" label and nested list
    const constraintItem: Array<PhrasingContent | RootContent> = [
      strong([text("Constraints")]),
      complexBulletList(constraints),
    ];
    fieldInfoList.push(constraintItem);
  }
}

function addImmutabilityConstraint(
  constraints: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation,
  footnotes?: Map<string, string>
): void {
  if (!field.immutable) {
    return;
  }

  const footnoteId = `immutable_by_CEL_${field.immutable.replaceAll(" ", "_")}`;
  const footnoteRef: FootnoteReference = {
    type: "footnoteReference",
    identifier: footnoteId,
  };
  constraints.push([
    strong([text("Immutable")]),
    text(" "),
    footnoteRef as PhrasingContent,
  ]);

  // Collect footnote for later rendering
  if (footnotes) {
    footnotes.set(footnoteId, field.immutable);
  }
}

function addNumericConstraints(
  constraints: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation
): void {
  const numericConstraints: Array<{
    property: keyof FieldDocumentation;
    label: string;
  }> = [
    { property: "minLength", label: "Min length:" },
    { property: "maxLength", label: "Max length:" },
    { property: "minimum", label: "Minimum:" },
    { property: "maximum", label: "Maximum:" },
    { property: "minItems", label: "Min items:" },
    { property: "maxItems", label: "Max items:" },
  ];

  for (const { property, label } of numericConstraints) {
    const value = field[property];
    if (value !== undefined) {
      constraints.push([
        strong([text(label)]),
        text(" "),
        inlineCode(String(value)),
      ]);
    }
  }
}

function addOtherConstraints(
  constraints: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation
): void {
  if (field.uniqueItems) {
    constraints.push([strong([text("Unique items:")]), text(" Yes")]);
  }

  if (field.pattern) {
    constraints.push([
      strong([text("Pattern:")]),
      codeBlock(field.pattern, "regex"),
    ]);
  }

  // Add enum values
  if (field.enum && field.enum.length > 0) {
    const enumNodes: Array<PhrasingContent> = [
      strong([text("Allowed values:")]),
      text(" "),
    ];
    field.enum.forEach((value, index) => {
      if (index > 0) {
        enumNodes.push(text(", "));
      }
      enumNodes.push(inlineCode(JSON.stringify(value)));
    });
    constraints.push(enumNodes);
  }

  // Add validation rules
  for (const rule of field.validationRules) {
    const validationContent: Array<PhrasingContent | RootContent> = [];

    if (rule.message) {
      validationContent.push(
        strong([text("Validation:")]),
        text(` ${rule.message}`)
      );
    } else {
      validationContent.push(strong([text("Validation:")]), text(" "));
    }

    validationContent.push(codeBlock(rule.rule, "cel"));
    constraints.push(validationContent);
  }
}

function addExamplesToList(
  fieldInfoList: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation
): void {
  if (field.examples.length > 0) {
    // Process each example
    for (const example of field.examples) {
      const yamlString = yamlDump(example, {
        indent: 2,
        lineWidth: -1, // Disable line wrapping
        noRefs: true, // Don't use references
        quotingType: '"', // Use double quotes
        forceQuotes: false, // Only quote when necessary
      }).trim();

      // Check if the YAML is single-line or multi-line
      const isSingleLine = !yamlString.includes("\n");

      if (isSingleLine) {
        // Single-line: render as inline code on the same line
        const exampleItem: Array<PhrasingContent> = [
          strong([text("Example:")]),
          text(" "),
          inlineCode(yamlString),
        ];
        fieldInfoList.push(exampleItem);
      } else {
        // Multi-line: render as code block
        const exampleItem: Array<PhrasingContent | RootContent> = [
          strong([text("Example")]),
          codeBlock(yamlString, "yaml"),
        ];
        fieldInfoList.push(exampleItem);
      }
    }
  }
}

// AST helper functions (Low-level abstraction)
function heading(
  depth: number,
  content: string | Array<PhrasingContent>
): Heading {
  // Clamp depth to valid markdown heading levels
  const clampedDepth = Math.max(1, Math.min(6, depth)) as 1 | 2 | 3 | 4 | 5 | 6;
  const children = typeof content === "string" ? [text(content)] : content;
  return u("heading", { depth: clampedDepth }, children) as Heading;
}

function paragraph(children: Array<PhrasingContent>): Paragraph {
  return u("paragraph", children) as Paragraph;
}

function text(value: string): Text {
  return u("text", value) as Text;
}

function inlineCode(value: string): InlineCode {
  return u("inlineCode", value) as InlineCode;
}

function codeBlock(value: string, lang?: string): Code {
  return u("code", { lang }, value) as Code;
}

function strong(children: Array<PhrasingContent>): Strong {
  return u("strong", children) as Strong;
}

function link(url: string, children: Array<PhrasingContent>): Link {
  return u("link", { url }, children) as Link;
}

function bulletList(items: Array<Array<PhrasingContent>>): List {
  const listItems: Array<ListItem> = items.map(
    (item) => u("listItem", [u("paragraph", item) as Paragraph]) as ListItem
  );
  return u("list", { ordered: false }, listItems) as List;
}

function complexBulletList(
  items: Array<Array<PhrasingContent | RootContent>>
): List {
  const listItems: Array<ListItem> = items.map((item) => {
    // Separate inline content from block content
    const inlineContent: Array<PhrasingContent> = [];
    const blockContent: Array<RootContent> = [];

    for (const element of item) {
      if (element.type === "code" || element.type === "list") {
        // Code blocks and lists are block content
        blockContent.push(element);
      } else {
        // Everything else is inline
        inlineContent.push(element as PhrasingContent);
      }
    }

    const children: Array<RootContent> = [];

    // Add inline content as a paragraph
    if (inlineContent.length > 0) {
      children.push(u("paragraph", inlineContent) as Paragraph);
    }

    // Add block content directly
    children.push(...blockContent);

    return u("listItem", children) as ListItem;
  });

  return u("list", { ordered: false }, listItems) as List;
}

// Helper function to unescape footnote references
function renderQuickReferenceTable(
  quickRefTable: QuickReferenceTable
): RootContent {
  // Create proper mdast table nodes
  const tableNode: MdastTable = {
    type: "table",
    children: [],
  };

  // Create header row with presentation concerns handled here
  const headers = ["Field path", "Type", "Required", "Description"];
  const headerRow: MdastTableRow = {
    type: "tableRow",
    children: headers.map(
      (header): MdastTableCell => ({
        type: "tableCell",
        children: [text(header)],
      })
    ),
  };
  tableNode.children.push(headerRow);

  // Create data rows with all presentation logic
  for (const field of quickRefTable.fields) {
    const tableRow: MdastTableRow = {
      type: "tableRow",
      children: [
        // Field path as inline code
        {
          type: "tableCell",
          children: [inlineCode(field.path)],
        },
        // Type as inline code
        {
          type: "tableCell",
          children: [inlineCode(field.type)],
        },
        // Required as checkmark or empty
        {
          type: "tableCell",
          children: [text(field.required ? "✓" : "")],
        },
        // Description as plain text, truncated for table display
        {
          type: "tableCell",
          children: [text(truncateDescription(field.description, 60))],
        },
      ],
    };
    tableNode.children.push(tableRow);
  }

  return tableNode;
}

function truncateDescription(description: string, maxLength: number): string {
  if (description.length <= maxLength) {
    return description;
  }
  return `${description.substring(0, maxLength - 3)}...`;
}

function addDefaultValueToList(
  fieldInfoList: Array<Array<PhrasingContent | RootContent>>,
  field: FieldDocumentation
): void {
  if (field.default !== undefined) {
    // Convert default value to YAML format
    const yamlString = yamlDump(field.default, {
      indent: 2,
      lineWidth: -1, // Disable line wrapping
      noRefs: true, // Don't use references
      quotingType: '"', // Use double quotes
      forceQuotes: false, // Only quote when necessary
    }).trim();

    // Check if the YAML is single-line or multi-line
    const isSingleLine = !yamlString.includes("\n");

    if (isSingleLine) {
      // Single-line: render as inline code on the same line
      const defaultItem: Array<PhrasingContent> = [
        strong([text("Default value:")]),
        text(" "),
        inlineCode(yamlString),
      ];
      fieldInfoList.push(defaultItem);
    } else {
      // Multi-line: render as code block
      const defaultItem: Array<PhrasingContent | RootContent> = [
        strong([text("Default value")]),
        codeBlock(yamlString, "yaml"),
      ];
      fieldInfoList.push(defaultItem);
    }
  }
}
