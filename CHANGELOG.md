# Change Log

## [RELEASE  0.0.9]

### Enhancements

- **Command help panel**: new in-extension help for the Transformer RPG command, including a full parameter reference, accessible from the conversion webview.
- **Command options panel**: new options webview with all `*ARCAD`/`*ALDON` conversion parameters exposed as selectable values (calculation specs, indicators, alpha-to-numeric, truncation, case, comment lines, source line date, etc.).
- **Conversion options are now honored**: `CVTCLCSPEC`, `FULLYFREE` and `CVT_SUBR` are passed to the command as configured instead of being hard-coded to `*FREE`, `*YES` and `*NO`.
- **UI styling**: refreshed webview styling  for a more consistent look with the VS Code theme.
- **Dependencies updated**: TypeScript 6, webpack 5.111, webpack-cli 7, typescript-eslint 8, `@halcyontech/vscode-ibmi-types` 3, axios 1.20, tmp 0.2.7, and `flatted` 3.4.2(security bump).

### Bug fixes

- **Converted member opening**: after a conversion, the converted member is now opened using the actual target (`TOSRCLIB`/`TOSRCFILE`/`TOSRCMBR`), correctly resolving `*FROMFILE` and `*FROMMBR` values.
- **License handling**: fixed asynchronous license program lookup (`getCurrentLicense` / `applyLicense`) issue.
- **Member list fetching**: failures while listing members now show an error with an "Open output" action and are logged, instead of failing silently.
