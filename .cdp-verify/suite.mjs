/**
 * §54 real-browser verification — self-contained.
 *
 * Drives the built site in a real Chrome over the DevTools Protocol and checks
 * the things a build cannot prove: that the app mounts, responds to a pointer,
 * survives a scroll, and stays inside the viewport. The blank-page bug this
 * suite exists to catch was invisible to `next build` and to `curl`.
 *
 * Usage:  node .cdp-verify/suite.mjs [url]
 * Requires Chrome already running with --remote-debugging-port=9222.
 */
import net from "node:net";
import crypto from "node:crypto";
import fs from "node:fs";
import { EventEmitter } from "node:events";

const TARGET = process.argv[2] || "http://localhost:3112/";
const SHOTS = ".cdp-verify/shots";
fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ client */

const MAX_FRAME = 64 * 1024 * 1024;

class MiniWS extends EventEmitter {
  constructor(url) {
    super();
    const u = new URL(url);
    this.host = u.hostname;
    this.port = Number(u.port || 80);
    this.path = u.pathname + u.search;
    this.buf = Buffer.alloc(0);
    this.connected = false;
    this.frags = [];
    this.ready = new Promise((res, rej) => {
      this._res = res;
      this._rej = rej;
    });
    this.socket = net.connect(this.port, this.host, () => this._handshake());
    this.socket.on("data", (d) => this._onData(d));
    this.socket.on("error", (e) => {
      this._rej(e);
      this.emit("error", e);
    });
    this.socket.on("close", () => this.emit("close"));
  }

