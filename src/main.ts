import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import { OutdatedPackage, toOutdatedPackages } from "./json";
import { ExecOptions } from "@actions/exec/lib/interfaces";

const buildGradleDependency = `buildscript {
    repositories { jcenter() }
    dependencies { classpath "com.github.ben-manes:gradle-versions-plugin:0.25.0" }
}
apply plugin: "com.github.ben-manes.versions"`;

interface Option {
    readonly buildGradleFiles: string[] | null;
    readonly skipPluginDependency: boolean;
    readonly revision: "release" | "milestone" | "integration";
    readonly outputTextStyle: "short" | "long";
}

function getOption(): Option {
    let buildGradleFiles: string[] | null = core
        .getInput("build_gradle_files")
        .split(os.EOL)
        .map(x => x.trim());
    if (buildGradleFiles.length == 1 && buildGradleFiles[0].length == 0) {
        buildGradleFiles = null;
    }

    const skipPluginDependency: boolean =
        core.getInput("skip_plugin_dependency") == "true" ? true : false;
    const revisionValue = core.getInput("revision");
    let revision: "release" | "milestone" | "integration";
    if (revisionValue == "integration") {
        revision = "integration";
    } else if (revisionValue == "milestone") {
        revision = "milestone";
    } else {
        revision = "release";
    }
    const outputTextStyle = core.getInput("output_text_style");

    return {
        buildGradleFiles: buildGradleFiles,
        skipPluginDependency: skipPluginDependency,
        revision: revision,
        outputTextStyle: outputTextStyle == "long" ? "long" : "short"
    };
}

async function copyBuildGradle(buildGradleFile: string): Promise<string> {
    const directory = path.dirname(path.resolve(buildGradleFile));
    const buildGradleFileClone = path.join(
        directory,
        `build.gradle.escape.txt`
    );
    const resultPath = path.relative(process.cwd(), buildGradleFileClone);
    await io.cp(buildGradleFile, resultPath);
    return resultPath;
}

async function executeOutdated(
    buildGradleFile: string,
    option: Option
): Promise<OutdatedPackage[]> {
    let buildGradleFileClone: string | null = null;
    try {
        if (option.skipPluginDependency == false) {
            buildGradleFileClone = await copyBuildGradle(buildGradleFile);
            core.info(`escape file to ${buildGradleFileClone}`);
            fs.appendFile(
                buildGradleFile,
                `${os.EOL}${buildGradleDependency}`,
                e => {
                    if (e != null) {
                        throw e;
                    }
                }
            );
        }
        const gradleCommand =
            process.platform === "win32" ? "gradlew" : "./gradlew";

        await exec.exec(gradleCommand, [
            "dependencyUpdates",
            `-Drevision=${option.revision}`,
            "-DoutputFormatter=json"
        ]);

        const resultPath = path.join(
            path.dirname(buildGradleFile),
            "build",
            "dependencyUpdates",
            "report.json"
        );

        const result: OutdatedPackage[] = [];

        const execOption: ExecOptions = {};
        let stdout = "";
        execOption.listeners = {
            stdout: (data: Buffer) => {
                stdout += data.toString();
            }
        };
        await exec.exec("cat", [resultPath], execOption);

        toOutdatedPackages(stdout).forEach(x => result.push(x));

        return result;
    } finally {
        if (
            option.skipPluginDependency == false &&
            buildGradleFileClone != null
        ) {
            await io.mv(buildGradleFileClone, buildGradleFile, { force: true });
            core.info(`restore file: ${buildGradleFile}`);
        }
    }
}

function convertToOutputText(
    outdatedPackages: OutdatedPackage[],
    option: Option
): string {
    if (option.outputTextStyle == "long") {
        let result = "";
        for (const outdatedPackage of outdatedPackages) {
            if (0 < result.length) {
                result += os.EOL;
            }
            result += `${outdatedPackage.name}: new version ${outdatedPackage.latest}`;
        }
        return result;
    } else {
        let result = "";
        for (const outdatedPackage of outdatedPackages) {
            if (0 < result.length) {
                result += os.EOL;
            }
            result += `${outdatedPackage.name}: new version ${outdatedPackage.latest}, see ${outdatedPackage.projectUrl}`;
        }
        return result;
    }
}

async function run() {
    try {
        const option = await getOption();

        const result: OutdatedPackage[] = [];
        if (option.buildGradleFiles == null) {
            const packages = await executeOutdated("build.gradle", option);
            packages.forEach(x => result.push(x));
        } else {
            for (const buildGradleFile of option.buildGradleFiles) {
                const packages = await executeOutdated(buildGradleFile, option);
                packages.forEach(x => result.push(x));
            }
        }

        const outputText = convertToOutputText(result, option);
        core.setOutput(
            "has_maven_update",
            result.length == 0 ? "false" : "true"
        );
        core.setOutput("maven_update_text", outputText);
        core.setOutput("maven_update_json", JSON.stringify(result));
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
