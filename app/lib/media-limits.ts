/*
 * The size limits for the image and the winner sound of an entry,
 * and the one function that writes a size as text. The entry menu
 * enforces the limits and shows them, and the FAQ names them, so
 * all of them read from here.
 */
export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

export const MAX_AUDIO_SIZE = 2 * 1024 * 1024;

type FileSizeKey =
  | "fileSize.bytes"
  | "fileSize.kilobytes"
  | "fileSize.megabytes";

/*
 * Writes a number the way the language does, with the decimal
 * mark of that language and no grouping, so English still gives
 * "1.5". A language the browser does not know gives the plain
 * digits.
 */
function formatNumber(
  value: number,
  fractionDigits: number,
  language: string,
): string {
  try {
    return new Intl.NumberFormat(language, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: false,
    }).format(value);
  } catch {
    return value.toFixed(fractionDigits);
  }
}

/*
 * Gives "512 B", "1.5 KB" or "1.0 MB". The unit words are
 * messages (fileSize.*) so a language can write them its own
 * way, and the number follows the language. The menu shows one
 * decimal; the FAQ passes 0 to read "1 MB".
 */
export function formatFileSize(
  t: (
    key: FileSizeKey,
    params: { value: string },
  ) => string,
  language: string,
  bytes: number,
  fractionDigits = 1,
): string {
  if (bytes < 1024) {
    return t("fileSize.bytes", {
      value: formatNumber(bytes, 0, language),
    });
  }

  if (bytes < 1024 * 1024) {
    return t("fileSize.kilobytes", {
      value: formatNumber(
        bytes / 1024,
        fractionDigits,
        language,
      ),
    });
  }

  return t("fileSize.megabytes", {
    value: formatNumber(
      bytes / (1024 * 1024),
      fractionDigits,
      language,
    ),
  });
}
