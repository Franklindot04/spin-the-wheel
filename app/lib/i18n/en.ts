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

  "fileSize.bytes": "{value} B",
  "fileSize.kilobytes": "{value} KB",
  "fileSize.megabytes": "{value} MB",

  "entryList.heading.entries": "Entries",
  "entryList.heading.questions": "Questions",
  "entryList.count.entries": {
    one: "{count} entries",
    other: "{count} entries",
  },
  "entryList.count.questions": {
    one: "{count} questions",
    other: "{count} questions",
  },
  "entryList.countAtLimit.entries": {
    one: "{count} entries · Maximum {max} entries",
    other: "{count} entries · Maximum {max} entries",
  },
  "entryList.countAtLimit.questions": {
    one: "{count} questions · Maximum {max} questions",
    other: "{count} questions · Maximum {max} questions",
  },
  "entryList.limit.entries": "Maximum {max} entries",
  "entryList.limit.questions": "Maximum {max} questions",
  "entryList.add": "+ Add",
  "entryList.addLockedTitle": "Back to Setup to add questions",
  "entryList.deleteLockedTitle": "Back to Setup to delete questions",
  "entryList.quizTextHidden":
    "Questions and answers are hidden while the quiz runs. You can still hide questions or change their weight. Questions cannot be added or deleted. Back to Setup shows them again.",
  "entryList.entryLabel": "Entry {number}",
  "entryList.characters": {
    one: "{count} character",
    other: "{count} characters",
  },
  "entryList.hidden": "Hidden",
  "entryList.showNamed": "Show {name}",
  "entryList.hideNamed": "Hide {name}",
  "entryList.showTitle": "Show entry",
  "entryList.hideTitle": "Hide entry",
  "entryList.deleteNamed": "Delete {name}",
  "entryList.deleteTitle": "Delete entry",
  "entryList.sliceWeight": "Slice weight",
  "entryList.decreaseWeight": "Decrease slice weight",
  "entryList.increaseWeight": "Increase slice weight",
  "entryList.locked": "Locked while this result is showing.",
  "entryList.questionPlaceholder": "Question",
  "entryList.answerPlaceholder": "Answer",
  "entryList.reset": "Reset Entries",

  "entryMenu.customizeNamed": "Customize {name}",
  "entryMenu.customizeUnnamed": "Customize entry",
  "entryMenu.customizeTitle": "Customize entry",
  "entryMenu.untitled": "Untitled entry",
  "entryMenu.subtitle": "Entry customization",
  "entryMenu.sliceColor": "Slice color",
  "entryMenu.textColor": "Text color",
  "entryMenu.font": "Font",
  "entryMenu.font.arial": "Arial",
  "entryMenu.font.georgia": "Georgia",
  "entryMenu.font.verdana": "Verdana",
  "entryMenu.font.trebuchet": "Trebuchet MS",
  "entryMenu.font.courier": "Courier New",
  "entryMenu.fontUnavailable": "{name} (not available)",
  "entryMenu.emoji": "Emoji",
  "entryMenu.emojiNone": "None",
  "entryMenu.emojiSummary": "Emoji: {name}",
  "entryMenu.emojiSummaryNone": "Emoji: none",
  "entryMenu.noEmojiLabel": "No emoji",
  "entryMenu.skinToneGroup": "Emoji skin tone",
  "entryMenu.skinTone": "Skin tone",
  "entryMenu.emojiLocked":
    "Locked while the quiz runs. Back to Setup to change it.",

  "emoji.nameWithTone": "{name}, {tone} skin tone",
  "emoji.toneLabel": "{tone} skin tone",
  "emoji.toneInline.default": "default",
  "emoji.toneInline.light": "light",
  "emoji.toneInline.mediumLight": "medium-light",
  "emoji.toneInline.medium": "medium",
  "emoji.toneInline.mediumDark": "medium-dark",
  "emoji.toneInline.dark": "dark",

  "entryMenu.image": "Image",
  "entryMenu.max": "Max {size}",
  "entryMenu.replace": "Replace",
  "entryMenu.remove": "Remove",
  "entryMenu.add": "Add",
  "entryMenu.removeImageLabel": "Remove image",
  "entryMenu.imageAttached": "Image attached",
  "entryMenu.winnerSound": "Winner sound",
  "entryMenu.removeSoundLabel": "Remove winner sound",
  "entryMenu.audioAttached": "Audio attached",
  "entryMenu.error.notImage": "Please select an image file.",
  "entryMenu.error.imageUnreadable": "Could not read this image ({size}).",
  "entryMenu.error.imageTooBig":
    "Image is {size} and still over the {limit} limit after resizing.",
  "entryMenu.error.imageLoad": "The image could not be loaded.",
  "entryMenu.error.notAudio": "Please select an audio file.",
  "entryMenu.error.audioTooBig": "Audio must be {size} or smaller.",
  "entryMenu.error.audioLoad": "The audio file could not be loaded.",
  "entryMenu.gifNote": "Only the first frame of the GIF is used.",
  "entryMenu.duplicate": "Duplicate entry",
  "entryMenu.duplicateNamed": "Duplicate entry {name}",
  "entryMenu.duplicateLockedTitle": "Back to Setup to duplicate questions",
  "entryMenu.delete": "Delete entry",
  "entryMenu.deleteNamed": "Delete entry {name}",
  "entryMenu.deleteKeepTitle": "Keep at least 2 visible entries",
  "entryMenu.done": "Done",

  "loading.text": "Loading saved wheels…",

  "header.editTitleLabel": "Edit wheel title",
  "header.editDescriptionLabel": "Edit wheel description",
  "header.selectWheel": "Select wheel",
  "header.addWheel": "+ Wheel",
  "header.removeWheel": "− Wheel",
  "header.rename": "Rename",
  "header.shareLabel": "Share Spin the Wheel",

  "share.copied": "Link copied",
  "share.copyFailed": "Could not copy the link",

  "banner.stale":
    "Your wheels were changed in another tab. Reload to load the latest version. Changes made in this tab are not saved until you reload.",
  "banner.reload": "Reload",
  "banner.exportTabData": "Export this tab's data",
  "banner.unreadable.defaults.stored.ok":
    "Your saved data could not be read, so the app started with defaults. A copy was kept.",
  "banner.unreadable.defaults.stored.failed":
    "Your saved data could not be read, so the app started with defaults. A copy was kept. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.defaults.memory.ok":
    "Your saved data could not be read, so the app started with defaults. A copy was kept. The copy lasts only until the page is closed.",
  "banner.unreadable.defaults.memory.failed":
    "Your saved data could not be read, so the app started with defaults. A copy was kept. The copy lasts only until the page is closed. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.repaired.stored.ok":
    "Some of your saved data was repaired when it loaded. A copy of the original was kept.",
  "banner.unreadable.repaired.stored.failed":
    "Some of your saved data was repaired when it loaded. A copy of the original was kept. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.repaired.memory.ok":
    "Some of your saved data was repaired when it loaded. A copy of the original was kept. The copy lasts only until the page is closed.",
  "banner.unreadable.repaired.memory.failed":
    "Some of your saved data was repaired when it loaded. A copy of the original was kept. The copy lasts only until the page is closed. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.legacy.stored.ok":
    "Your saved data could not be read, so the app loaded an older saved copy instead. A copy was kept.",
  "banner.unreadable.legacy.stored.failed":
    "Your saved data could not be read, so the app loaded an older saved copy instead. A copy was kept. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.legacy.memory.ok":
    "Your saved data could not be read, so the app loaded an older saved copy instead. A copy was kept. The copy lasts only until the page is closed.",
  "banner.unreadable.legacy.memory.failed":
    "Your saved data could not be read, so the app loaded an older saved copy instead. A copy was kept. The copy lasts only until the page is closed. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.kept.stored.ok":
    "A copy of saved data that could not be read earlier is still kept.",
  "banner.unreadable.kept.stored.failed":
    "A copy of saved data that could not be read earlier is still kept. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.unreadable.kept.memory.ok":
    "A copy of saved data that could not be read earlier is still kept. The copy lasts only until the page is closed.",
  "banner.unreadable.kept.memory.failed":
    "A copy of saved data that could not be read earlier is still kept. The copy lasts only until the page is closed. The copy could not be deleted. Export it first if you need it, then try again.",
  "banner.stillUnreadable":
    "The saved data is still unreadable. It will be replaced when you make a change or import a file.",
  "banner.saveFailed":
    "Your changes could not be saved because browser storage is full. Export your data to keep a copy.",
  "banner.storageFull":
    "Browser storage is about {percent}% full. Large images and sounds take the most space. Export your data to keep a copy, or remove media you no longer need.",
  "banner.dismiss": "Dismiss",
  "banner.dismissImportLabel": "Dismiss import error",

  "import.tooLarge": "This file is too large to import. The limit is {size}.",
  "import.failed":
    "The selected file could not be imported. Choose a valid Spin the Wheel JSON export.",
  "import.confirmTitle": "Import wheel data?",
  "import.confirmMessage": "This will replace the current saved wheel data.",

  "tabs.showHistoryLabel": "Show history",

  "entriesPanel.exportLabel": "Export data",
  "entriesPanel.importLabel": "Import data",
  "entriesPanel.exportNote": "Exports include all questions and answers.",

  "history.title": "Spin History",
  "history.description": "Completed spins are recorded here.",
  "history.close": "Close",
  "history.empty": "No spins recorded yet.",
  "history.clear": "Clear History",
  "history.rowNumber": "#{number}",

  "result.title": "Result",
  "result.clear": "Clear result",
  "result.questionIntro": "And the question is...",
  "result.yourQuestion": "Your question",
  "result.answer": "The answer",
  "result.hideAnswer": "Hide Answer",
  "result.showAnswer": "Show Answer",
  "result.anotherSpin": "Give it another spin 😉",
  "result.backToSetup": "Back to Setup",
  "result.done": "Done",

  "quizStatus.spinning": "Spinning... 🎡",
  "quizStatus.allHidden": "All remaining questions are hidden.",
  "quizStatus.readyToSpin": "Alright... give it a spin 😉",
  "quizStatus.spinningHint": "The question will appear when the wheel stops.",
  "quizStatus.showOne": "Show one or go back to setup.",
  "quizStatus.waiting": "The question is waiting.",

  "quizCard.title": "Quiz Mode",
  "quizCard.description":
    "Configure your questions and answers, then start the quiz before handing the wheel to the contestant.",
  "quizCard.needsAnswers":
    "Every question needs both a question and an answer before the quiz can start.",
  "quizCard.needsTwo": "Show at least 2 questions to start the quiz.",

  "quizSetup.title": "Quiz Setup",
  "quizSetup.description":
    "Add a question and answer for every entry before starting.",
  "quizSetup.start": "Start Quiz",
  "quizSetup.needsAnswers":
    "Every question needs both a question and an answer.",

  "quizProgress.complete": "Quiz Complete",
  "quizProgress.inProgress": "Quiz in Progress",
  "quizProgress.allSelected": "All questions have been selected.",
  "quizProgress.allHidden":
    "All remaining questions are hidden. Show one or go back to setup.",
  "quizProgress.contestant": "The contestant can now spin the wheel.",
  "quizProgress.remaining": "Questions Remaining",

  "wheelEmpty.completeTitle": "Quiz complete",
  "wheelEmpty.hiddenTitle": "All remaining questions are hidden",
  "wheelEmpty.completeMessage":
    "Every question has been asked. Back to Setup to run it again.",
  "wheelEmpty.hiddenMessage": "Show one to keep going, or go back to setup.",

  "wheel.keepTwoVisible": "Keep at least 2 entries visible.",
  "wheel.showTwoToSpin": "Show at least 2 entries to spin.",

  "footer.entries": {
    one: "{count} entry",
    other: "{count} entries",
  },

  "wheelView.controls": "Wheel controls",
  "wheelView.decreaseSize": "Decrease wheel size",
  "wheelView.increaseSize": "Increase wheel size",
  "wheelView.mute": "Mute sound",
  "wheelView.unmute": "Unmute sound",
  "wheelView.closeFullscreen": "Close fullscreen",
  "wheelView.closeTitle": "Close (Esc)",
  "wheelView.close": "Close",
  "wheelView.exitFullscreen": "Exit fullscreen",
  "wheelView.enterFullscreen": "Enter fullscreen",
  "wheelView.fullscreenTitle": "Fullscreen",
  "wheelView.svgLabel": "Spin the wheel",
  "wheelView.emptyTitle": "No visible entries",
  "wheelView.emptyMessage":
    "Add entries or show hidden ones to spin the wheel.",
  "wheelView.spin": "Spin",
  "wheelView.spinning": "Spinning…",

  "winnerBox.label": "Winner",
  "winnerBox.heading": "Winner",
  "winnerBox.continue": "Continue",
  "winnerBox.remove": "Remove",

  "quizBox.label": "Quiz answer",
  "quizBox.qaLabel": "Question and answer",
  "quizBox.question": "Question",
  "quizBox.answer": "Answer",

  "feedback.version": "App version {version}",
  "feedback.happened.label": "What happened",
  "feedback.did.label": "What I did",
  "feedback.expected.label": "What I expected",
  "feedback.device.label": "Device and browser",
  "feedback.device.placeholder": "iPhone 15, Safari",
  "feedback.email.label": "Email",
  "feedback.email.hint": "Only used to reply to you.",
  "feedback.required": "Required",
  "feedback.optional": "Optional",
  "feedback.counter": "{length} / {max}",
  "feedback.error.happened": "Tell us what happened.",
  "feedback.error.email": "That email doesn't look right.",
  "feedback.honeypot": "Leave this field empty",
  "feedback.securityCheck": "Security check",
  "feedback.privacy":
    "Your report goes to the developer's private storage. It includes the app version and what you type, and your email if you add one. It's used only to fix problems and to reply. Reports are kept for up to 6 months, then deleted by hand. A security check from Cloudflare runs when you send. Don't include personal or sensitive information.",
  "feedback.newTab": "(opens in a new tab)",
  "feedback.status.offline":
    "You're offline. Try again when you're back, or <link>use GitHub</link>.",
  "feedback.status.waiting": "Please wait for the check to finish.",
  "feedback.status.check":
    "The security check couldn't finish. Try again, or <link>use GitHub</link>.",
  "feedback.status.limited":
    "Too many reports right now. Try again later, or <link>use GitHub</link>.",
  "feedback.status.failed":
    "Couldn't send your report. Your text is still here. Try again, or <link>use GitHub</link>.",
  "feedback.thanks": "Thanks, we got it",
  "feedback.close": "Close",
  "feedback.sending": "Sending…",
  "feedback.retry": "Retry",
  "feedback.send": "Send",

  "defaults.wheelTitle": "Spin the Wheel",
  "defaults.wheelDescription": "Create a wheel for anything.",
  "defaults.wheelName": "Wheel {number}",
  "defaults.wheelNameFallback": "Wheel",
  "defaults.option": "Option {number}",
  "defaults.question": "Question {number}",
  "defaults.copyName": "{name} Copy",

  "meta.title": "Spin the Wheel",
  "meta.description":
    "Create and customize wheels for games, quizzes, decisions, and more.",

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
    "Yes, in an entry's ... menu. Images are shrunk to fit and must be {imageSize} or smaller afterwards. A sound can be up to {soundSize}, and plays when that entry wins.",
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
