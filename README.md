# gradle-update-check-action
[![CI-Master](https://github.com/MeilCli/gradle-update-check-action/actions/workflows/ci-master.yml/badge.svg)](https://github.com/MeilCli/gradle-update-check-action/actions/workflows/ci-master.yml)  
gradle maven new package version check action for GitHub Actions.

## Thanks
This action is using [ben-manes/gradle-versions-plugin](https://github.com/ben-manes/gradle-versions-plugin).

## Required
This action must execute after [setup-java](https://github.com/actions/setup-java).

And, your repository must include gradle wrapper files.

## Example
Slack notification example, using [8398a7/action-slack](https://github.com/8398a7/action-slack):

```yaml

name: Check Package

on: 
  schedule:
    - cron: '0 8 * * 5' # every friday AM 8:00
jobs:
  maven:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: 1.8
    - name: Grant permission
      run: chmod +x gradlew
    - uses: MeilCli/gradle-update-check-action@v4
      id: outdated
    - uses: 8398a7/action-slack@v2
      if: steps.outdated.outputs.has_maven_update != 'false'
      with:
        status: ${{ job.status }}
        text: ${{ steps.outdated.outputs.maven_update_text }}
        author_name: GitHub Actions
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```
You can also pin to a [specific release](https://github.com/MeilCli/gradle-update-check-action/releases) version in the format `@v4.x.x`

## input
- `build_gradle_files`
  - optional
  - target root build.gradle files
  - if multiple files, write multiline
- `skip_plugin_dependency`
  - optional
  - skip automally add dependency of gradle-versions-plugin
  - value: `true` or `false`, default: `false`
- `revision`
  - optional
  - version check revision
  - more information? see [ben-manes/gradle-versions-plugin](https://github.com/ben-manes/gradle-versions-plugin)
  - value: `release` or `milestone` or `integration`, default: `release`
- `output_text_style`
  - optional
  - output text style
  - value: `short` or `long`, default: `short`

## output
- `has_maven_update`
  - has new package version information
  - value: `true` or `false`
- `maven_update_text`
  - new package version information text, styled by output_text_style
- `maven_update_json`
  - new package version information json

## Contributes
[<img src="https://gist.github.com/MeilCli/d52f6f6978c53889b76bf5ab35478baf/raw/99289e53693c8bfa1bb50361772e95f95bf62e76/metrics_contributors.svg">](https://github.com/MeilCli/gradle-update-check-action/graphs/contributors)

### Could you want to contribute?
see [Contributing.md](./.github/CONTRIBUTING.md)

## License
[<img src="https://gist.github.com/MeilCli/d52f6f6978c53889b76bf5ab35478baf/raw/99289e53693c8bfa1bb50361772e95f95bf62e76/metrics_licenses.svg">](LICENSE)