  _handshake() {
    const key = crypto.randomBytes(16).toString("base64");
    this.socket.write(
      `GET ${this.path} HTTP/1.1\r\nHost: ${this.host}:${this.port}\r\n` +
        `Upgrade: websocket\r\nConnection: Upgrade\r\n` +
        `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
    );
  }

  _onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    if (!this.connected) {
      const idx = this.buf.indexOf("\r\n\r\n");
      if (idx === -1) return;
      const head = this.buf.subarray(0, idx).toString("latin1");
      if (!/^HTTP\/1\.1 101/.test(head)) {
        this._rej(new Error(`handshake failed: ${head.split("\r\n")[0]}`));
        return;
      }
      this.buf = this.buf.subarray(idx + 4);
      this.connected = true;
      this._res();
    }
    this._drain();
  }

  _drain() {
    for (;;) {
      if (this.buf.length < 2) return;
      const b0 = this.buf[0];
      const b1 = this.buf[1];
      const fin = (b0 & 0x80) !== 0;
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let off = 2;

      if (len === 126) {
        if (this.buf.length < off + 2) return;
        len = this.buf.readUInt16BE(off);
        off += 2;
      } else if (len === 127) {
        if (this.buf.length < off + 8) return;
        const big = this.buf.readBigUInt64BE(off);
        if (big > BigInt(MAX_FRAME)) {
          this.socket.destroy();
          return;
        }
        len = Number(big);
        off += 8;
      }

      let mask = null;
      if (masked) {
        if (this.buf.length < off + 4) return;
        mask = this.buf.subarray(off, off + 4);
        off += 4;
      }
      if (this.buf.length < off + len) return;

      let payload = this.buf.subarray(off, off + len);
      if (mask) {
        const p = Buffer.allocUnsafe(len);
        for (let i = 0; i < len; i++) p[i] = payload[i] ^ mask[i & 3];
        payload = p;
      }
      this.buf = this.buf.subarray(off + len);

      if (opcode === 0x9) {
        this._sendFrame(0xa, payload);
        continue;
      }
      if (opcode === 0x8) {
        this.socket.end();
        return;
      }
      if (opcode === 0xa) continue;

      if (opcode === 0x0) {
        this.frags.push(payload);
        if (fin) {
          const full = Buffer.concat(this.frags);
          this.frags = [];
          this.emit("message", full.toString("utf8"));
        }
        continue;
      }
      if (fin) this.emit("message", payload.toString("utf8"));
      else this.frags = [payload];
    }
  }

  _sendFrame(opcode, payload) {
    const len = payload.length;
    const mask = crypto.randomBytes(4);
    let header;
    if (len < 126) {
      header = Buffer.alloc(6);
      header[1] = 0x80 | len;
    } else if (len < 65536) {
      header = Buffer.alloc(8);
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(14);
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    header[0] = 0x80 | opcode;
    mask.copy(header, header.length - 4);
    const masked = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i & 3];
    this.socket.write(Buffer.concat([header, masked]));
  }

  send(str) {
    this._sendFrame(0x1, Buffer.from(str, "utf8"));
  }

  close() {
    try {
      this.socket.destroy();
    } catch {}
  }
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.id !== undefined) {
        const slot = this.pending.get(msg.id);
        if (!slot) return;
        this.pending.delete(msg.id);
        if (msg.error) slot.rej(new Error(JSON.stringify(msg.error)));
        else slot.res(msg.result);
      } else if (msg.method) {
        for (const fn of this.handlers.get(msg.method) ?? []) fn(msg.params);
      }
    });
  }
  on(m, fn) {
    if (!this.handlers.has(m)) this.handlers.set(m, []);
    this.handlers.get(m).push(fn);
  }
  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    this.ws.close();
  }
}

/* ------------------------------------------------------------- page driver */

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const target = list.find((t) => t.type === "page");
if (!target) throw new Error("no page target; start Chrome with --remote-debugging-port=9222");

const ws = new MiniWS(target.webSocketDebuggerUrl);
await ws.ready;
const cdp = new CDP(ws);

const logs = [];
const errors = [];
const badResponses = [];

cdp.on("Runtime.consoleAPICalled", (p) => {
  const text = (p.args ?? [])
    .map((a) => a.value ?? a.description ?? a.unserializableValue ?? "")
    .join(" ");
  if (["error", "warning", "assert"].includes(p.type)) logs.push({ level: p.type, text });
  if (p.type === "error") console.log(`   [console.error] ${text.slice(0, 220)}`);
});
cdp.on("Runtime.exceptionThrown", (p) => {
  const d = p.exceptionDetails ?? {};
  const text = d.exception?.description ?? d.text ?? "unknown";
  errors.push(text);
  console.log(`   [exception] ${String(text).split("\n")[0]}`);
});
cdp.on("Log.entryAdded", (p) => {
  const e = p.entry ?? {};
  if (e.level === "error") {
    logs.push({ level: "error", text: `${e.source}: ${e.text}` });
    console.log(`   [log] ${e.source}: ${e.text.slice(0, 220)}`);
  }
});
// Anything the page failed to fetch — a missing favicon or image shows up here
// and nowhere else, since a broken <img> raises no JS error.
cdp.on("Network.responseReceived", (p) => {
  const r = p.response ?? {};
  if ((r.status ?? 0) >= 400) badResponses.push(`${r.status} ${r.url}`);
});
cdp.on("Network.loadingFailed", (p) => {
  if (!p.canceled) badResponses.push(`FAILED ${p.errorText ?? ""} ${p.type ?? ""}`);
});

await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Log.enable");
await cdp.send("Network.enable");

async function evaluate(expression) {
  const r = await cdp.send("Runtime.evaluate", {
    expression: `(() => { ${expression} })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  }
  return r.result.value;
}

async function goto(url) {
  logs.length = 0;
  errors.length = 0;
  badResponses.length = 0;
  await cdp.send("Page.navigate", { url });
  // Waiting only for `complete` races the navigation: the *outgoing* document
  // is already complete, so the poll can pass before the new page commits.
  const began = Date.now();
  while (Date.now() - began < 30000) {
    const state = await evaluate(
      "return document.readyState + '|' + location.href",
    ).catch(() => "loading|");
    const [readyState, href] = String(state).split("|");
    if (readyState === "complete" && href && url.startsWith(href.split("#")[0])) break;
    await sleep(150);
  }
  // Let hydration, the first paint and the entry transitions settle.
  await sleep(1400);
}

async function waitFor(expr, timeout = 8000) {
  const began = Date.now();
  while (Date.now() - began < timeout) {
    if (await evaluate(`return !!(${expr})`).catch(() => false)) return true;
    await sleep(150);
  }
  return false;
}

async function shot(name) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(data, "base64"));
}

async function scrollTo(y) {
  await evaluate(`window.scrollTo({ top: ${y}, behavior: "instant" }); return 1;`);
  await sleep(500);
}

async function mouse(type, x, y, extra = {}) {
  const pressed = type !== "mouseMoved";
  await cdp.send("Input.dispatchMouseEvent", {
    type,
    x,
    y,
    button: pressed || extra.buttons === 1 ? "left" : "none",
    buttons: pressed ? 1 : 0,
    clickCount: type === "mousePressed" ? 1 : 0,
    ...extra,
  });
}

