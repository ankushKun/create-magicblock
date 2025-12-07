
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

/**
 * Uses git to find files, which automatically respects .gitignore rules.
 * This is the most robust way to ensure we do not touch ignored files (like node_modules, target, etc).
 */
function getFilesFromGit(dirPath: string): string[] {
    try {
        if (!fs.existsSync(dirPath)) return [];

        const relativePath = path.relative(process.cwd(), dirPath);

        // --cached: files in the index
        // --others: untracked files
        // --exclude-standard: respect .gitignore
        const command = `git ls-files --cached --others --exclude-standard "${relativePath}"`;

        const output = execSync(command, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer safety
        });

        return output
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => path.resolve(process.cwd(), line))
            // Ensure files actually exist (git ls-files might show deleted files if only cached)
            .filter(filepath => fs.existsSync(filepath) && fs.statSync(filepath).isFile());

    } catch (error) {
        console.warn("⚠️  Git command failed, falling back to manual scan.");
        return manualScan(dirPath);
    }
}

function manualScan(dirPath: string, arrayOfFiles: string[] = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;

    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        // Skip common heavy/ignored directories
        if (file === "node_modules" || file === ".git" || file === "dist" || file === "target" || file === "build") return;

        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = manualScan(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function renameGitignoresToGitignore() {
    console.log("🔄 Renaming .gitignore to gitignore...");

    // Use git approach to strictly respect .gitignore
    const files = getFilesFromGit(TEMPLATES_DIR);
    let count = 0;

    files.forEach((file) => {
        if (path.basename(file) === ".gitignore") {
            const newPath = path.join(path.dirname(file), "gitignore");
            console.log(`   ${file} -> ${newPath}`)
            fs.renameSync(file, newPath);
            count++;
        }
    });
    console.log(`✅ Renamed ${count} files.`);
}

function renameGitignoresToDotGitignore() {
    console.log("🔄 Renaming gitignore to .gitignore...");

    // Use manual scan for cleanup to ensure we find the 'gitignore' files we just created
    // (Git might not track them yet or might be confused by the rename)
    const files = manualScan(TEMPLATES_DIR);
    let count = 0;

    files.forEach((file) => {
        if (path.basename(file) === "gitignore") {
            const newPath = path.join(path.dirname(file), ".gitignore");
            console.log(`   ${file} -> ${newPath}`)
            fs.renameSync(file, newPath);
            count++;
        }
    });
    console.log(`✅ Renamed ${count} files.`);
}

async function main() {
    try {
        // 1. Rename .gitignore -> gitignore
        renameGitignoresToGitignore();

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
        renameGitignoresToDotGitignore();
    }
}

main();
