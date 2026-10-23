/*
 * The questions and answers of the FAQ dialog, as plain data. The
 * dialog only shows what it is given, so another language can supply
 * the same shape without changing the dialog. Ids stay the same in
 * every language. The dialog title and its two button labels are in
 * the i18n dictionary (faq.title, faq.close, faq.feedback).
 *
 * An item with action "feedback" gets a button after its answer
 * that opens the feedback form.
 */
export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  action?: "feedback";
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "add-options",
    question: "How do I add options?",
    answer:
      "Use + Add in the Entries list, then type a name. Press Spin when you are ready.",
  },
  {
    id: "slice-weight",
    question:
      "How do I make some options more likely to win?",
    answer:
      "Change an entry's slice weight with the − and + buttons. A higher weight gives it a bigger slice.",
  },
  {
    id: "hide-options",
    question:
      "How do I hide an option without deleting it?",
    answer:
      "Tap the eye icon on its row. Hide all hides every option, and Show all brings back only the ones Hide all hid.",
  },
  {
    id: "continue-remove",
    question: "What do Continue and Remove do?",
    answer:
      "Continue keeps every option. Remove hides the winner, and you can bring it back with its eye icon. Remove is not available when only two options are visible.",
  },
  {
    id: "quiz-mode",
    question: "How does Quiz Mode work?",
    answer:
      "Give every entry a question and an answer, then press Start Quiz. Spin the wheel, and press Show Answer when you are ready. Each question is asked once.",
  },
  {
    id: "data-storage",
    question: "Where is my data stored?",
    answer:
      "Your wheels stay in your browser on your device, so clearing your browser data removes them. Only the Send feedback form sends anything, and only when you submit it.",
  },
  {
    id: "backup",
    question: "How do I back up or move my wheels?",
    answer:
      "Use Export to save a file, and Import to load it on another device. Import replaces everything saved in that browser.",
  },
  {
    id: "share",
    question: "How do I share the app?",
    answer:
      "Use Share in the header on desktop, or in More under the wheel on phones. It opens your device's share sheet, or copies the link.",
  },
  {
    id: "iphone-sound",
    question: "Why is there no sound on my iPhone?",
    answer:
      "Sound starts after you tap Spin, and the ringer switch can silence web sounds. Check Settings, then Sound, and the mute button next to the wheel.",
  },
  {
    id: "image-sound",
    question: "Can I add my own image or sound?",
    answer:
      "Yes, in an entry's ... menu. Images are shrunk to fit and must be 1 MB or smaller afterwards. A sound can be up to 2 MB, and plays when that entry wins.",
  },
  {
    id: "report-problem",
    question: "How do I report a problem?",
    answer:
      "Use Send feedback in the menu on phones, or in Settings on desktop. It needs no account. You can also open an issue on GitHub.",
    action: "feedback",
  },
];