async function click(x, y) {
  await mouse("mouseMoved", x, y);
  await sleep(70);
  await mouse("mousePressed", x, y);
  await sleep(60);
  await mouse("mouseReleased", x, y);
  await sleep(280);
}

/** Centre point of the first element matching `expr`, after scrolling it in. */
async function centerOf(expr, { scroll = true } = {}) {
  return evaluate(`
    const el = ${expr};
    if (!el) return null;
    if (${scroll} && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  `);
}

async function clickEl(expr) {
  const box = await centerOf(expr);
  if (!box) throw new Error(`no clickable element for ${expr}`);
  await sleep(320);
  await click(box.x, box.y);
  return box;
}

/**
 * The rotation terms of an element's transform matrix.
 *
 * The profile object runs a permanent idle float (translate + scale), so
 * comparing raw `transform` strings would "pass" on that motion alone. A pure
 * translate/scale leaves m13, m23, m31 and m32 at zero; any rotateX/rotateY
 * makes them non-zero. These four numbers therefore isolate rotation, which is
 * the thing under test.
 */
const ROTATION_TERMS = `
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return [0,0,0,0];
  if (t.startsWith('matrix3d')) {
    const n = t.slice(9, -1).split(',').map(Number);
    return [n[2], n[6], n[8], n[9]];
  }
  return [0,0,0,0];
`;

async function rotationOf(selector) {
  const terms = await evaluate(`
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    ${ROTATION_TERMS}
  `);
  if (!terms) return null;
  return Math.max(...terms.map((n) => Math.abs(n)));
}

async function key(k, code, keyCode) {
  await cdp.send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: k,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: k,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await sleep(380);
}

/* ============================================================== DESKTOP === */

console.log(`\n=== DESKTOP (1440x900) — ${TARGET} ===\n`);
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await cdp.send("Emulation.setEmulatedMedia", { features: [] });
await goto(TARGET);

check("app mounts", await evaluate("return !!document.querySelector('main')"));
check("primary nav renders", await evaluate("return !!document.querySelector('nav')"));
check(
  "every section anchor exists",
  await evaluate(`
    const want = ['home','about','skills','projects','experience','education','certifications','achievements','contact'];
    return want.filter(id => !document.getElementById(id)).join(',') || '';
  `) === "",
  await evaluate(`
    const want = ['home','about','skills','projects','experience','education','certifications','achievements','contact'];
    const missing = want.filter(id => !document.getElementById(id));
    return missing.length ? 'missing: ' + missing.join(',') : 'all 9 present';
  `),
);
check("exactly one h1", (await evaluate("return document.querySelectorAll('h1').length")) === 1);
check(
  "no horizontal overflow at top",
  await evaluate("return document.documentElement.scrollWidth <= window.innerWidth + 1"),
  await evaluate(
    "return `scrollW=${document.documentElement.scrollWidth} inner=${window.innerWidth}`",
  ),
);
await shot("01-hero");

/* profile object */
const stageBox = await centerOf("document.querySelector('.profile-stage')", { scroll: false });
if (!stageBox) {
  check("profile object exists", false, "no .profile-stage");
} else {
  check("profile object exists", true, `${Math.round(stageBox.w)}x${Math.round(stageBox.h)}`);

  const rest = await rotationOf(".profile-stage");
  await mouse("mouseMoved", stageBox.x + stageBox.w * 0.28, stageBox.y + stageBox.h * 0.22);
  await sleep(700);
  const hovered = await rotationOf(".profile-stage");
  check(
    "profile object rotates toward the pointer",
    hovered > 0.02 && hovered > rest,
    `rotation |terms| ${rest} -> ${hovered}`,
  );
  await shot("02-hero-object");

  // Drag: press, travel a long way, and confirm the tilt follows the gesture.
  await mouse("mousePressed", stageBox.x, stageBox.y);
  await sleep(90);
  await mouse("mouseMoved", stageBox.x - 150, stageBox.y + 60, { buttons: 1 });
  await sleep(300);
  await mouse("mouseMoved", stageBox.x - 260, stageBox.y + 30, { buttons: 1 });
  await sleep(600);
  const dragged = await rotationOf(".profile-stage");
  await mouse("mouseReleased", stageBox.x - 260, stageBox.y + 30);
  await sleep(1400);
  const settled = await rotationOf(".profile-stage");
  check(
    "profile object follows a drag",
    dragged > hovered,
    `rotation |terms| hover ${hovered} -> drag ${dragged}`,
  );
  check(
    "profile object settles back after release",
    settled < dragged * 0.4,
    `rotation |terms| drag ${dragged} -> released ${settled}`,
  );

  check(
    "document scroll is never captured by the profile object",
    await evaluate("return window.scrollY < 4"),
    `scrollY=${await evaluate("return Math.round(window.scrollY)")}`,
  );
}

