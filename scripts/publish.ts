
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

const IGNORE_FOLDERS = [
    "node_modules",
    ".git",
    "dist",
    "target",
    "build",
    ".anchor"
]

function createGitignoreFiles() {
    console.log("cw Creating gitignore files...");
    let count = 0;

    function scanAndCopy(dir: string) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);

        // Check current directory specifically for .gitignore
        if (files.includes(".gitignore")) {
            const source = path.join(dir, ".gitignore");
            const dest = path.join(dir, "gitignore");
            console.log(`   ${source} -> ${dest}`);
            fs.copyFileSync(source, dest);
            count++;
        }

        // Recurse into subdirectories
        files.forEach(file => {
            if (IGNORE_FOLDERS.includes(file)) return;

            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanAndCopy(fullPath);
            }
        });
    }

    scanAndCopy(TEMPLATES_DIR);
    console.log(`✅ Created ${count} gitignore files.`);
}

function cleanupGitignoreFiles() {
    console.log("🧹 Cleaning up gitignore files...");
    let count = 0;

    function scanAndDelete(dir: string) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);

        // Check current directory specifically for gitignore
        if (files.includes("gitignore")) {
            const target = path.join(dir, "gitignore");
            console.log(`   Removing ${target}`);
            fs.unlinkSync(target);
            count++;
        }

        // Recurse into subdirectories
        files.forEach(file => {
            if (IGNORE_FOLDERS.includes(file)) return;
            if (file === "gitignore") return;

            const fullPath = path.join(dir, file);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                scanAndDelete(fullPath);
            }
        });
    }

    scanAndDelete(TEMPLATES_DIR);
    console.log(`✅ Removed ${count} gitignore files.`);
}

async function main() {
    try {
        // 1. Rename .gitignore -> gitignore
        createGitignoreFiles();

        // 2. Run npm publish
        console.log("\n📦 Publishing...");
        execSync("npm publish", { stdio: "inherit" });

    } catch (error) {
        console.error("\n❌ Publish failed:");
        console.error(error);
        process.exit(1);
    } finally {
        // 3. Rename gitignore -> .gitignore (Always run this)
        console.log("\n🧹 Cleaning up...");
        cleanupGitignoreFiles();
    }
}

main();
