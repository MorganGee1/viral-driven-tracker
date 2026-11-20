import type { AmazonStatus, Brand, ConnectLinkRow } from "@/lib/data";
import { APP_KEYS, APP_LABEL, amazonConfigured, appConfigured, asApp } from "@/lib/amazon";
import { disconnectAmazon, pickAmazonAdvertiser, setTagTemplate, syncAmazon } from "@/lib/actions";
import { ConnectLinkPanel } from "@/components/app/ConnectLinkPanel";

/**
 * Everything about a brand's Amazon Ads connection, in one box on the brand page: connect, the client
 * connect link, sync, disconnect and the tag template. One connection covers every product of the brand,
 * which is why it sits here and not in a product's Settings.
 */
export function AmazonConnection({ brand, amazon, connectLink, origin, back }: {
  brand: Brand; amazon: AmazonStatus; connectLink: ConnectLinkRow | null; origin: string; back: string;
}) {
  const apiReady = amazonConfigured();
  // Each brand connects through one of two Login with Amazon apps. This is the one a new connection would use.
  const app = asApp(brand.amazon_app);
  const appReady = appConfigured(app);
  const liveApp = amazon.connected ? asApp(amazon.app) : app; // the app the stored connection came from
  const appWhat = { direct: "the one Amazon approved for your own brand", partner: "the one Amazon approved for client accounts" };
  const clientLink = <ConnectLinkPanel link={connectLink} brandId={brand.id} brandName={brand.name} origin={origin} back={back} connected={amazon.connected} />;

  return (
    <div id="amazon" className="card scroll-mt-6 space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="label">Amazon connection</div>
        {amazon.connected && amazon.advertiser_id ? <span className="pill-live">connected</span>
          : brand.tag_template ? <span className="pill-live">tags automatic</span>
          : <span className="pill border-amber/40 text-amber">not connected</span>}
      </div>

      {amazon.connected ? (
        <div className="space-y-3">
          {amazon.advertiser_id ? (
            <p className="text-sm leading-relaxed text-ink-2">
              Connected to <strong className="text-ink">{amazon.advertiser_name}</strong> in Amazon Attribution. Every new link is tagged the moment it is made, and the last 31 days are pulled from Amazon every night.
            </p>
          ) : (
            <form action={pickAmazonAdvertiser} className="space-y-2">
              <input type="hidden" name="brand_id" value={brand.id} /><input type="hidden" name="back" value={back} />
              <p className="text-sm text-ink-2">That Amazon login can see more than one Amazon Attribution advertiser. Pick the one that is {brand.name}.</p>
              <div className="flex gap-2">
                <select name="advertiser_id" className="select" required defaultValue="">
                  <option value="" disabled>Pick the advertiser</option>
                  {(amazon.candidates ?? []).map((c) => <option key={c.advertiserId} value={c.advertiserId}>{c.advertiserName} ({c.countryCode})</option>)}
                </select>
                <button className="btn-primary shrink-0">Use this one</button>
              </div>
            </form>
          )}
          <div className="font-mono text-xs leading-relaxed text-ink-3">
            Connected through the {APP_LABEL[liveApp]}, {appWhat[liveApp]}.{liveApp !== app ? ` Reconnecting moves ${brand.name} to the ${APP_LABEL[app]}.` : ""}
          </div>
          <div className="font-mono text-xs leading-relaxed text-ink-3">
            {amazon.last_sync_at
              ? <>Last sync {new Date(amazon.last_sync_at).toLocaleString("en-GB", { timeZone: "America/Los_Angeles", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} Los Angeles time · {amazon.last_sync_status === "ok" ? `${amazon.last_sync_rows ?? 0} rows` : <span className="text-rose">failed: {amazon.last_sync_status}</span>}</>
              : "Not synced yet."}
          </div>
          <div className="flex flex-wrap gap-2">
            {amazon.advertiser_id && (
              <form action={syncAmazon}>
                <input type="hidden" name="brand_id" value={brand.id} /><input type="hidden" name="back" value={back} />
                <button className="btn-primary">Sync now</button>
              </form>
            )}
            {appReady && <a href={`/api/amazon/connect?brand=${brand.id}&back=${encodeURIComponent(back)}`} className="btn-ghost">Reconnect</a>}
            <form action={disconnectAmazon}>
              <input type="hidden" name="brand_id" value={brand.id} /><input type="hidden" name="back" value={back} />
              <button className="btn-danger">Disconnect</button>
            </form>
          </div>
          {appReady && clientLink}
        </div>
      ) : appReady ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-2">
            Connect {brand.name}&apos;s Amazon Ads account. Whoever owns it signs in with Amazon and approves access to Amazon Attribution. After that, links are tagged automatically and sales sync every night.
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            Hold the Amazon login yourself? Press the button. Does a client hold it? Send them the link underneath.
          </p>
          <a href={`/api/amazon/connect?brand=${brand.id}&back=${encodeURIComponent(back)}`} className="btn-primary">Connect Amazon Ads</a>
          <p className="font-mono text-xs leading-relaxed text-ink-3">{brand.name} connects through the {APP_LABEL[app]}, {appWhat[app]}.</p>
          {clientLink}
        </div>
      ) : apiReady ? (
        <p className="text-sm leading-relaxed text-ink-2">
          {brand.name} connects through the Amazon {APP_LABEL[app]}, {appWhat[app]}. Its keys are not on this site yet. Add <span className="font-mono text-xs text-ink">{APP_KEYS[app]}</span> in Vercel, redeploy, and the Connect button shows up here. Until then links are tagged by hand in Tracking links and numbers come in through Import report.
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-ink-2">
          Sales numbers come from Amazon Attribution. The Amazon Ads API is not switched on for this site yet (it needs Amazon&apos;s approval, then the keys in the README), so for now links are tagged by hand in Tracking links and numbers come in through Import report.
        </p>
      )}

      <details>
        <summary className="cursor-pointer select-none font-mono text-xs text-ink-3 hover:text-ink">Tag template (advanced)</summary>
        <form action={setTagTemplate} className="mt-3 space-y-2">
          <input type="hidden" name="brand_id" value={brand.id} /><input type="hidden" name="back" value={back} />
          <label className="label block" htmlFor="tpl">Attribution tag template, shared by every product of {brand.name}</label>
          <textarea id="tpl" name="tag_template" rows={3} defaultValue={brand.tag_template ?? ""} className="input font-mono text-xs"
            placeholder="maas=maas_adg_api_...&ref_=aa_maas&aa_campaignid=...&aa_adgroupid=...&aa_creativeid=..." />
          <button className="btn-ghost">Save template</button>
          <p className="font-mono text-xs leading-relaxed text-ink-3">Connecting to Amazon fills this in for you. With a template saved, the tracker puts the product and the link&apos;s own ID into every new link, and Amazon reports sales per link.</p>
        </form>
      </details>
    </div>
  );
}