/* horizontal skills */
const skills = await evaluate(`
  const track = document.querySelector('.track-horizontal');
  if (!track) return null;
  const section = track.closest('section');
  if (!section) return null;
  const r = section.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height };
`);
if (!skills) {
  check("horizontal skills track exists", false, "no .track-horizontal");
} else {
  check("horizontal skills track exists", true, `pinned scene ${Math.round(skills.height)}px`);
  const xAt = async (f) => {
    await scrollTo(skills.top + skills.height * f);
    return evaluate(`
      const el = document.querySelector('.track-horizontal');
      return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    `);
  };
  const x0 = await xAt(0.02);
  const x1 = await xAt(0.5);
  const x2 = await xAt(0.97);
  check(
    "skills track travels horizontally as the page scrolls",
    x0 > x1 && x1 > x2,
    `track translateX: ${Math.round(x0)} -> ${Math.round(x1)} -> ${Math.round(x2)}`,
  );
  const active = await evaluate(
    "return document.querySelectorAll('.slide-3d[data-active=\"true\"]').length",
  );
  check("exactly one skill slide is active", active === 1, `active=${active}`);
  check(
    "no horizontal overflow in the pinned skills scene",
    await evaluate("return document.documentElement.scrollWidth <= window.innerWidth + 1"),
    await evaluate(
      "return `scrollW=${document.documentElement.scrollWidth} inner=${window.innerWidth}`",
    ),
  );
  await shot("03-skills");
}

/* project sequence */
const seq = await evaluate(`
  const panel = document.querySelector('.project-panel');
  if (!panel) return null;
  const holder = panel.closest('div[style*="vh"]');
  if (!holder) return null;
  const r = holder.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height,
           panels: document.querySelectorAll('.project-panel').length };
`);
if (!seq) {
  check("project sequence exists", false, "no .project-panel");
} else {
  check("project sequence exists", true, `${seq.panels} panels, ${Math.round(seq.height)}px of scroll`);
  const rows = [];
  for (const f of [0.04, 0.24, 0.44, 0.64, 0.84]) {
    await scrollTo(seq.top + seq.height * f);
    rows.push(
      await evaluate(`
        return [...document.querySelectorAll('.project-panel')]
          .map(el => Math.round(parseFloat(getComputedStyle(el).opacity) * 100) / 100);
      `),
    );
  }
  check(
    "a project panel reaches full opacity during the sequence",
    rows.some((r) => r.some((o) => o > 0.9)),
    rows.map((r) => `[${r.join(",")}]`).join(" "),
  );
  check(
    "the sequence never renders an empty viewport",
    rows.every((r) => r.some((o) => o > 0.1)),
    rows.map((r) => `[${r.join(",")}]`).join(" "),
  );
  await scrollTo(seq.top + seq.height * 0.3);
  await shot("04-projects");
}

/* all-projects overlay */
const ALL_PROJECTS = `[...document.querySelectorAll('button')].find(x => /all \\d+ projects/i.test(x.textContent))`;
if (!(await evaluate(`return !!(${ALL_PROJECTS})`))) {
  check("all-projects trigger exists", false);
} else {
  check("all-projects trigger exists", true);
  await clickEl(ALL_PROJECTS);
  const opened = await waitFor("document.querySelector('[role=\"dialog\"]')", 5000);
  check("all-projects overlay opens", opened);
  if (opened) {
    await shot("05-all-projects");
    await key("Escape", "Escape", 27);
    check(
      "Escape closes the overlay",
      await waitFor("!document.querySelector('[role=\"dialog\"]')", 5000),
    );
    await sleep(400);
    check(
      "page scroll is unlocked after closing",
      await evaluate("return document.body.style.overflow !== 'hidden'"),
    );
  }
}

