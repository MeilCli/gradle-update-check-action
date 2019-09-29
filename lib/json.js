"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toOutdatedPackages(value) {
    if (value.length == 0) {
        return [];
    }
    const report = JSON.parse(value);
    const result = [];
    for (const reportPackage of report.outdated.dependencies) {
        let latest;
        if (reportPackage.available.release != null) {
            latest = reportPackage.available.release;
        }
        else if (reportPackage.available.milestone != null) {
            latest = reportPackage.available.milestone;
        }
        else if (reportPackage.available.integration != null) {
            latest = reportPackage.available.integration;
        }
        else {
            continue;
        }
        result.push({
            name: `${reportPackage.group}:${reportPackage.name}`,
            current: reportPackage.version,
            latest: latest,
            projectUrl: reportPackage.projectUrl
        });
    }
    return result;
}
exports.toOutdatedPackages = toOutdatedPackages;
