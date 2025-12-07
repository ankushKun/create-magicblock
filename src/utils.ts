import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export interface PackageManagerInfo {
    name: PackageManager;
    version: string;
    installCommand: string;
    runCommand: string;
    lockFile: string;
}

const PACKAGE_MANAGER_CONFIG: Record<PackageManager, Omit<PackageManagerInfo, 'version'>> = {
    npm: {
        name: "npm",
        installCommand: "npm install",
        runCommand: "npm run",
        lockFile: "package-lock.json"
    },
    yarn: {
        name: "yarn",
        installCommand: "yarn",
        runCommand: "yarn",
        lockFile: "yarn.lock"
    },
    pnpm: {
        name: "pnpm",
        installCommand: "pnpm install",
        runCommand: "pnpm",
        lockFile: "pnpm-lock.yaml"
    },
    bun: {
        name: "bun",
        installCommand: "bun install",
        runCommand: "bun run",
        lockFile: "bun.lockb"
    }
};

/**
 * Detects which package manager was used to run the create command
 * by parsing the npm_config_user_agent environment variable.
 * 
 * Example user agent values:
 * - npm/10.2.0 node/v20.10.0 darwin arm64
 * - yarn/1.22.19 npm/? node/v20.10.0 darwin arm64
 * - pnpm/8.10.0 npm/? node/v20.10.0 darwin arm64
 * - bun/1.0.0 node/v20.10.0 darwin arm64
 */
export const detectPackageManager = (): PackageManagerInfo => {
    const userAgent = process.env.npm_config_user_agent;

    if (!userAgent) {
        // Default to npm if we can't detect
        return { ...PACKAGE_MANAGER_CONFIG.npm, version: "unknown" };
    }

    // Parse the user agent string (format: "name/version ...")
    const match = userAgent.match(/^(npm|yarn|pnpm|bun)\/(\S+)/);

    if (!match) {
        return { ...PACKAGE_MANAGER_CONFIG.npm, version: "unknown" };
    }

    const [, name, version] = match;
    const pmName = name as PackageManager;

    return {
        ...PACKAGE_MANAGER_CONFIG[pmName],
        version
    };
};

/**
 * Recursively copies all files and directories from source to target
 */
export const copyFilesAndDirectories = async (sourceDir: string, targetDir: string): Promise<void> => {
    // Ensure source exists
    if (!fs.existsSync(sourceDir)) {
        throw new Error(`Source directory does not exist: ${sourceDir}`);
    }

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            // Recursively copy directory
            await copyFilesAndDirectories(sourcePath, targetPath);
        } else if (entry.isFile()) {
            // Copy file
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
};

/**
 * Updates the package.json name field in the target directory
 */
export const renamePackageJsonName = async (targetDir: string, projectName: string): Promise<void> => {
    const packageJsonPath = path.join(targetDir, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
        console.warn("Warning: No package.json found in template");
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.name = projectName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

/**
 * Removes lockfiles from other package managers, keeping only the one for the detected PM
 */
export const cleanupLockFiles = async (targetDir: string, packageManager: PackageManagerInfo): Promise<void> => {
    const allLockFiles = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"];

    for (const lockFile of allLockFiles) {
        // Skip the lockfile for the current package manager
        if (lockFile === packageManager.lockFile) continue;

        const lockFilePath = path.join(targetDir, lockFile);
        if (fs.existsSync(lockFilePath)) {
            fs.unlinkSync(lockFilePath);
        }
    }
};

/**
 * Updates Anchor.toml with the correct package manager settings
 */
export const updateAnchorToml = async (targetDir: string, packageManager: PackageManagerInfo): Promise<void> => {
    const anchorTomlPath = path.join(targetDir, "Anchor.toml");

    if (!fs.existsSync(anchorTomlPath)) {
        // No Anchor.toml in this template, skip
        return;
    }

    let content = fs.readFileSync(anchorTomlPath, "utf-8");

    // Update the package_manager in [toolchain] section
    content = content.replace(
        /^package_manager\s*=\s*"[^"]*"/m,
        `package_manager = "${packageManager.name}"`
    );

    // Update the test script to use the correct package manager's run command
    // The format is: <pm_run_command> ts-mocha ...
    content = content.replace(
        /^test\s*=\s*"(npm run|yarn|pnpm|bun run)\s+ts-mocha/m,
        `test = "${packageManager.runCommand} ts-mocha`
    );

    fs.writeFileSync(anchorTomlPath, content);
};

export const checkDependencies = () => {
    const deps = {
        rustc: {
            command: "rustc --version",
            link: "https://www.rust-lang.org/learn/get-started"
        },
        cargo: {
            command: "cargo --version",
            link: "https://www.rust-lang.org/learn/get-started"
        },
        solana: {
            command: "solana --version",
            link: "https://solana.com/docs/intro/installation"
        },
        anchor: {
            command: "anchor --version",
            link: "https://www.anchor-lang.com/docs/installation"
        }
    }

    let missing = false

    console.log("Checking dependencies...\n")
    for (const dep of Object.entries(deps)) {
        try {
            const res = execSync(`${dep[1].command}`);
            console.log(`✅ ${dep[0]}: ${res.toString().trim()}`);
        } catch (e) {
            console.error(`❌ ${dep[0]} - Install instructions: ${dep[1].link}`);
            missing = true
        }
    }

    if (missing) {
        console.error("Missing dependencies. Please install them and try again.")
        process.exit(1)
    }

    console.log()
}