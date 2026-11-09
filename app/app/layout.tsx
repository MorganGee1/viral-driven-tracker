import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe, getBrandsWithCampaigns } from "@/lib/data";
import { Logo } from "@/components/site/Nav";
import { Sidebar } from "@/components/app/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");
  const { brands, campaigns } = await getBrandsWithCampaigns();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-panel md:flex">
        <div className="flex h-16 items-center border-b border-line px-5"><Logo /></div>
        <Sidebar brands={brands} campaigns={campaigns} isManager={me.role === "manager"} />
        <div className="mt-auto border-t border-line p-4">
          <div className="flex items-center gap-3">
            {me.avatar_url ? <img src={me.avatar_url} alt="" className="h-8 w-8 rounded-full" /> : <div className="h-8 w-8 rounded-full bg-line-2" />}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{me.username}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{me.role}</div>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="mt-3">
            <button className="btn-ghost w-full py-1.5 text-xs">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-line px-4 md:hidden">
          <Logo />
          <Link href="/app" className="text-sm text-ink-2">Campaigns</Link>
        </div>
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
