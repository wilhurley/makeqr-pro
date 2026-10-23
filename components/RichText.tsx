import Link from "next/link";

const LINKS: Record<string, { href: string; label: string }> = {
  "best-practices": { href: "/best-practices", label: "best practices" },
  home: { href: "/", label: "the generator" },
};

export function RichText({ text }: { text: string }) {
  const chunks = text.split(/\{([a-z-]+)\}/g);

  return (
    <>
      {chunks.map((chunk, index) => {
        if (index % 2 === 0) return <span key={index}>{chunk}</span>;
        const link = LINKS[chunk];
        if (!link) return <span key={index}>{chunk}</span>;
        return (
          <Link key={index} href={link.href} className="text-indigo-600 hover:underline">
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
