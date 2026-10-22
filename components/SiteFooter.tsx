import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-gray-100 dark:border-gray-800 py-8 px-4 text-center text-xs text-gray-400">
      <p>MakeQR Pro is made by Ridgeline Apps LLC · Wheelersburg, Ohio</p>
      <p className="mt-2">
        Also from us:{" "}
        <a href="https://snap.vin/" className="text-indigo-500 hover:underline">
          Snap.VIN
        </a>{" "}
        (free VIN decoder)
        {" · "}
        <Link href="/about" className="text-indigo-500 hover:underline">
          About
        </Link>
        {" · "}
        <Link href="/best-practices" className="text-indigo-500 hover:underline">
          Best practices
        </Link>
        {" · "}
        <Link href="/privacy" className="text-indigo-500 hover:underline">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="text-indigo-500 hover:underline">
          Terms
        </Link>
      </p>
    </footer>
  );
}
