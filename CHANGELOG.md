# Changelog

All notable changes to Spin the Wheel are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The header title is larger and bolder, and the edit icons beside the title and description are larger with a bigger tap target.

### Fixed

- The "No visible entries" overlay on the wheel now follows the selected theme.
- The "..." menu of a hidden entry is no longer drawn translucent behind the rows below it.

## [2.0.2] - 2026-10-14

### Changed

- Quiz Mode now completes only when no unasked questions are left. When every remaining question is hidden, the quiz shows a message instead of "Quiz Complete".
- Start Quiz now requires at least two visible questions, in addition to a question and answer on every question.
- While a quiz is running, Add and Duplicate are disabled, and entry changes are ignored while the wheel is spinning.
- Entries may carry an optional `hiddenByHideAll` marker in saved data and exports. Older saved data and export files load as before.

### Fixed

- Hiding, un-hiding, editing or deleting a question during a running quiz now updates the wheel immediately, and Back to Setup no longer changes what the wheel shows.
- Editing, hiding or deleting questions while the final question is displayed no longer empties the wheel, and the displayed question stays in sync with edits.
- A quiz can no longer be started with all questions hidden.
- The "Hide all entries" toggle now remembers which entries it hid. Showing all entries again restores only those, and entries you hid individually stay hidden. If no entry was hidden by the toggle, all entries are shown.

## [2.0.1] - 2026-10-14

### Added

- `CONTRIBUTING.md` with development and contribution guidelines.
- MIT license.
- Standard Mode and Quiz Mode screenshots in the documentation.
- Responsive layout screenshots in `docs/screenshots`.
- "No visible entries" empty state on the wheel when every entry is hidden.

### Changed

- Updated the README with the current application experience, setup instructions, and project documentation.
- Improved the layout on smaller screens: the header stacks and wraps, the wheel scales to its container, and the wheel-size stepper is hidden below 640px.
- The entry customization menu is capped to the viewport width so it is no longer clipped on phones.
- Settings tabs wrap onto multiple lines instead of requiring horizontal scrolling.
- Long quiz questions, answers, and result labels now wrap instead of overflowing the layout.

### Fixed

- Quiz Mode now lets the final remaining question be spun, and shows it after that spin ends. The quiz completes after the last question has been asked instead of one question early.
- Quiz Mode "Questions Remaining" and quiz completion count visible (not hidden) questions only.
- The final quiz spin is now recorded in history.
- A wheel with exactly one visible entry now draws as a filled circle. In Standard Mode, Spin stays disabled with fewer than two visible entries.

## [2.0.0] - 2026-10-02

### Added

- New customizable wheel-builder experience.
- Multi-wheel creation, selection, renaming, and deletion.
- Standard Mode for random selections.
- Quiz Mode with question-and-answer support.
- Answer reveal controls for quiz questions.
- Entry management, including customization, visibility controls, and weighted slices.
- Wheel history functionality.
- Personalization settings and appearance themes.
- Local browser storage for wheel configuration, appearance settings, and history.
- JSON import and export for wheel data.
- Reusable wheel-management and toolbar components.

### Changed

- Overhauled the application structure around reusable wheel components, shared types, and utilities.
- Improved wheel rendering, spin handling, and entry management.

## [1.0.0]

Initial release of Spin the Wheel.

[Unreleased]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.2...HEAD
[2.0.2]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Franklindot04/spin-the-wheel/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Franklindot04/spin-the-wheel/releases/tag/v1.0.0