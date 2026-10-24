import type { MessageTable } from "./translate";

/*
 * The English text, and the source of truth for the keys.
 * Every other language has to give the same keys (see
 * Messages), so a key that is missing there stops the
 * build. A plural message gives { one, other } and uses
 * {count}. A sentence with a link or other element marks
 * it with a tag such as <link>text</link>.
 *
 * Keys are written area.name. The text of the library
 * files (the FAQ, the theme and sound names, the import
 * errors, the share title and the emoji names) is here;
 * the lists in those files hold keys, not words, because
 * appearance-themes.ts is read by the server layout. The
 * rest of the interface text moves in later.
 */
export const en = {
  "faq.title": "FAQ",
  "faq.close": "Close",
  "faq.feedback": "Send feedback",
  "common.cancel": "Cancel",
  "common.ok": "OK",
  "common.waitForSpin": "Wait for the spin to finish.",

  "mode.standard": "Standard",
  "mode.quiz": "Quiz",

  "menu.label": "Menu",
  "menu.editTitle": "Edit title",
  "menu.editDescription": "Edit description",
  "menu.howItWorks": "How it works",
  "menu.faq": "FAQ",
  "menu.sendFeedback": "Send feedback",
  "menu.reportOnGithub": "Report on GitHub",
  "menu.reportOnGithubLabel":
    "Report on GitHub (opens in a new tab)",

  "toolbar.entries": "Entries",
  "toolbar.history": "History",
  "toolbar.showEntries": "Show entries",
  "toolbar.historyLabel": {
    one: "Show history, {count} spin",
    other: "Show history, {count} spins",
  },
  "toolbar.showAllEntries": "Show all entries",
  "toolbar.hideAllEntries": "Hide all entries",
  "toolbar.settings": "Settings",
  "toolbar.moreActions": "More actions",
  "toolbar.import": "Import",
  "toolbar.export": "Export",
  "toolbar.share": "Share",
  "toolbar.importTitle": "Import data",
  "toolbar.importStale":
    "Reload first: this tab is out of date and its changes are not saved",

  "wheelChip.label": "Wheel: {name}",
  "wheelChip.menu": "Wheels",
  "wheelChip.add": "Add wheel",
  "wheelChip.rename": "Rename wheel",
  "wheelChip.delete": "Delete wheel",
  "wheelChip.needsTwo": "Needs at least two wheels.",

  "textDialog.name.title": "Rename wheel",
  "textDialog.name.label": "Wheel name",
  "textDialog.name.required": "Enter a name for the wheel.",
  "textDialog.title.title": "Edit title",
  "textDialog.title.label": "Wheel title",
  "textDialog.title.hint": "Leave it empty to use \"{default}\".",
  "textDialog.description.title": "Edit description",
  "textDialog.description.label": "Wheel description",
  "textDialog.description.hint":
    "Leave it empty to use \"{default}\".",

  "deleteWheel.title": "Delete wheel?",
  "deleteWheel.message":
    "Delete \"{name}\"? Its entries, quiz questions, settings and history are removed. This cannot be undone.",
  "deleteWheel.confirm": "Delete wheel",

  "howItWorks.title": "How it works",
  "howItWorks.close": "Close",
  "standardMode.title": "Standard Mode",
  "standardMode.help":
    "Add your options in the list, then press Spin. Change a name or colour with the entry's ... menu, and its weight with the − and + buttons. Hide an option with its eye icon. When a winner comes up, choose Continue to keep every option, or Remove to hide the winner. At least 2 options must stay visible.",

  "settings.title": "Settings",
  "settings.dialogLabel": "Settings",
  "settings.subtitle": "Customize how your wheel behaves and looks.",
  "settings.restoreDefaults": "Restore defaults",
  "settings.done": "Done",
  "settings.tab.main": "Main",
  "settings.tab.sound": "Sound",
  "settings.tab.confetti": "Confetti",
  "settings.tab.theme": "Page Theme",
  "settings.spinBehavior.title": "Spin behavior",
  "settings.spinBehavior.description":
    "Control how the wheel spins and how the winner is selected.",
  "settings.spinSpeed.label": "Spin speed",
  "settings.spinSpeed.unit": "x",
  "settings.spinDuration.label": "Spin duration",
  "settings.spinDuration.unit": "sec",
  "settings.pointerMatch.label": "Pointer matches slice color",
  "settings.pointerMatch.description":
    "Change the pointer color to match the slice currently under it.",
  "settings.confettiEffect.label": "Confetti effect",
  "settings.confettiEffect.description":
    "Celebrate the winning result when the wheel stops.",
  "settings.winnerDisplay.label": "Winner display",
  "settings.winnerDisplay.panel": "Result panel",
  "settings.winnerDisplay.popup": "Popup",
  "settings.autoGenerate.title": "Auto-generate entries",
  "settings.autoGenerate.description":
    "Quickly populate the wheel with generated options.",
  "settings.autoGenerate.enable": "Enable auto-generation",
  "settings.autoGenerate.count": "Number of entries",
  "settings.autoGenerate.category": "Category",
  "settings.autoGenerate.names": "Names",
  "settings.autoGenerate.animals": "Animals",
  "settings.autoGenerate.countries": "Countries",
  "settings.autoGenerate.cities": "Cities",
  "settings.autoGenerate.foods": "Foods",
  "settings.autoGenerate.custom": "Custom",
  "settings.entryLimit.title": "Entry limit",
  "settings.entryLimit.description":
    "The most entries a list can hold. Lowering it never removes existing entries; it only stops you adding more.",
  "settings.entryLimit.label": "Maximum entries",
  "settings.help.title": "Help",
  "settings.help.faq": "FAQ",
  "settings.help.faqDescription": "Short answers to common questions.",
  "settings.feedback.title": "Feedback",
  "settings.feedback.send": "Send feedback",
  "settings.feedback.sendDescription":
    "Tell us what happened or what you would like to see. No account is needed.",
  "settings.feedback.github": "Report on GitHub",
  "settings.feedback.githubLabel": "Report on GitHub (opens in a new tab)",
  "settings.feedback.githubDescription":
    "Opens a new GitHub issue in a new tab. A GitHub account is needed.",
  "settings.sound.title": "Sound",
  "settings.sound.description":
    "Control sounds played while spinning and after a winner is selected.",
  "settings.sound.enable": "Enable sound",
  "settings.sound.enableDescription":
    "On iPhone, the ringer switch can silence web sounds.",
  "settings.sound.spinLabel": "Spin sound",
  "settings.sound.winnerLabel": "Winner sound",
  "settings.sound.play": "Play",
  "settings.sound.stop": "Stop",
  "settings.sound.playNamed": "Play {sound} sound",
  "settings.sound.stopLabel": "Stop sound",
  "settings.sound.noSpin": "No spin sound to play",
  "settings.sound.noWinner": "No winner sound to play",
  "settings.sound.volumeZero":
    "Volume is at 0, so previews are silent. Turn it up to hear them.",
  "settings.sound.soundOff":
    "Sound is off. Previews still play here, but spins and winners stay silent.",
  "settings.volume.label": "Volume",
  "settings.volume.percent": "{value}%",
  "settings.confetti.title": "Confetti",
  "settings.confetti.description":
    "Choose what happens when the wheel produces a winner.",
  "settings.confetti.enable": "Enable confetti",
  "settings.confetti.styleTitle": "Celebration style",
  "settings.confetti.burst": "Burst",
  "settings.confetti.burstDescription": "A short burst from the center.",
  "settings.confetti.celebration": "Celebration",
  "settings.confetti.celebrationDescription": "A larger celebratory effect.",
  "settings.confetti.fireworks": "Fireworks",
  "settings.confetti.fireworksDescription":
    "Multiple bursts around the winner.",
  "settings.confetti.minimal": "Minimal",
  "settings.confetti.minimalDescription": "A subtle amount of confetti.",
  "settings.confetti.none": "None",
  "settings.confetti.noneDescription": "Do not display a confetti animation.",
  "settings.theme.title": "Page Theme",
  "settings.theme.description":
    "Choose the accent and dark page background used around your wheel.",
  "settings.theme.darkTitle": "Dark page background",
  "settings.theme.darkDescription":
    "The selected theme will be used to create a dark page background while keeping the wheel controls readable.",

  "common.exportFirst": "Export your data first if you want to keep a copy.",
  "common.exportAllWheels": "Export all wheels",

  "restoreDefaults.title": "Restore defaults?",
  "restoreDefaults.message":
    "This will restore the default entries, quiz questions, settings, title, description, and history. Your wheel name and other wheels are kept.",
  "restoreDefaults.confirm": "Restore",

  "resetEntries.label": "Reset entries",
  "resetEntries.title": "Reset entries?",
  "resetEntries.messageEntries": "Reset the entries to the defaults?",
  "resetEntries.messageQuiz": "Reset the quiz questions to the defaults?",
  "resetEntries.quizEnds": "This also ends the quiz and returns to setup.",
  "resetEntries.confirm": "Reset",

  "deleteCopy.label": "Delete the kept copy",
  "deleteCopy.title": "Delete the kept copy?",
  "deleteCopy.messageMemory":
    "This copy exists only until the page is closed. Deleting it now loses it immediately.",
  "deleteCopy.messageStored":
    "This permanently deletes the copy of your unreadable saved data kept in this browser. It cannot be recovered afterwards.",
  "deleteCopy.exportFirst": "Export raw data first if you want to keep it.",
  "deleteCopy.exportRaw": "Export raw data",
  "deleteCopy.confirm": "Delete copy",

  "faq.item.add-options.question": "How do I add options?",
  "faq.item.add-options.answer":
    "Use + Add in the Entries list, then type a name. Press Spin when you are ready.",
  "faq.item.slice-weight.question":
    "How do I make some options more likely to win?",
  "faq.item.slice-weight.answer":
    "Change an entry's slice weight with the − and + buttons. A higher weight gives it a bigger slice.",
  "faq.item.hide-options.question":
    "How do I hide an option without deleting it?",
  "faq.item.hide-options.answer":
    "Tap the eye icon on its row. Hide all hides every option, and Show all brings back only the ones Hide all hid.",
  "faq.item.continue-remove.question": "What do Continue and Remove do?",
  "faq.item.continue-remove.answer":
    "Continue keeps every option. Remove hides the winner, and you can bring it back with its eye icon. Remove is not available when only two options are visible.",
  "faq.item.quiz-mode.question": "How does Quiz Mode work?",
  "faq.item.quiz-mode.answer":
    "Give every entry a question and an answer, then press Start Quiz. Spin the wheel, and press Show Answer when you are ready. Each question is asked once.",
  "faq.item.data-storage.question": "Where is my data stored?",
  "faq.item.data-storage.answer":
    "Your wheels stay in your browser on your device, so clearing your browser data removes them. Only the Send feedback form sends anything, and only when you submit it.",
  "faq.item.backup.question": "How do I back up or move my wheels?",
  "faq.item.backup.answer":
    "Use Export to save a file, and Import to load it on another device. Import replaces everything saved in that browser.",
  "faq.item.share.question": "How do I share the app?",
  "faq.item.share.answer":
    "Use Share in the header on desktop, or in More under the wheel on phones. It opens your device's share sheet, or copies the link.",
  "faq.item.iphone-sound.question": "Why is there no sound on my iPhone?",
  "faq.item.iphone-sound.answer":
    "Sound starts after you tap Spin, and the ringer switch can silence web sounds. Check Settings, then Sound, and the mute button next to the wheel.",
  "faq.item.image-sound.question": "Can I add my own image or sound?",
  "faq.item.image-sound.answer":
    "Yes, in an entry's ... menu. Images are shrunk to fit and must be 1 MB or smaller afterwards. A sound can be up to 2 MB, and plays when that entry wins.",
  "faq.item.report-problem.question": "How do I report a problem?",
  "faq.item.report-problem.answer":
    "Use Send feedback in the menu on phones, or in Settings on desktop. It needs no account. You can also open an issue on GitHub.",

  "theme.classic.label": "Classic",
  "theme.classic.description": "Clean and neutral.",
  "theme.ocean.label": "Ocean",
  "theme.ocean.description": "Cool blue tones.",
  "theme.forest.label": "Forest",
  "theme.forest.description": "Natural green tones.",
  "theme.sunset.label": "Sunset",
  "theme.sunset.description": "Warm orange tones.",
  "theme.violet.label": "Violet",
  "theme.violet.description": "Soft purple tones.",

  "sound.spin.tick": "Tick",
  "sound.spin.click": "Click",
  "sound.spin.pop": "Pop",
  "sound.none": "None",
  "sound.winner.success": "Success",
  "sound.winner.chime": "Chime",
  "sound.winner.applause": "Applause",

  "import.error.notJson":
    "This is not a JSON file. Choose a Spin the Wheel export.",
  "import.error.unsupportedVersion":
    "This export uses an unsupported version ({version}). Only versions 1 and 2 can be imported.",
  "import.error.invalidFile": "This file is not a valid Spin the Wheel export.",

  "share.title": "Spin the Wheel",

  "emoji.group.people": "People",
  "emoji.group.facesAndGestures": "Faces and gestures",
  "emoji.group.foodAndDrink": "Food and drink",
  "emoji.group.animalsAndNature": "Animals and nature",
  "emoji.group.activitiesAndObjects": "Activities and objects",
  "emoji.group.symbols": "Symbols",
  "emoji.name.person": "Person",
  "emoji.name.woman": "Woman",
  "emoji.name.man": "Man",
  "emoji.name.girl": "Girl",
  "emoji.name.boy": "Boy",
  "emoji.name.olderPerson": "Older person",
  "emoji.name.grinningFace": "Grinning face",
  "emoji.name.sunglasses": "Sunglasses",
  "emoji.name.starStruck": "Star-struck",
  "emoji.name.laughing": "Laughing",
  "emoji.name.party": "Party",
  "emoji.name.thumbsUp": "Thumbs up",
  "emoji.name.clapping": "Clapping",
  "emoji.name.raisedHands": "Raised hands",
  "emoji.name.flexedArm": "Flexed arm",
  "emoji.name.pizza": "Pizza",
  "emoji.name.burger": "Burger",
  "emoji.name.fries": "Fries",
  "emoji.name.taco": "Taco",
  "emoji.name.sushi": "Sushi",
  "emoji.name.doughnut": "Doughnut",
  "emoji.name.cake": "Cake",
  "emoji.name.apple": "Apple",
  "emoji.name.banana": "Banana",
  "emoji.name.strawberry": "Strawberry",
  "emoji.name.coffee": "Coffee",
  "emoji.name.beer": "Beer",
  "emoji.name.dog": "Dog",
  "emoji.name.cat": "Cat",
  "emoji.name.fox": "Fox",
  "emoji.name.panda": "Panda",
  "emoji.name.blossom": "Blossom",
  "emoji.name.rainbow": "Rainbow",
  "emoji.name.soccerBall": "Soccer ball",
  "emoji.name.basketball": "Basketball",
  "emoji.name.gameController": "Game controller",
  "emoji.name.musicNote": "Music note",
  "emoji.name.gift": "Gift",
  "emoji.name.books": "Books",
  "emoji.name.star": "Star",
  "emoji.name.heart": "Heart",
  "emoji.name.fire": "Fire",
  "emoji.name.checkMark": "Check mark",
  "emoji.name.crossMark": "Cross mark",
  "emoji.name.lightBulb": "Light bulb",
  "emoji.tone.default": "Default",
  "emoji.tone.light": "Light",
  "emoji.tone.mediumLight": "Medium-light",
  "emoji.tone.medium": "Medium",
  "emoji.tone.mediumDark": "Medium-dark",
  "emoji.tone.dark": "Dark",
} as const satisfies MessageTable;
