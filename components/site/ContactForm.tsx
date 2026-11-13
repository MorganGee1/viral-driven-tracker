"use client";
import { useState } from "react";
import { SITE } from "@/lib/site";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", brand: "", marketplace: "US", creators: "", message: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Tracker enquiry: ${f.brand || f.name}`);
    const body = encodeURIComponent(
      `Name: ${f.name}\nEmail: ${f.email}\nBrand: ${f.brand}\nMarketplace: ${f.marketplace}\nCreators: ${f.creators}\n\n${f.message}`
    );
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-1.5 block">Your name</label>
          <input required className="input" value={f.name} onChange={set("name")} />
        </div>
        <div>
          <label className="label mb-1.5 block">Email</label>
          <input required type="email" className="input" value={f.email} onChange={set("email")} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="label mb-1.5 block">Brand</label>
          <input className="input" value={f.brand} onChange={set("brand")} />
        </div>
        <div>
          <label className="label mb-1.5 block">Marketplace</label>
          <select className="select" value={f.marketplace} onChange={set("marketplace")}>
            <option>US</option><option>UK</option><option>Both</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block">Creators</label>
          <input className="input" placeholder="e.g. 20" value={f.creators} onChange={set("creators")} />
        </div>
      </div>
      <div>
        <label className="label mb-1.5 block">What do you need?</label>
        <textarea rows={5} className="input" value={f.message} onChange={set("message")} />
      </div>
      <button className="btn-primary w-full py-3" type="submit">Send enquiry</button>
      <p className="font-mono text-[11px] text-ink-3">Opens in your email app, addressed to {SITE.email}.</p>
    </form>
  );
}
