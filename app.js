const PLANS = [
  { id: "day", name: "Day", price: 899, tag: "Coffee runs, groceries, school pickup.", claims: 1, cap: 8000, hours: 72, illness: false, points: ["1 claim every 30 days", "Up to $80 per incident", "Spills, food, and dirt", "Paid within 3 days"] },
  { id: "night", name: "Night", price: 1499, tag: "The plan most riders actually need.", claims: 1, cap: 15000, hours: 24, illness: true, featured: true, points: ["1 claim every 30 days", "Up to $150 per incident", "Includes illness / biohazard", "Paid within 24 hours"] },
  { id: "after-hours", name: "After Hours", price: 2499, tag: "Two claims. Priority payout. Two riders.", claims: 2, cap: 15000, hours: 12, illness: true, points: ["2 claims every 30 days", "Up to $150 per incident", "12-hour priority payout", "You plus one named rider"] },
];

const INCIDENTS = [
  ["spill", "Drink spill", "Coffee, soda, wine, water — anything liquid."],
  ["food", "Food", "Takeout, crumbs, sauces, melted snacks."],
  ["dirt", "Dirt or mud", "Shoes, wet clothes, sand, pet hair, mud."],
  ["illness", "Illness", "Biohazard cleaning fees charged by the platform."],
  ["other", "Other mess", "Anything else the platform billed as a cleaning fee."],
];
const PLATFORMS = [["uber", "Uber"], ["lyft", "Lyft"], ["taxi", "Taxi / other"]];
const LABELS = { spill: "Drink spill", food: "Food", dirt: "Dirt or mud", illness: "Illness", other: "Other mess", uber: "Uber", lyft: "Lyft", taxi: "Taxi / other" };
const KEY = "rinse-html-v1";
const WINDOW = 30 * 24 * 60 * 60 * 1000;

const app = document.getElementById("app");
let toastTimer = 0;
let draft = { step: 0, incident: "", platform: "", tripDate: today(), city: "", amount: "150", notes: "" };

function today() { return new Date().toISOString().slice(0, 10); }
function usd(cents) { return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }); }
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    if (c === "&") return "\u0026amp;";
    if (c === "<") return "\u0026lt;";
    if (c === ">") return "\u0026gt;";
    if (c === '"') return "\u0026quot;";
    return "\u0026#39;";
  });
}
function planOf(id) { return PLANS.find((p) => p.id === id) || PLANS[1]; }
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { membership: null, claims: [] }; }
  catch { return { membership: null, claims: [] }; }
}
function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
function route() {
  const h = location.hash.replace(/^#/, "") || "/";
  const parts = h.split("/").filter(Boolean);
  return { path: "/" + parts.join("/"), parts };
}
function go(path) { location.hash = path; }
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2400);
}
function usedClaims(state) {
  const now = Date.now();
  return state.claims.filter((c) => c.status !== "denied" && now - new Date(c.createdAt).getTime() < WINDOW);
}
function mark(active) {
  return `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="1.25"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="currentColor" stroke-width="1.25"/><circle cx="16" cy="16" r="2.6" fill="currentColor"/></svg>`;
}
function shell(inner, member) {
  const state = load();
  const right = state.membership
    ? `<a class="btn" href="#/coverage">Coverage</a>`
    : `<a class="btn" href="#/join">Get covered</a>`;
  return `<header class="bar wrap">
      <a class="brand" href="#/">${mark()}<span class="word">Rinse</span></a>
      <nav class="nav"><a href="#/how">How it works</a><a href="#/plans">Plans</a><a href="#/policy">Policy</a></nav>
      ${right}
    </header>
    <main>${inner}</main>
    <footer class="pine foot"><div class="wrap foot-grid">
      <div><div class="brand">${mark()}<span class="word">Rinse</span></div><p class="muted">Monthly membership that reimburses rideshare cleaning fees. Not an insurance policy.</p></div>
      <div><p>Product</p><p><a href="#/plans">Plans</a><br><a href="#/join">Start coverage</a><br><a href="#/claim">File a claim</a></p></div>
      <div><p>Fine print</p><p><a href="#/policy">Coverage policy</a><br>Uber, Lyft, and taxi</p></div>
    </div><p class="wrap legal">Rinse is a membership reimbursement product, not a licensed insurance policy. This file is a demo — no real charges.</p></footer>`;
}

