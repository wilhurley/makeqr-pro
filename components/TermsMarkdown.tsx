import type { ReactNode } from "react";

/**
 * Renders the small markdown subset used by Legal Review's Terms files:
 * #/## headings, paragraphs, "- " and "1. " lists, "> " blockquotes, **bold**, *italic*, [links](url).
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) out.push(<strong key={key}>{inline(m[1], key)}</strong>);
    else if (m[2] !== undefined) out.push(
      <a key={key} href={m[3]} className="text-indigo-600 underline">{inline(m[2], key)}</a>,
    );
    else out.push(<em key={key}>{inline(m[4], key)}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { kind: "h1" | "h2" | "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "quote"; blocks: Block[] };

function parse(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (line.startsWith(">")) {
      const inner: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) inner.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ kind: "quote", blocks: parse(inner) });
      continue;
    }
    if (line.startsWith("## ")) { blocks.push({ kind: "h2", text: line.slice(3) }); i++; continue; }
    if (line.startsWith("# ")) { blocks.push({ kind: "h1", text: line.slice(2) }); i++; continue; }
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ""));
      blocks.push({ kind: "ol", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#|>|- |\d+\. )/.test(lines[i])) para.push(lines[i++]);
    blocks.push({ kind: "p", text: para.join(" ") });
  }
  return blocks;
}

function render(blocks: Block[], keyBase: string): ReactNode[] {
  return blocks.map((b, n) => {
    const key = `${keyBase}-${n}`;
    switch (b.kind) {
      case "h1": return <h1 key={key} className="text-4xl font-bold text-gray-900 mt-3 mb-3">{inline(b.text, key)}</h1>;
      case "h2": return <h2 key={key} className="text-xl font-semibold text-gray-900 mt-8 mb-2">{inline(b.text, key)}</h2>;
      case "p": return <p key={key} className="mt-3">{inline(b.text, key)}</p>;
      case "ul": return <ul key={key} className="list-disc pl-6 mt-3 space-y-1">{b.items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`)}</li>)}</ul>;
      case "ol": return <ol key={key} className="list-decimal pl-6 mt-3 space-y-1">{b.items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`)}</li>)}</ol>;
      case "quote": return <blockquote key={key} className="border-l-4 border-indigo-200 bg-indigo-50 px-4 py-3 mt-4">{render(b.blocks, key)}</blockquote>;
    }
  });
}

export function TermsMarkdown({ source }: { source: string }) {
  return <div className="text-gray-700 leading-relaxed">{render(parse(source.split("\n")), "t")}</div>;
}
