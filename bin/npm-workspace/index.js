#!/usr/bin/env node

import { confirm, input } from "@inquirer/prompts";
import { execSync } from "child_process";
import { program } from "commander";
import figlet from "figlet";
import fs from "fs-extra";
import path from "path";
import { installDependencies } from "./lib/installDependencies.js";
import { PackageTemplate } from "./lib/packageTemplate.js";
import { RootTemplate } from "./lib/rootTemplate.js";
import {
  errorChalkLog,
  mutedChalkLog,
  successChalkLog,
} from "./utils/chalkLogs.js";

program
  .name("generator")
  .version("0.0.1")
  .option("-p, --project <string>", "Name of the project")
  .option("-a, --author <string>", "Author of the project")
  .parse(process.argv);

figlet("React-Dojo".split("").join(" "), async function (err, data) {
  if (err) {
    console.dir(errorChalkLog(err));
    return;
  }

  console.log("\n");
  console.log(mutedChalkLog(data));
  console.log("\n");

  const options = program.opts();

  const projectName =
    options?.project ??
    (await input({
      message: "Enter project name:",
    }));
  const authorName =
    options?.author ?? (await input({ message: "Enter author name:" }));

  console.log("\n");

  async function createProject() {
    const projectPath = path.join(process.cwd(), projectName);

    // Create project directory
    await fs.ensureDir(projectPath);

    // Create basic structure
    const dirs = ["packages"];

    for (const dir of dirs) {
      // Ensures that the directory exists. If the directory structure does not exist, it is created.
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // 1st package
    let package1 = "is-even";
    let package1Path = path.join(projectPath, "packages", package1);
    await new PackageTemplate(package1Path)
      .setProjectName(projectName)
      .setPackageName(package1)
      .setTemplate("template1")
      .create();

    // 2nd package
    let package2 = "is-odd";
    let package2Path = path.join(projectPath, "packages", package2);
    await new PackageTemplate(package2Path)
      .setProjectName(projectName)
      .setPackageName(package2)
      .setTemplate("template2")
      .setPackage1(package1)
      .create();

    // Root files
    await new RootTemplate(projectPath)
      .setProjectName(projectName)
      .setAuthorName(authorName)
      .setPackage1(package1)
      .create();

    console.log("\n");

    // Initialize git
    execSync("git init", { cwd: projectPath });

    console.log("\n");

    // Npm install
    const performNpmInstall = await confirm({
      message: "Do you want to install dependencies right now? ",
    });
    performNpmInstall
      ? installDependencies(projectPath, projectName)
      : (() => {
          console.log("\n");
          console.log(mutedChalkLog("Next steps:\n"));
          console.log(`\t1. ${successChalkLog(`cd ${projectName}`)}\n`);
          console.log(
            `\t2. ${successChalkLog("npm install --legacy-peer-deps")}\n`
          );
          console.log(`\t3. Pray!\n`);
          console.log(`\t4. You know the rest! Happy coding 🤙\n`);
        })();

    console.log("\n");
  }

  createProject().catch(console.error);
});