function plansHtml(selected) {
  return `<div class="cards three">${PLANS.map((p) => `
    <article class="card plan ${p.featured ? "featured" : ""}">
      <p class="kicker">${esc(p.name)} ${p.featured ? '<span class="chip">Most chosen</span>' : ""}</p>
      <p class="price">${usd(p.price)}<small> /mo</small></p>
      <p>${esc(p.tag)}</p>
      <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <p><a class="btn ${p.featured ? "" : "ghost"} block" href="#/join/${p.id}">${selected === p.id ? "Selected" : "Start " + esc(p.name)}</a></p>
    </article>`).join("")}</div>`;
}

function home() {
  return shell(`
    <section class="wrap hero">
      <div>
        <p class="kicker">Cleaning fee protection</p>
        <h1>The $150 cleaning fee, <em>handled.</em></h1>
        <p class="lede">A monthly membership that reimburses Uber and Lyft cleaning charges when a ride gets messy. Not insurance. Just the invoice, gone.</p>
        <div class="row">
          <a class="btn" href="#/join/night">Start Night · $14.99/mo</a>
          <a class="btn ghost" href="#/plans">See plans</a>
        </div>
        <dl class="stats"><div><dt>Typical fee</dt><dd>$150</dd></div><div><dt>Deductible</dt><dd>$0</dd></div><div><dt>Night payout</dt><dd>24h</dd></div></dl>
      </div>
      <aside class="receipt">
        <div class="kv"><span>Claim rc_8f2c</span><b class="badge ok">Paid out</b></div>
        <p class="amt">$150.00</p>
        <p class="fine">Uber cleaning fee · illness · Brooklyn</p>
        <div class="kv"><span>Billed by platform</span><b>$150.00</b></div>
        <div class="kv"><span>Rinse covered</span><b>$150.00</b></div>
        <div class="kv"><span>You paid</span><b>$0.00</b></div>
      </aside>
    </section>
    <section class="pine"><div class="wrap trio">
      <div><h3>Zero deductible</h3><p class="muted">We reimburse the fee, not a fraction of it.</p></div>
      <div><h3>Hours, not weeks</h3><p class="muted">Night members are paid within 24 hours.</p></div>
      <div><h3>Not a surprise policy</h3><p class="muted">Caps and claim limits are printed on the plan.</p></div>
    </div></section>
    <section class="wrap section" id="how">
      <p class="kicker">How it works</p>
      <h2>Three steps. No adjuster theater.</h2>
      <div class="cards three">
        <article class="card"><p class="price">01</p><h3>Pick a monthly plan</h3><p>Day, Night, or After Hours. This demo skips the usual 48-hour wait.</p></article>
        <article class="card"><p class="price">02</p><h3>Ride like you already do</h3><p>Uber, Lyft, taxi. If they bill a cleaning fee, keep the receipt.</p></article>
        <article class="card"><p class="price">03</p><h3>Send the invoice</h3><p>File a claim. Night pays within 24 hours, up to your cap.</p></article>
      </div>
    </section>
    <section class="wrap section" id="plans">
      <p class="kicker">Plans</p>
      <h2>Priced like a round of drinks.</h2>
      ${plansHtml()}
    </section>
    <section class="wrap section">
      <p class="kicker">Questions</p>
      <h2>Straight answers.</h2>
      <details><summary>Is this insurance?</summary><p>No. Rinse reimburses eligible cleaning fees. It is not a licensed insurance policy.</p></details>
      <details><summary>What fees are eligible?</summary><p>Cleaning fees billed by Uber, Lyft, or a taxi after your trip. Vehicle damage is not covered.</p></details>
      <details><summary>Is there a deductible?</summary><p>No. Amounts above your cap are paid up to the cap only.</p></details>
    </section>`);
}

