import type { PlainMessageKey } from "./i18n/messages";

/*
 * The questions and answers of the FAQ dialog. The words are in
 * the i18n dictionary (faq.item.<id>.question and .answer, and
 * faq.title, faq.close and faq.feedback), so this list holds
 * only the ids, the keys and the actions. Ids stay the same in
 * every language.
 *
 * An item with action "feedback" gets a button after its answer
 * that opens the feedback form.
 */
export type FaqSource = {
  id: string;
  question: PlainMessageKey;
  answer: PlainMessageKey;
  action?: "feedback";
};

/* An item with its words filled in, which is what the dialog shows. */
export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  action?: "feedback";
};

export const FAQ_ITEMS: FaqSource[] = [
  {
    id: "add-options",
    question: "faq.item.add-options.question",
    answer: "faq.item.add-options.answer",
  },
  {
    id: "slice-weight",
    question: "faq.item.slice-weight.question",
    answer: "faq.item.slice-weight.answer",
  },
  {
    id: "hide-options",
    question: "faq.item.hide-options.question",
    answer: "faq.item.hide-options.answer",
  },
  {
    id: "continue-remove",
    question: "faq.item.continue-remove.question",
    answer: "faq.item.continue-remove.answer",
  },
  {
    id: "quiz-mode",
    question: "faq.item.quiz-mode.question",
    answer: "faq.item.quiz-mode.answer",
  },
  {
    id: "data-storage",
    question: "faq.item.data-storage.question",
    answer: "faq.item.data-storage.answer",
  },
  {
    id: "backup",
    question: "faq.item.backup.question",
    answer: "faq.item.backup.answer",
  },
  {
    id: "share",
    question: "faq.item.share.question",
    answer: "faq.item.share.answer",
  },
  {
    id: "iphone-sound",
    question: "faq.item.iphone-sound.question",
    answer: "faq.item.iphone-sound.answer",
  },
  {
    id: "image-sound",
    question: "faq.item.image-sound.question",
    answer: "faq.item.image-sound.answer",
  },
  {
    id: "report-problem",
    question: "faq.item.report-problem.question",
    answer: "faq.item.report-problem.answer",
    action: "feedback",
  },
];