/* contact form — client validation, then a real submit */
const SUBMIT = "document.querySelector('#contact button[type=\"submit\"]')";
if (!(await evaluate(`return !!(${SUBMIT})`))) {
  check("contact submit button exists", false);
} else {
  await clickEl(SUBMIT);
  await sleep(900);
  const errCount = await evaluate(
    "return document.querySelectorAll('#contact .field-error').length",
  );
  check("empty submit is blocked and flags every field", errCount >= 4, `${errCount} field errors`);
  const toast = await evaluate(
    "return (document.querySelector('[role=\"status\"]') || {}).textContent || ''",
  );
  check(
    "validation toast appears",
    /correct the highlighted fields/i.test(toast),
    toast.replace(/\s+/g, " ").trim(),
  );

  await evaluate(`
    const set = (id, v) => {
      const el = document.getElementById(id);
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
      Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('name', 'Verification Bot');
    set('email', 'verify@example.com');
    set('subject', 'Automated layout verification');
    set('message', 'Submitted by the automated §54 layout check. No action needed.');
    return 1;
  `);
  await sleep(300);
  await clickEl(SUBMIT);
  await sleep(3500);
  const toast2 = await evaluate(
    "return (document.querySelector('[role=\"status\"]') || {}).textContent || ''",
  );
  const claimsSent = /message sent/i.test(toast2);
  check(
    "a filled submit reports an outcome",
    toast2.trim().length > 0,
    toast2.replace(/\s+/g, " ").trim().slice(0, 220) || "no toast text",
  );
  // With no EmailJS credentials configured the form must say so rather than
  // claim a send.
  check(
    "submit never claims a delivery that was not made",
    !claimsSent,
    claimsSent
      ? "TOAST CLAIMED SUCCESS — confirm NEXT_PUBLIC_EMAILJS_* values; if set, this really did send"
      : "reported a failure, as expected with no EmailJS credentials configured",
  );
  await shot("06-contact");
}

/* guidebot */
const CAPSULE = `[...document.querySelectorAll('button')].find(x => /^(guide|hide guide)$/i.test(x.textContent.trim()))`;
if (!(await evaluate(`return !!(${CAPSULE})`))) {
  check("guidebot capsule exists", false);
} else {
  check("guidebot capsule exists", true);
  await clickEl(CAPSULE);
  const opened = await waitFor("document.querySelector('#guidebot-panel')", 5000);
  check("guidebot panel opens", opened);
  if (opened) {
    const before = await evaluate(
      "return document.querySelector('#guidebot-panel').textContent.length",
    );
    await clickEl("document.getElementById('guidebot-input')");
    await cdp.send("Input.insertText", { text: "what technologies does he know?" });
    await sleep(300);
    await key("Enter", "Enter", 13);
    const replied = await waitFor(
      `document.querySelector('#guidebot-panel').textContent.length > ${before + 40}`,
      15000,
    );
    check("guidebot replies", replied, replied ? "" : "no growth in the transcript");
    const text = await evaluate("return document.querySelector('#guidebot-panel').textContent");
    check(
      "guidebot answer is grounded in portfolio data",
      /areas:|projects|skills|experience/i.test(text),
      text.replace(/\s+/g, " ").slice(-220),
    );
    check(
      "guidebot does not break character or invent a policy",
      !/as an ai|language model|i cannot|salary|i'm sorry/i.test(text),
    );
    await shot("07-guidebot");
    await key("Escape", "Escape", 27);
    check(
      "Escape closes the guidebot",
      await waitFor("!document.querySelector('#guidebot-panel')", 4000),
    );
  }
}

/* shared desktop assertions */
const desktopErrors = logs.filter((c) => c.level === "error");
check(
  "no console errors on desktop",
  desktopErrors.length === 0,
  desktopErrors
    .map((c) => c.text.slice(0, 160))
    .join(" | "),
);
check("no uncaught exceptions on desktop", errors.length === 0, errors[0]?.split("\n")[0] ?? "");
const hydration = logs.filter((c) => /hydrat|did not match|server-rendered/i.test(c.text));
check(
  "no hydration warnings",
  hydration.length === 0,
  hydration.map((h) => h.text.slice(0, 160)).join(" | "),
);
check(
  "no failed network requests (incl. favicon and images)",
  badResponses.length === 0,
  badResponses.join(" | "),
);
check(
  "every rendered image loaded",
  await evaluate(`
    return [...document.images]
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.currentSrc || img.src)
      .join(', ');
  `) === "",
  await evaluate(`
    const broken = [...document.images].filter(img => !img.complete || img.naturalWidth === 0);
    return broken.length ? broken.map(i => i.currentSrc || i.src).join(', ') : document.images.length + ' images all loaded';
  `),
);

