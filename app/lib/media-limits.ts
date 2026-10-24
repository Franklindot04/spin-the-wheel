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
 * Gives "512 B", "1.5 KB" or "1.0 MB". The unit words are
 * messages (fileSize.*) so a language can write them its own
 * way. The menu shows one decimal; the FAQ passes 0 to read
 * "1 MB".
 */
export function formatFileSize(
  t: (
    key: FileSizeKey,
    params: { value: string },
  ) => string,
  bytes: number,
  fractionDigits = 1,
): string {
  if (bytes < 1024) {
    return t("fileSize.bytes", {
      value: String(bytes),
    });
  }

  if (bytes < 1024 * 1024) {
    return t("fileSize.kilobytes", {
      value: (bytes / 1024).toFixed(fractionDigits),
    });
  }

  return t("fileSize.megabytes", {
    value: (bytes / (1024 * 1024)).toFixed(
      fractionDigits,
    ),
  });
}
