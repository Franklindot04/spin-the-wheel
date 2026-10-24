import type { en } from "./i18n/en";
import type { PlainMessageKey } from "./i18n/messages";
import type { Translator } from "./i18n/typed";
import {
  MAX_AUDIO_SIZE,
  MAX_IMAGE_SIZE,
  formatFileSize,
} from "./media-limits";

const SIZED_ANSWER = "faq.item.image-sound.answer";

/*
 * The questions and answers of the FAQ dialog. The words are in
 * the i18n dictionary (faq.item.<id>.question and .answer, and
 * faq.title, faq.close and faq.feedback), so this list holds
 * only the ids, the keys and the actions. Ids stay the same in
 * every language. The answer about images and sounds has the two
 * size limits as values; buildFaqItems fills them in from
 * media-limits.ts.
 *
 * An item with action "feedback" gets a button after its answer
 * that opens the feedback form.
 */
export type FaqSource = {
  id: string;
  question: PlainMessageKey;
  answer: PlainMessageKey | typeof SIZED_ANSWER;
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
    answer: SIZED_ANSWER,
  },
  {
    id: "report-problem",
    question: "faq.item.report-problem.question",
    answer: "faq.item.report-problem.answer",
    action: "feedback",
  },
];

/* The items with their words in the current language. */
export function buildFaqItems(
  t: Translator<typeof en>,
  language: string,
): FaqItem[] {
  return FAQ_ITEMS.map((item) => ({
    id: item.id,
    question: t(item.question),
    answer:
      item.answer === SIZED_ANSWER
        ? t(item.answer, {
            imageSize: formatFileSize(
              t,
              language,
              MAX_IMAGE_SIZE,
              0,
            ),
            soundSize: formatFileSize(
              t,
              language,
              MAX_AUDIO_SIZE,
              0,
            ),
          })
        : t(item.answer),
    action: item.action,
  }));
}
