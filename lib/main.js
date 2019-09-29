"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const json_1 = require("./json");
const buildGradleDependency = `buildscript {
    repositories { jcenter() }
    dependencies { classpath "com.github.ben-manes:gradle-versions-plugin:0.25.0" }
}
apply plugin: "com.github.ben-manes.versions"`;
function getOption() {
    let buildGradleFiles = core
        .getInput("build_gradle_files")
        .split(os.EOL)
        .map(x => x.trim());
    if (buildGradleFiles.length == 1 && buildGradleFiles[0].length == 0) {
        buildGradleFiles = null;
    }
    const skipPluginDependency = core.getInput("skip_plugin_dependency") == "true" ? true : false;
    const revisionValue = core.getInput("revision");
    let revision;
    if (revisionValue == "integration") {
        revision = "integration";
    }
    else if (revisionValue == "milestone") {
        revision = "milestone";
    }
    else {
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
function copyBuildGradle(buildGradleFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const directory = path.dirname(path.resolve(buildGradleFile));
        let buildGradleFileClone = null;
        let count = 1;
        while (buildGradleFileClone == null) {
            const newFile = path.join(directory, `build.gradle.${count}.txt`);
            fs.stat(newFile, error => {
                if (error != null && error.code === "ENOENT") {
                    buildGradleFileClone = newFile;
                }
            });
            count += 1;
        }
        const resultPath = path.relative(process.cwd(), buildGradleFileClone);
        yield io.cp(buildGradleFile, resultPath);
        return resultPath;
    });
}
function executeOutdated(buildGradleFile, option) {
    return __awaiter(this, void 0, void 0, function* () {
        let buildGradleFileClone = null;
        try {
            if (option.skipPluginDependency == false) {
                buildGradleFileClone = yield copyBuildGradle(buildGradleFile);
                fs.appendFile(buildGradleFile, `${os.EOL}${buildGradleDependency}`, e => {
                    if (e != null) {
                        throw e;
                    }
                });
            }
            const gradleCommand = process.platform === "win32" ? "gradlew" : "./gradlew";
            yield exec.exec(gradleCommand, [
                "dependencyUpdates",
                `-Drevision=${option.revision}`,
                "-DoutputFormatter=json"
            ]);
            const resultPath = path.join(path.dirname(buildGradleFile), "build", "dependencyUpdates", "report.json");
            const result = [];
            fs.readFile(resultPath, (err, data) => {
                if (err != null) {
                    json_1.toOutdatedPackages(data.toString()).forEach(x => result.push(x));
                }
            });
            return result;
        }
        finally {
            if (option.skipPluginDependency == false &&
                buildGradleFileClone != null) {
                yield io.mv(buildGradleFileClone, buildGradleFile, { force: true });
            }
        }
    });
}
function convertToOutputText(outdatedPackages, option) {
    if (option.outputTextStyle == "long") {
        let result = "";
        for (const outdatedPackage of outdatedPackages) {
            if (0 < result.length) {
                result += os.EOL;
            }
            result += `${outdatedPackage.name}: new version ${outdatedPackage.latest}`;
        }
        return result;
    }
    else {
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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const option = yield getOption();
            const result = [];
            if (option.buildGradleFiles == null) {
                const packages = yield executeOutdated("build.gradle", option);
                packages.forEach(x => result.push(x));
            }
            else {
                for (const buildGradleFile of option.buildGradleFiles) {
                    const packages = yield executeOutdated(buildGradleFile, option);
                    packages.forEach(x => result.push(x));
                }
            }
            const outputText = convertToOutputText(result, option);
            core.setOutput("has_maven_update", result.length == 0 ? "false" : "true");
            core.setOutput("maven_update_text", outputText);
            core.setOutput("maven_update_json", JSON.stringify(result));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