function join(planId) {
  const state = load();
  const chosen = planOf(planId || state.membership?.planId || "night");
  return shell(`
    <section class="wrap section">
      <p class="kicker">Start coverage</p>
      <h1>${state.membership ? "Switch or keep your plan." : "Join Rinse in a minute."}</h1>
      <p class="lede">No card is charged. Coverage is stored in this browser so you can file a claim right away.</p>
      <div class="cards three" style="margin-top:1.5rem">${PLANS.map((p) => `
        <button class="choice ${p.id === chosen.id ? "on" : ""}" data-plan="${p.id}" type="button">
          <strong>${esc(p.name)}</strong> · ${usd(p.price)}/mo<br><span class="fine">${esc(p.tag)}</span>
        </button>`).join("")}</div>
      <form id="join" class="card form-grid two" style="margin-top:1rem">
        <div>
          <div class="field"><label for="name">Full name</label><input id="name" required value="${esc(state.membership?.name || "")}"></div>
          <div class="field"><label for="email">Email</label><input id="email" type="email" required value="${esc(state.membership?.email || "")}"></div>
          <div class="field"><label for="city">Home city</label><input id="city" required value="${esc(state.membership?.city || "")}"></div>
        </div>
        <aside class="due">
          <p>Due today</p>
          <p class="price" id="due">${usd(chosen.price)}</p>
          <p class="fine" id="due-name">${esc(chosen.name)} · cancel anytime</p>
          <button class="btn block" type="submit">${state.membership ? "Update plan" : "Start " + esc(chosen.name)}</button>
          <p class="fine">Demo only. No payment processed.</p>
        </aside>
        <input type="hidden" id="plan" value="${esc(chosen.id)}">
      </form>
    </section>`);
}

function coverage() {
  const state = load();
  if (!state.membership) return shell(`<section class="wrap section"><h1>No coverage yet</h1><p><a class="btn" href="#/join">Get covered</a></p></section>`);
  const m = state.membership;
  const plan = planOf(m.planId);
  const rawUsed = m.status === "active" ? usedClaims(state).length : 0;
  const used = m.status === "active" ? Math.min(rawUsed, plan.claims) : 0;
  const left = m.status === "active" ? Math.max(0, plan.claims - rawUsed) : 0;
  const paid = state.claims.filter((c) => c.status === "paid").reduce((n, c) => n + c.coveredCents, 0);
  const rows = state.claims.map((c) => `<a class="claim-row" href="#/claims/${esc(c.id)}"><span><b>${esc(LABELS[c.platform])} · ${esc(LABELS[c.incident])}</b><br><span class="fine">${esc(c.city)}</span></span><span>${usd(c.coveredCents || c.amountCents)}<br><span class="badge ${c.status === "denied" ? "bad" : "ok"}">${c.status === "denied" ? "Not covered" : "Paid out"}</span></span></a>`).join("");
  return shell(`
    <section class="wrap section">
      <p class="kicker">${esc(m.memberId)}</p>
      <h1>${m.status === "active" ? "You’re covered." : "Coverage ended."}</h1>
      <p class="fine">${esc(m.name)} · ${esc(plan.name)} · ${esc(m.city)}</p>
      <p>${m.status === "active" ? `<a class="btn" href="#/claim">File a claim</a>` : `<a class="btn" href="#/join">Reactivate</a>`}</p>
      <div class="stats3" style="margin-top:1.5rem">
        <article class="card"><p class="kicker">This period</p><p class="price">${left} left</p><p class="fine">${used} of ${plan.claims} used</p></article>
        <article class="card"><p class="kicker">Per-claim cap</p><p class="price">${usd(plan.cap)}</p><p class="fine">${plan.hours}h payout</p></article>
        <article class="card"><p class="kicker">Reimbursed</p><p class="price">${usd(paid)}</p><p class="fine">This browser</p></article>
      </div>
      <article class="card" style="margin-top:1rem">
        <h2>${esc(plan.name)}</h2>
        <p class="fine">${usd(plan.price)} / month · ${m.status}</p>
        <p><button class="btn ghost" id="cancel" type="button">${m.status === "active" ? "Cancel membership" : "Resume coverage"}</button></p>
      </article>
      <h2>Claims</h2>
      <div class="card" style="padding:0">${rows || `<p style="padding:1.5rem">No claims yet.</p>`}</div>
    </section>`);
}

