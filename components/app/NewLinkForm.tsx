"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createLink } from "@/lib/actions";
import { PLACEMENTS, PLACEMENT_KEYS, PLATFORMS, PLATFORM_KEYS, defaultLinkName, type Placement, type Platform } from "@/lib/util";

type Props = {
  productId: string;
  back: string;
  pages: { id: string; name: string }[];
  /** accounts this person has typed before, offered again so they are spelled the same every time */
  accounts: { platform: Platform; account: string }[];
  /** team only: make the link on behalf of a creator */
  owners?: { id: string; label: string }[];
  defaultOwner?: string;
};

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full disabled:opacity-50" disabled={disabled || pending}>{pending ? "Making link…" : "Make link"}</button>;
}

export function NewLinkForm({ productId, back, pages, accounts, owners, defaultOwner }: Props) {
  const [platform, setPlatform] = useState<Platform>(accounts[0]?.platform ?? "instagram");
  const [placement, setPlacement] = useState<Placement>("bio");
  const [name, setName] = useState<string | null>(null); // null = still following the suggestion
  const remembered = [...new Set(accounts.filter((a) => a.platform === platform && a.account).map((a) => a.account))];
  const noPages = pages.length === 0;

  return (
    <form action={createLink} className="card space-y-3 p-5">
      <div className="label">New link</div>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="back" value={back} />
      {noPages && (
        <div className="rounded-lg border border-amber/40 bg-amber/10 p-3 text-xs text-amber">
          This product has no Amazon page yet, so links cannot be made. {owners ? "Add one in Settings." : "Tell your manager."}
        </div>
      )}
      {pages.length === 1 && <input type="hidden" name="page_id" value={pages[0].id} />}
      {pages.length > 1 && (
        <label className="block">
          <span className="label mb-1.5 block">Amazon page</span>
          <select name="page_id" className="select" required defaultValue="">
            <option value="" disabled>Pick the page this link opens</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}
      {owners && (
        <label className="block">
          <span className="label mb-1.5 block">For</span>
          <select name="owner_id" className="select" defaultValue={defaultOwner}>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label mb-1.5 block">Platform</span>
          <select name="platform" className="select" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            {PLATFORM_KEYS.map((k) => <option key={k} value={k}>{PLATFORMS[k]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Placement</span>
          <select name="placement" className="select" value={placement} onChange={(e) => setPlacement(e.target.value as Placement)}>
            {PLACEMENT_KEYS.map((k) => <option key={k} value={k}>{PLACEMENTS[k]}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="label mb-1.5 block">Account</span>
        <input name="account" required maxLength={80} list="remembered-accounts" autoComplete="off" autoCapitalize="none"
          placeholder={platform === "facebook" ? "Page name, e.g. Lashtruth.nora" : "@handle, e.g. @lashtruth.nora"} className="input" />
        <datalist id="remembered-accounts">{remembered.map((a) => <option key={a} value={a} />)}</datalist>
      </label>
      <label className="block">
        <span className="label mb-1.5 block">Link name</span>
        <input name="name" maxLength={80} className="input" value={name ?? defaultLinkName(platform, placement)} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block">
        <span className="label mb-1.5 block">Note (optional)</span>
        <input name="note" maxLength={300} placeholder="Anything you want to remember about this link" className="input" />
      </label>
      <Submit disabled={noPages} />
      <p className="font-mono text-[11px] leading-relaxed text-ink-3">
        One link per account and per place you put it. That is how sales get split by account and placement.
      </p>
    </form>
  );
}
