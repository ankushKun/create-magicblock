#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const projectRoot = join(__dirname, "..");
const idlJsonPath = join(projectRoot, "target/idl/counter.json");
const idlTsPath = join(projectRoot, "app/src/idl/counter.ts");

// Read the JSON IDL
let idlJson;
try {
    idlJson = JSON.parse(readFileSync(idlJsonPath, "utf-8"));
} catch (error) {
    console.error(`Error: Could not read IDL file at ${idlJsonPath}`);
    process.exit(1);
}

const programAddress = idlJson.address;
if (!programAddress) {
    console.error("Error: Could not extract program address from IDL");
    process.exit(1);
}

/**
 * Convert a JSON value to TypeScript type literal syntax
 * - Objects use semicolons between properties
 * - Arrays use commas between elements
 * - Property names are unquoted (when valid identifiers)
 */
function jsonToTypeScript(value, indent = 0) {
    const spaces = "    ".repeat(indent);
    const innerSpaces = "    ".repeat(indent + 1);

    if (value === null) return "null";
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (typeof value === "string") return `"${value}"`;

    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";

        const items = value.map((item) => jsonToTypeScript(item, indent + 1));
        return `[\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}]`;
    }

    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) return "{}";

        const props = entries.map(([key, val]) => {
            // Use unquoted key if it's a valid identifier
            const formattedKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`;
            return `${innerSpaces}${formattedKey}: ${jsonToTypeScript(val, indent + 1)}`;
        });

        return `{\n${props.join(";\n")};\n${spaces}}`;
    }

    return String(value);
}

/**
 * Convert a JSON value to JavaScript object literal syntax (for the IDL constant)
 * - Uses commas between properties and array elements
 * - Property names are quoted
 */
function jsonToJsObject(value, indent = 0) {
    const spaces = "    ".repeat(indent);
    const innerSpaces = "    ".repeat(indent + 1);

    if (value === null) return "null";
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (typeof value === "string") return `"${value}"`;

    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";

        const items = value.map((item) => jsonToJsObject(item, indent + 1));
        return `[\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}]`;
    }

    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) return "{}";

        const props = entries.map(([key, val]) => {
            return `${innerSpaces}"${key}": ${jsonToJsObject(val, indent + 1)}`;
        });

        return `{\n${props.join(",\n")}\n${spaces}}`;
    }

    return String(value);
}

// Generate the TypeScript file content
const output = `/**
 * Program IDL for the Counter program
 * Program ID: ${programAddress}
 */
export type Counter = ${jsonToTypeScript(idlJson)};

export const IDL: Counter = ${jsonToJsObject(idlJson)};

export const PROGRAM_ID = "${programAddress}";
`;

// Ensure the output directory exists
mkdirSync(dirname(idlTsPath), { recursive: true });

// Write the file
writeFileSync(idlTsPath, output, "utf-8");

console.log(`TypeScript IDL generated at ${idlTsPath}`);