function claim() {
  const state = load();
  if (!state.membership || state.membership.status !== "active") {
    return shell(`<section class="wrap section"><h1>Coverage is not active</h1><p><a class="btn" href="#/join">Get covered</a></p></section>`);
  }
  const plan = planOf(state.membership.planId);
  const steps = ["What happened?", "Which platform?", "Trip and fee", "Look right?"];
  const step = draft.step;
  let body = "";
  if (step === 0) {
    body = INCIDENTS.map(([id, title, detail]) => {
      const blocked = id === "illness" && !plan.illness;
      return `<button class="choice ${draft.incident === id ? "on" : ""}" data-incident="${id}" type="button"><b>${title}</b><br><span class="fine">${detail}${blocked ? " Not on the Day plan." : ""}</span></button>`;
    }).join("");
  } else if (step === 1) {
    body = PLATFORMS.map(([id, title]) => `<button class="choice ${draft.platform === id ? "on" : ""}" data-platform="${id}" type="button"><b>${title}</b></button>`).join("");
  } else if (step === 2) {
    body = `<div class="field"><label>Trip date</label><input id="tripDate" type="date" max="${today()}" value="${esc(draft.tripDate)}"></div>
      <div class="field"><label>City</label><input id="city" value="${esc(draft.city || state.membership.city)}"></div>
      <div class="field"><label>Cleaning fee charged</label><input id="amount" inputmode="decimal" value="${esc(draft.amount)}"></div>
      <div class="field"><label>Notes</label><textarea id="notes">${esc(draft.notes)}</textarea></div>`;
  } else {
    const cents = Math.round(Number(draft.amount) * 100) || 0;
    const covered = Math.min(cents, plan.cap);
    body = `<div class="card"><div class="kv"><span>Incident</span><b>${esc(LABELS[draft.incident] || "—")}</b></div>
      <div class="kv"><span>Platform</span><b>${esc(LABELS[draft.platform] || "—")}</b></div>
      <div class="kv"><span>Trip</span><b>${esc(draft.tripDate)} · ${esc(draft.city)}</b></div>
      <div class="kv"><span>Fee</span><b>${usd(cents)}</b></div>
      <div class="kv"><span>Rinse covers</span><b>${usd(covered)}</b></div></div>`;
  }
  return shell(`<section class="wrap section narrow">
    <p class="kicker">File a claim · ${step + 1} of 4</p>
    <div class="meter"><span style="width:${((step + 1) / 4) * 100}%"></span></div>
    <h1>${steps[step]}</h1>
    ${body}
    <div class="row">
      <button class="btn ghost" id="back" type="button" ${step === 0 ? "disabled" : ""}>Back</button>
      <button class="btn" id="next" type="button">${step === 3 ? "Submit claim" : "Continue"}</button>
    </div>
  </section>`);
}

function claimDetail(id) {
  const claim = load().claims.find((c) => c.id === id);
  if (!claim) return shell(`<section class="wrap section"><h1>Claim not found</h1><p><a class="btn" href="#/coverage">Back</a></p></section>`);
  return shell(`<section class="wrap section narrow">
    <p class="kicker">${esc(claim.id)}</p>
    <h1>${usd(claim.coveredCents || claim.amountCents)} <span class="badge ${claim.status === "denied" ? "bad" : "ok"}">${claim.status === "denied" ? "Not covered" : "Paid out"}</span></h1>
    <div class="card">
      <div class="kv"><span>Fee charged</span><b>${usd(claim.amountCents)}</b></div>
      <div class="kv"><span>Covered</span><b>${usd(claim.coveredCents)}</b></div>
      <div class="kv"><span>Trip</span><b>${esc(claim.tripDate)} · ${esc(claim.city)}</b></div>
      ${claim.denialReason ? `<div class="kv"><span>Why</span><b>${esc(claim.denialReason)}</b></div>` : ""}
      ${claim.notes ? `<div class="kv"><span>Notes</span><b>${esc(claim.notes)}</b></div>` : ""}
    </div>
    <p><a class="btn" href="#/coverage">Back to coverage</a></p>
  </section>`);
}

function policy() {
  const rows = PLANS.map((p) => `<tr><td>${esc(p.name)}</td><td>${usd(p.price)}</td><td>${usd(p.cap)}</td><td>${p.claims}</td></tr>`).join("");
  return shell(`<section class="wrap section narrow">
    <p class="kicker">Coverage policy</p>
    <h1>What Rinse will and will not pay.</h1>
    <p>Rinse reimburses eligible rideshare cleaning fees. It is not insurance. You pay the platform first; Rinse pays you back up to your cap.</p>
    <h2>Caps</h2>
    <div class="card" style="padding:0;overflow:auto"><table><thead><tr><th>Plan</th><th>Monthly</th><th>Cap</th><th>Claims / 30d</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="fine">Fees under $10 are not reimbursed. Illness is covered on Night and After Hours only. This demo pays claims in about a second.</p>
    <p><a class="btn" href="#/join">Start coverage</a></p>
  </section>`);
}

