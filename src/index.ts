#!/usr/bin/env node

import prompts from "prompts";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
import { templates } from "./templates";
import {
    copyFilesAndDirectories,
    renamePackageJsonName,
    detectPackageManager,
    cleanupLockFiles,
    checkDependencies,
    updateAnchorToml,
    initGitRepo,
    installDependencies
} from "./utils";

async function main() {
    // Detect which package manager was used to run the create command
    const packageManager = detectPackageManager();

    console.log(`\n🪄 Create Magic App`);
    console.log(`   Using ${packageManager.name} v${packageManager.version}\n`);

    checkDependencies()

    try {
        const response = await prompts([
            {
                type: "select",
                name: "template",
                message: "Select template",
                choices: templates,
            },
            {
                type: "text",
                name: "projectName",
                message: "Enter your project name",
                initial: "my-mb-project",
                format: (val: string) => val.toLowerCase().split(" ").join("-"),
                validate: (val: string) =>
                    /^[a-z0-9-]+$/.test(val)
                        ? true
                        : "Project name should not contain special characters except hyphen (-)",
            },
        ]);

        // Handle Ctrl+C or empty responses
        if (!response.projectName || !response.template) {
            console.log("\n👋 Setup cancelled.");
            process.exit(0);
        }

        const { projectName, template } = response;

        const cwd = process.cwd();
        const targetDir = path.join(cwd, projectName);
        const sourceDir = path.resolve(
            fileURLToPath(import.meta.url),
            "../../templates",
            `${template}`
        );

        // Check if source template exists
        if (!fs.existsSync(sourceDir)) {
            console.error(`\n❌ Template "${template}" not found at ${sourceDir}`);
            console.error("   This template may not be available yet.");
            process.exit(1);
        }

        if (fs.existsSync(targetDir)) {
            // directory could be empty
            if (fs.readdirSync(targetDir).length > 0) {
                console.error(`\n❌ Non-empty directory "${projectName}" already exists!`);
                console.error("   Please choose a different name or delete the existing directory.");
                process.exit(1);
            }
        }

        // Create and scaffold the project
        console.log(`\n📁 Creating project directory...`);
        fs.mkdirSync(targetDir, { recursive: true });

        console.log(`📦 Copying template files...`);
        await copyFilesAndDirectories(sourceDir, targetDir);

        console.log(`✏️  Configuring project...`);
        await renamePackageJsonName(targetDir, projectName);

        // Update Anchor.toml with the correct package manager
        await updateAnchorToml(targetDir, packageManager);

        // Clean up lockfiles from other package managers
        await cleanupLockFiles(targetDir, packageManager);

        await initGitRepo(targetDir);

        // Install dependencies
        installDependencies(targetDir, packageManager);

        // Success message with package-manager-specific instructions
        console.log(`\n✅ Successfully created ${projectName}!\n`);
        console.log(`   Next steps:\n`);
        console.log(`   cd ${projectName}`);
        console.log(`   ${packageManager.runCommand} frontend:dev\n`);
        console.log(`   ${packageManager.runCommand} program:build`);
        console.log(`   ${packageManager.runCommand} program:test` + `   (or ${packageManager.runCommand} program:test devnet)`);
        console.log(`   ${packageManager.runCommand} program:deploy` + ` (or ${packageManager.runCommand} program:deploy devnet)`);

    } catch (err) {
        console.error("\n❌ An error occurred:", err);
        process.exit(1);
    }
}

main();