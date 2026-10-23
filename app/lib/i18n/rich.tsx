import { Fragment } from "react";
import type { ReactNode } from "react";
import { interpolate, type Params } from "./translate";

/*
 * Sentences that hold a link or another element. The
 * translator writes the element as a tag around the words,
 * such as "Try again, or <link>use GitHub</link>", so the
 * words can move to wherever the language needs them.
 */
export type RichNode =
  | { type: "text"; value: string }
  | {
      type: "tag";
      name: string;
      children: RichNode[];
    };

export type RichComponents = Readonly<
  Record<string, (children: ReactNode) => ReactNode>
>;

type Frame = {
  name: string;
  raw: string;
  children: RichNode[];
};

function pushText(nodes: RichNode[], value: string) {
  if (!value) {
    return;
  }

  const last = nodes[nodes.length - 1];

  if (last && last.type === "text") {
    last.value += value;
  } else {
    nodes.push({ type: "text", value });
  }
}

/*
 * Splits a message into text and tags. A tag that is not
 * closed, or a closing tag with nothing open, is kept as
 * plain text, so a mistake in a translation shows instead
 * of dropping words.
 */
export function parseRich(template: string): RichNode[] {
  const root: Frame = {
    name: "",
    raw: "",
    children: [],
  };

  const stack: Frame[] = [root];

  let position = 0;

  const tag = /<(\/?)([A-Za-z][A-Za-z0-9]*)>/g;

  let match: RegExpExecArray | null;

  while ((match = tag.exec(template)) !== null) {
    const top = stack[stack.length - 1];

    pushText(
      top.children,
      template.slice(position, match.index),
    );

    position = match.index + match[0].length;

    const closing = match[1] === "/";
    const name = match[2];

    if (!closing) {
      stack.push({
        name,
        raw: match[0],
        children: [],
      });

      continue;
    }

    if (top.name === name && stack.length > 1) {
      stack.pop();

      stack[stack.length - 1].children.push({
        type: "tag",
        name,
        children: top.children,
      });
    } else {
      pushText(top.children, match[0]);
    }
  }

  pushText(
    stack[stack.length - 1].children,
    template.slice(position),
  );

  while (stack.length > 1) {
    const open = stack.pop() as Frame;
    const parent = stack[stack.length - 1];

    pushText(parent.children, open.raw);

    for (const child of open.children) {
      if (child.type === "text") {
        pushText(parent.children, child.value);
      } else {
        parent.children.push(child);
      }
    }
  }

  return root.children;
}

/*
 * Turns the parsed message into elements. Placeholders are
 * filled in after the split, so a value that contains "<"
 * (an entry name, say) is never read as a tag. A tag with
 * no matching component shows its words without it.
 */
export function renderRich(
  nodes: RichNode[],
  components: RichComponents,
  params?: Params,
): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "text") {
      return (
        <Fragment key={index}>
          {interpolate(node.value, params)}
        </Fragment>
      );
    }

    const children = renderRich(
      node.children,
      components,
      params,
    );

    const component = components[node.name];

    return (
      <Fragment key={index}>
        {component ? component(children) : children}
      </Fragment>
    );
  });
}