function render() {
  const { parts } = route();
  const [a, b] = parts;
  let html = home();
  if (a === "join") html = join(b);
  else if (a === "coverage") html = coverage();
  else if (a === "claim") html = claim();
  else if (a === "claims" && b) html = claimDetail(b);
  else if (a === "policy") html = policy();
  app.innerHTML = html;
  bind();
  if (a === "plans" || a === "how") {
    document.getElementById(a)?.scrollIntoView();
  }
}

function bind() {
  const form = document.getElementById("join");
  document.querySelectorAll("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", () => go("/join/" + btn.dataset.plan));
  });
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const city = document.getElementById("city").value.trim();
      const planId = document.getElementById("plan").value;
      if (!name || !email || !city) return toast("Name, email, and city are required.");
      const state = load();
      const seed = Math.abs(Array.from(name + Date.now()).reduce((n, ch) => (n * 33 + ch.charCodeAt(0)) | 0, 7));
      state.membership = {
        memberId: state.membership?.memberId || "RN-" + String(seed % 10000).padStart(4, "0"),
        name, email, city, planId, status: "active", startedAt: state.membership?.startedAt || new Date().toISOString(),
      };
      save(state);
      draft.city = city;
      toast(planOf(planId).name + " coverage is active.");
      go("/coverage");
    });
  }
  const cancel = document.getElementById("cancel");
  if (cancel) {
    cancel.addEventListener("click", () => {
      const state = load();
      state.membership.status = state.membership.status === "active" ? "cancelled" : "active";
      save(state);
      render();
    });
  }
  document.querySelectorAll("[data-incident]").forEach((btn) => {
    btn.addEventListener("click", () => { draft.incident = btn.dataset.incident; render(); });
  });
  document.querySelectorAll("[data-platform]").forEach((btn) => {
    btn.addEventListener("click", () => { draft.platform = btn.dataset.platform; render(); });
  });
  const back = document.getElementById("back");
  const next = document.getElementById("next");
  if (back) back.addEventListener("click", () => { draft.step = Math.max(0, draft.step - 1); render(); });
  if (next) next.addEventListener("click", () => {
    const state = load();
    const plan = planOf(state.membership.planId);
    if (draft.step === 0) {
      if (!draft.incident) return toast("Choose what happened.");
      if (draft.incident === "illness" && !plan.illness) return toast("Illness is covered on Night and After Hours.");
    }
    if (draft.step === 1 && !draft.platform) return toast("Choose the platform.");
    if (draft.step === 2) {
      draft.tripDate = document.getElementById("tripDate").value;
      draft.city = document.getElementById("city").value.trim();
      draft.amount = document.getElementById("amount").value;
      draft.notes = document.getElementById("notes").value.trim();
      if (!draft.tripDate || !draft.city) return toast("Trip date and city are required.");
      if ((Number(draft.amount) || 0) < 10) return toast("Enter a cleaning fee of at least $10.");
    }
    if (draft.step < 3) { draft.step += 1; render(); return; }
    const cents = Math.round(Number(draft.amount) * 100);
    const remaining = plan.claims - usedClaims(state).length;
    let status = "paid";
    let covered = Math.min(cents, plan.cap);
    let denial = "";
    if (remaining <= 0) { status = "denied"; covered = 0; denial = "This period’s claim limit is already used."; }
    else if (draft.incident === "illness" && !plan.illness) { status = "denied"; covered = 0; denial = "Illness is covered on Night and After Hours."; }
    else if (cents < 1000) { status = "denied"; covered = 0; denial = "Cleaning fees under $10 are not reimbursed."; }
    const id = "rc_" + Math.random().toString(36).slice(2, 10);
    state.claims.unshift({ id, createdAt: new Date().toISOString(), platform: draft.platform, tripDate: draft.tripDate, city: draft.city, incident: draft.incident, amountCents: cents, coveredCents: covered, notes: draft.notes, status, denialReason: denial });
    save(state);
    draft = { step: 0, incident: "", platform: "", tripDate: today(), city: state.membership.city, amount: "150", notes: "" };
    toast(status === "paid" ? "Paid " + usd(covered) + " to you." : denial);
    go("/claims/" + id);
  });
}

window.addEventListener("hashchange", render);
render();
