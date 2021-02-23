export interface OutdatedPackage {
    readonly name: string;
    readonly current: string;
    readonly latest: string;
    readonly projectUrl: string | null;
}

interface Report {
    readonly outdated: ReportOutdated;
}

interface ReportOutdated {
    readonly dependencies: ReportPackage[];
}

interface ReportPackage {
    readonly group: string;
    readonly available: ReportAvailable;
    readonly version: string;
    readonly projectUrl: string | null;
    readonly name: string;
}

interface ReportAvailable {
    readonly release: string | null;
    readonly milestone: string | null;
    readonly integration: string | null;
}

export function toOutdatedPackages(value: string): OutdatedPackage[] {
    if (value.length == 0) {
        return [];
    }

    const report = JSON.parse(value) as Report;
    const result: OutdatedPackage[] = [];

    for (const reportPackage of report.outdated.dependencies) {
        let latest: string;
        if (reportPackage.available.release != null) {
            latest = reportPackage.available.release;
        } else if (reportPackage.available.milestone != null) {
            latest = reportPackage.available.milestone;
        } else if (reportPackage.available.integration != null) {
            latest = reportPackage.available.integration;
        } else {
            continue;
        }

        result.push({
            name: `${reportPackage.group}:${reportPackage.name}`,
            current: reportPackage.version,
            latest: latest,
            projectUrl: reportPackage.projectUrl,
        });
    }

    return result;
}
