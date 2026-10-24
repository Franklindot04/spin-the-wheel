"use client";

import { useId, useRef } from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import type { AppearanceThemeConfig } from "../lib/wheel-types";
import { usePopover } from "../lib/use-popover";
import { useT } from "../lib/i18n/provider";

type WheelChipProps = {
  theme: AppearanceThemeConfig;
  open: boolean;
  onToggle: () => void;
  /* restoreFocus is true when focus should go back to the chip. */
  onClose: (restoreFocus: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
  wheels: { id: string; name: string }[];
  activeWheelId: string;
  spinning: boolean;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onRename: () => void;
  onDelete: () => void;
};

/*
 * The wheel chip above the wheel on phones: shows the active wheel's
 * name and opens a small popover to switch, add, rename or delete
 * wheels. The wide layout keeps these in the header.
 */
export default function WheelChip({
  theme,
  open,
  onToggle,
  onClose,
  buttonRef,
  wheels,
  activeWheelId,
  spinning,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
}: WheelChipProps) {
  const t = useT();

  const menuId = useId();
  const wrapperRef =
    useRef<HTMLDivElement>(null);
  const menuRef =
    useRef<HTMLDivElement>(null);

  const activeName =
    wheels.find(
      (wheel) => wheel.id === activeWheelId,
    )?.name ?? "";

  const handleBlur = usePopover(
    open,
    onClose,
    wrapperRef,
    () =>
      menuRef.current?.querySelector<HTMLElement>(
        '[aria-current="true"]',
      ) ??
      menuRef.current?.querySelector<HTMLElement>(
        "[data-menu-item]:not(:disabled)",
      ),
  );

  /*
   * The popover closes first, so an action that opens a browser
   * prompt does not leave it showing.
   */
  function activate(action: () => void) {
    flushSync(() => {
      onClose(true);
    });

    action();
  }

  const canDelete = wheels.length > 1;

  const deleteReason = spinning
    ? t("common.waitForSpin")
    : !canDelete
      ? t("wheelChip.needsTwo")
      : "";

  const itemClass = `flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current disabled:cursor-not-allowed disabled:opacity-50 ${theme.controlHoverClass}`;

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0 max-w-full"
      onBlur={handleBlur}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        disabled={spinning}
        aria-label={t("wheelChip.label", {
          name: activeName,
        })}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        className={`flex h-11 max-w-full min-w-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-40 ${theme.controlClass} ${theme.controlHoverClass}`}
      >
        <span className="min-w-0 truncate">
          {activeName}
        </span>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          aria-label={t("wheelChip.menu")}
          className={`absolute left-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border py-1 shadow-xl ${theme.surfaceClass} ${theme.borderClass} ${theme.textPrimaryClass}`}
        >
          <div className="max-h-60 overflow-y-auto overscroll-contain">
            {wheels.map((wheel) => {
              const active =
                wheel.id === activeWheelId;

              return (
                <button
                  key={wheel.id}
                  type="button"
                  data-menu-item=""
                  aria-current={
                    active ? "true" : undefined
                  }
                  onClick={() =>
                    activate(() =>
                      onSwitch(wheel.id),
                    )
                  }
                  className={`${itemClass} ${
                    active
                      ? "font-semibold"
                      : ""
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 shrink-0 ${
                      active
                        ? ""
                        : "invisible"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  <span className="min-w-0 truncate">
                    {wheel.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={`my-1 border-t ${theme.borderClass}`}
            aria-hidden="true"
          />

          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onAdd)}
            disabled={spinning}
            className={itemClass}
          >
            {t("wheelChip.add")}
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onRename)}
            disabled={spinning}
            className={itemClass}
          >
            {t("wheelChip.rename")}
          </button>

          <button
            type="button"
            data-menu-item=""
            onClick={() => activate(onDelete)}
            disabled={spinning || !canDelete}
            title={deleteReason || undefined}
            className={`${itemClass} flex-col items-start gap-0`}
          >
            <span>{t("wheelChip.delete")}</span>
            {deleteReason ? (
              <span
                className={`text-xs font-normal ${theme.textMutedClass}`}
              >
                {deleteReason}
              </span>
            ) : null}
          </button>
        </div>
      )}
    </div>
  );
}
