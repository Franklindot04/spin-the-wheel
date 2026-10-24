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
