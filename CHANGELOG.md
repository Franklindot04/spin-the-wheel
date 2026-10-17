# Changelog

All notable changes to Spin the Wheel are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- While a quiz is running, questions cannot be deleted either, and the hint says so.
- The character counters under entry names, questions and answers count whole characters, so an emoji counts as one.
- If another browser tab changes your saved wheels, a banner asks you to reload, and this tab stops saving until you do, so it cannot overwrite the newer data. Import is disabled while the banner shows.

### Fixed

- If deleting the kept copy of unreadable data fails, the banner stays and says so, so the copy is not lost silently.
- Cancelling Restore defaults returns to the Settings tab you were on.
- Changing two settings at the same moment can no longer lose one of them.

## [2.1.2] - 2026-10-17

### Changed

- Deleting the kept copy of unreadable saved data now asks for confirmation first, and the dialog offers to export it.
- While a quiz is running, the hint under the question list now says that questions cannot be added or duplicated.
- The Reset Entries confirmation says that resetting during a quiz also ends the quiz.
- A quiz card can be dismissed with a "Done" button, or you can go back to setup from it, when the quiz is complete or all remaining questions are hidden.

### Fixed

- The wheel selector in the header stays readable when you hover over it and shows a clear ring when focused.
- The "Clear History" and "− Wheel" buttons use red that is easier to read on every theme, and "Clear History" has a visible outline.
- Disabled buttons no longer change background when the mouse is over them.
- A label that is cut short on the wheel no longer splits an emoji or leaves a broken character.

## [2.1.1] - 2026-10-17

### Added

- The Restore defaults and Reset Entries confirmations include an "Export all wheels" button, so you can save a copy first.
- If saved data cannot be read or had to be repaired, a copy of the original is kept in the browser and a banner offers to export or delete it. After you delete the copy, a note explains that the unreadable data stays until you make a change or import a file.

### Changed

- Slice images are drawn at the outer end of the slice and shrink or disappear before they would cover a label or an emoji.
- While a quiz is running, entry names, questions, answers and emoji are read-only, so the displayed question and the history cannot drift apart. Edit them in setup.
- The empty-wheel message in a quiz now says whether the remaining questions are hidden or the quiz is complete.
- Spin history keeps the newest 500 spins per mode for each wheel. Older ones are removed the next time the app loads or a spin is recorded.
- Import errors are shown in a banner with the reason, and files over 10 MB are rejected before they are read.
- A message appears when changes cannot be saved because browser storage is full, with a button to export your data.
- The Restore defaults confirmation says that the wheel name and other wheels are kept, and Cancel returns to Settings.
- Reset Entries uses a dialog instead of a browser popup.
- Importing a file with a bad item now repairs it instead of rejecting the whole file.

### Fixed

- Clear History is disabled while the wheel is spinning.
- Entry and history updates made in quick succession, or while an image is still loading, no longer overwrite each other.
- The label of a single visible entry now turns smoothly with the wheel at the start of a spin.
- A history item with bad data no longer crashes the History panel. Malformed history items are removed when data loads or is imported.
- Saved data with a bad item (a `null` entry, a wrong-typed name or label, a missing id) no longer resets the app to defaults or crashes the wheel.

## [2.1.0] - 2026-10-16

### Added

- An optional emoji for each entry. Pick it from the entry menu, which has a skin-tone row for people and hand emoji. It is shown on the wheel slice, in the result, the quiz card, the history and the entry list.
- Entries and history items may carry an optional `emoji` field. Older files load unchanged, and a new export still opens in v2.0.5, which ignores the field.

### Changed

- From 40 visible entries the wheel shows emoji-only slices instead of hiding every label. Entries without an emoji still show no label there, and the full name stays in each slice's tooltip.
- Labels are truncated before the emoji. When a label cannot fit its slice, the slice shows the emoji alone.

## [2.0.5] - 2026-10-15

### Changed

- The wheel size is saved per wheel and the stepper shows the size that actually fits.
- Wheel labels are drawn outward from the centre, use the largest font that fits, and are hidden from 40 visible entries (the full name stays in each slice's tooltip).
- The Sunset accent colour is deeper so white text on it reaches 4.5:1.
- The pointer is a pale shade of the theme colour when no entries are visible.
- A loading state shows until saved wheels are read, so the default wheel no longer flashes.

### Fixed

- Settings number inputs show keyboard focus.
- The "Image attached" and "Audio attached" labels are readable in every theme.
- A single visible entry's label stays upright after spins.

### Removed

- The mute button, which did not play any sound.
- Unused Geist font imports and variables.

## [2.0.4] - 2026-10-15

### Changed

- "Reset Entries" now asks for confirmation and resets only the entries of the current mode (Standard or Quiz). "Restore defaults" in Settings now opens a confirmation dialog before resetting everything.
- The Settings entry-limit field is labelled "Maximum entries". Lowering it never removes existing entries; it only stops new ones being added.
- Entry controls in the sidebar are dimmed and blocked while the wheel is spinning, in both Standard Mode and Quiz Mode.
- In Quiz Mode, the wheel keeps showing the winning question until the next spin, so the slice under the pointer always matches the card.

### Fixed

- Entries beyond the limit are no longer cut when the page loads or a file is imported. Add and Duplicate stop at the limit instead.
- Duplicating a hidden entry creates a visible copy.
- Delete is disabled, in the row and in the entry menu, when it would leave fewer than two visible entries.
- Switching to another wheel or deleting one now returns to Standard Mode.
- The spin result timer is clamped to the same 1 to 30 seconds as the animation, and cleared when the page unmounts.
- Typing in an entry name no longer clears the displayed result in Standard Mode.
- Hiding all questions in Quiz Mode clears the displayed card, as in Standard Mode.

### Removed

- Unused components (`PersonalisePanel`, `WheelToolbar`, `WheelManager`, `HistoryPanel`) and an unused settings helper.

## [2.0.3] - 2026-10-15

### Changed

- The header title is larger and bolder, and the edit icons beside the title and description are larger with a bigger tap target.
- The entry name input has its own line on small screens, so longer names fit.
- Fullscreen and the wheel controls (size, mute, fullscreen) follow the selected theme.
- The Settings dialog footer is light to match the panel, and keyboard focus stays inside the dialog while it is open and returns to the Settings button when it closes.
- Settings switches, the volume slider and the selected cards follow the theme accent colour.

### Fixed

- The "No visible entries" overlay on the wheel now follows the selected theme.
- The "..." menu of a hidden entry is no longer drawn translucent behind the rows below it.
- The sidebar tab row wraps on narrow screens instead of clipping the Import button.
- The Settings dialog keeps its Done button visible, and scrolling no longer moves the page behind it.
- The Delete entry text in the entry menu has better contrast in every theme.
- The entry menu's Duplicate and Delete buttons include the entry name in their accessible labels.
- Icon buttons (wheel size, mute, fullscreen, header edit icons, and the sidebar eye, export and import) show a visible focus ring when reached by keyboard.
- Clone and remote commands in the README and contributing guide are plain URLs that can be copied.
- Entry inputs show a visible focus ring in every theme.
- The wheel pointer is white with a dark outline when "Pointer matches slice colour" is off, so it stays visible on dark themes.
- The red delete and remove text on entry rows and in the entry menu passes contrast in every theme.

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

[Unreleased]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.1.2...HEAD
[2.1.2]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.5...v2.1.0
[2.0.5]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Franklindot04/spin-the-wheel/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Franklindot04/spin-the-wheel/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Franklindot04/spin-the-wheel/releases/tag/v1.0.0