import { OutdatedPackage, toOutdatedPackages } from "../src/json";

test("parse", () => {
    const value = `{
    "current": {
    },
    "gradle": {
    },
    "exceeded": {
    },
    "outdated": {
        "dependencies": [
            {
                "group": "androidx.browser",
                "available": {
                    "release": null,
                    "milestone": "1.2.0-alpha08",
                    "integration": null
                },
                "version": "1.0.0",
                "projectUrl": "https://developer.android.com/jetpack/androidx",
                "name": "browser"
            },
            {
                "group": "androidx.constraintlayout",
                "available": {
                    "release": null,
                    "milestone": "2.0.0-beta2",
                    "integration": null
                },
                "version": "1.1.3",
                "projectUrl": "http://tools.android.com",
                "name": "constraintlayout"
            }
        ],
        "count": 15
    },
    "unresolved": {
    },
    "count": 31
}`

    const result = toOutdatedPackages(value);
    expect(result.length).toBe(2);

    expect(result[0].name).toBe("androidx.browser:browser");
    expect(result[0].current).toBe("1.0.0");
    expect(result[0].latest).toBe("1.2.0-alpha08");
    expect(result[0].projectUrl).toBe("https://developer.android.com/jetpack/androidx");
    expect(result[1].name).toBe("androidx.constraintlayout:constraintlayout");
    expect(result[1].current).toBe("1.1.3");
    expect(result[1].latest).toBe("2.0.0-beta2");
    expect(result[1].projectUrl).toBe("http://tools.android.com");
})
