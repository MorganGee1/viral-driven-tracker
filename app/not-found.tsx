import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="label">404</div>
      <h1 className="text-2xl font-bold">That page isn&apos;t here.</h1>
      <Link href="/" className="btn-ghost">Back to the site</Link>
    </div>
  );
}
