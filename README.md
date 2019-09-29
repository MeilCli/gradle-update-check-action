# gradle-update-check-action
![](https://github.com/MeilCli/gradle-update-check-action/workflows/CI/badge.svg)  
JavaScript based gradle maven new package version check action for GitHub Actions.

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
    - uses: actions/checkout@v1
    - uses: actions/setup-java@v1
      with:
        java-version: 1.8
    - name: Grant permission
      run: chmod +x gradlew
    - uses: MeilCli/gradle-update-check-action@v1
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
- output_text_style
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

## License
[MIT License](LICENSE).