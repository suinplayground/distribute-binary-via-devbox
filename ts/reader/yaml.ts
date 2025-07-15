import { loadAll } from "js-yaml";
import type { CustomResourceDefinition } from "../models/crd.js";

export function parseContent(content: string): Array<CustomResourceDefinition> {
  const documents = loadAll(content);
  const crds: Array<CustomResourceDefinition> = [];

  for (const doc of documents) {
    if (isCRD(doc)) {
      crds.push(doc as CustomResourceDefinition);
    }
  }

  return crds;
}

function isCRD(doc: unknown): doc is CustomResourceDefinition {
  return (
    Boolean(doc) &&
    typeof doc === "object" &&
    doc !== null &&
    "apiVersion" in doc &&
    "kind" in doc &&
    doc["apiVersion"] === "apiextensions.k8s.io/v1" &&
    doc["kind"] === "CustomResourceDefinition"
  );
}