/*
 * Assets the site links to but never fetches on load.
 *
 * A dead download link renders identically to a live one, so the only way to
 * know is to ask the server for it. Both the resume and the portrait shipped
 * with the site, so both are checked here.
 */
const resumeStatus = await evaluate(
  "return fetch('/resume.pdf', { method: 'HEAD' }).then(r => r.status).catch(() => 0)",
);
check(
  "the linked resume file is actually served",
  resumeStatus === 200,
  `HEAD /resume.pdf -> ${resumeStatus}`,
);
const resumeLinks = await evaluate(
  "return [...document.querySelectorAll('a[href$=\"/resume.pdf\"]')].length",
);
check(
  "resume download actions are rendered",
  resumeLinks >= 2,
  `${resumeLinks} links to /resume.pdf`,
);
/*
 * `download` with no value saves the file under the URL's basename. The served
 * path is a tidy `/resume.pdf`, but a recruiter's downloads folder should get
 * the candidate's own filename — so every action must name it explicitly.
 */
check(
  "every resume action names the saved file after the candidate",
  await evaluate(`
    const links = [...document.querySelectorAll('a[href$="/resume.pdf"]')];
    if (!links.length) return 'no resume links';
    const wrong = links
      .filter(a => a.getAttribute('download') !== 'ChVMKiran_SDE_Resume.pdf')
      .map(a => a.getAttribute('download') || '(unnamed)');
    return wrong.length ? wrong.join(', ') : '';
  `) === "",
  await evaluate(`
    return [...document.querySelectorAll('a[href$="/resume.pdf"]')]
      .map(a => a.getAttribute('download') || '(unnamed)').join(', ');
  `),
);
check(
  "the portrait is rendered as an optimised image, not a raw file",
  await evaluate(`
    const img = document.querySelector('.profile-image-plane img');
    if (!img) return 'no image element';
    if (!img.src.includes('/_next/image')) return 'not optimised: ' + img.src;
    return img.naturalWidth > 0 ? '' : 'zero natural width';
  `) === "",
  await evaluate(`
    const img = document.querySelector('.profile-image-plane img');
    return img ? img.currentSrc.replace(location.origin, '') + ' (' + img.naturalWidth + 'x' + img.naturalHeight + ')' : 'no image element';
  `),
);

/*
 * Scroll-reveal sweep.
 *
 * Every lower section fades its content in from `opacity: 0` when an
 * IntersectionObserver reports it in view. If one of those never fires, the
 * content stays invisible forever — a real user sees a blank section, and
 * neither the build nor `curl` can see it. So: step down the page a viewport at
 * a time (a single jump to the bottom would never put the middle sections in
 * front of the observer), then assert nothing substantial is still transparent.
 */
{
  const pageHeight = await evaluate(
    "return document.documentElement.scrollHeight - window.innerHeight",
  );
  for (let y = 0; y <= pageHeight; y += 700) await scrollTo(y);
  await scrollTo(pageHeight);
  await sleep(1400);

  const invisible = await evaluate(`
    const out = [];
    for (const el of document.querySelectorAll('section[id] *')) {
      if (parseFloat(getComputedStyle(el).opacity) > 0.02) continue;
      if (el.textContent.replace(/\\s+/g, ' ').trim().length < 80) continue;
      const owner = el.closest('section[id]');
      out.push((owner ? owner.id : '?') + ' > ' + el.tagName.toLowerCase());
    }
    return [...new Set(out)].join(', ');
  `);
  check(
    "every section revealed its content during the scroll sweep",
    invisible === "",
    invisible || "nothing substantial left transparent",
  );
}

/* =============================================================== MOBILE === */

console.log("\n=== MOBILE (390x844) ===\n");
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  mobile: true,
});
await goto(TARGET);

const overflow = [];
for (const f of [0, 0.15, 0.35, 0.6, 0.85, 1]) {
  await evaluate(
    `window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * ${f}, behavior: "instant" }); return 1;`,
  );
  await sleep(520);
  overflow.push(
    await evaluate("return document.documentElement.scrollWidth - window.innerWidth"),
  );
}
check(
  "no horizontal overflow on mobile (390px)",
  overflow.every((d) => d <= 1),
  `extra px at each stop: ${overflow.join(", ")}`,
);

const TOGGLE = `[...document.querySelectorAll('button')].find(x => /navigation/i.test(x.getAttribute('aria-label') || ''))`;
const toggle = await evaluate(`return !!(${TOGGLE})`);
check("mobile nav toggle is present", toggle);
if (toggle) {
  await evaluate("window.scrollTo({top:0,behavior:'instant'}); return 1;");
  await sleep(400);
  await clickEl(TOGGLE);
  await sleep(500);
  check(
    "mobile menu opens",
    await evaluate("return !document.getElementById('mobile-nav').hidden"),
  );
  await shot("08-mobile-menu");
  await key("Escape", "Escape", 27);
  await sleep(400);
  check(
    "mobile menu closes on Escape",
    await evaluate("return document.getElementById('mobile-nav').hidden"),
  );
  check(
    "page scroll is unlocked after closing the mobile menu",
    await evaluate("return document.body.style.overflow !== 'hidden'"),
  );
}

await evaluate("window.scrollTo({top:0,behavior:'instant'}); return 1;");
await sleep(600);
await shot("09-mobile-hero");

const mobileErrors = logs.filter((c) => c.level === "error");
check(
  "no console errors on mobile",
  mobileErrors.length === 0,
  mobileErrors.map((c) => c.text.slice(0, 160)).join(" | "),
);
check(
  "no horizontal overflow after the mobile menu cycle",
  await evaluate("return document.documentElement.scrollWidth <= window.innerWidth + 1"),
);

/* ======================================================= REDUCED MOTION === */

console.log("\n=== REDUCED MOTION (1440x900) ===\n");
await cdp.send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await goto(TARGET);

const rm = await evaluate(`
  const slides = [...document.querySelectorAll('.slide-3d')];
  const panels = [...document.querySelectorAll('.project-panel')];
  return {
    h1: document.querySelectorAll('h1').length,
    ids: document.querySelectorAll('section[id], div[id]').length,
    slides: slides.length,
    slideOpacity: slides.map(s => parseFloat(getComputedStyle(s).opacity)),
    slideFilter: slides.map(s => getComputedStyle(s).filter),
    panels: panels.length,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  };
`);
check(
  "reduced motion: the page still renders",
  rm.h1 === 1 && rm.ids >= 9,
  `h1=${rm.h1} id'd elements=${rm.ids}`,
);
check(
  "reduced motion: the pinned skills scene is replaced by a vertical layout",
  rm.slides === 0,
  rm.slides === 0
    ? "no .slide-3d rendered"
    : `${rm.slides} slides, opacity ${rm.slideOpacity.join(",")} filter ${rm.slideFilter.join(",")}`,
);
check(
  "reduced motion: the cinematic project sequence is replaced by a static list",
  rm.panels === 0,
  rm.panels === 0 ? "no .project-panel rendered" : `${rm.panels} pinned panels remain`,
);
check(
  "reduced motion: no horizontal overflow",
  rm.overflow <= 1,
  `${rm.overflow}px`,
);
check(
  "reduced motion: the skills content is still in the document",
  await evaluate(`
    const el = document.getElementById('skills');
    return !!el && el.textContent.replace(/\\s+/g,' ').trim().length > 200;
  `),
  await evaluate(`
    const el = document.getElementById('skills');
    return el ? el.textContent.replace(/\\s+/g,' ').trim().length + ' chars of skills text' : 'no #skills';
  `),
);
await shot("10-reduced-motion");

const rmErrors = logs.filter((c) => c.level === "error");
check(
  "no console errors under reduced motion",
  rmErrors.length === 0,
  rmErrors.map((c) => c.text.slice(0, 160)).join(" | "),
);
check(
  "no uncaught exceptions under reduced motion",
  errors.length === 0,
  errors[0]?.split("\n")[0] ?? "",
);

/* ============================================================== SUMMARY === */

const failed = results.filter((r) => !r.ok);
console.log("\n================ SUMMARY ================");
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("\nFAILED:");
  for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` :: ${f.detail}` : ""}`);
}
console.log(`\nscreenshots: ${SHOTS}`);
cdp.close();
process.exit(failed.length ? 1 : 0);
