const output = document.getElementById("output");
const input  = document.getElementById("cmd");
const liveLine = document.getElementById("live-line");

function detectOS() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return "macos";
    if (/Windows/i.test(ua)) return "windows";
    if (/Android/i.test(ua)) return "linux";
    if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
    if (/Linux/i.test(ua)) return "linux";
    return "macos";
}

const PROMPT = detectOS() === "windows"
    ? `<span class="prompt"><span class="p-path">C:\\Users\\</span><span class="p-user">guest</span><span class="p-path">&gt;</span></span>`
    : `<span class="prompt"><span class="p-user">guest</span><span class="p-path">@</span><span class="p-host">portfolio</span><span class="p-path">:~$</span></span>`;
liveLine.insertAdjacentHTML("afterbegin", PROMPT);

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = s => esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const pad = (s, n) => { const len = [...s].length; return len >= n ? s : s + " ".repeat(n - len); };
const shorten = u => u.replace(/^https?:\/\//i, "").replace(/\/$/, "");

function fmtDate(d) {
    const days   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const p2 = n => String(n).padStart(2, "0");
    return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, " ")} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} UTC`;
}

const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
const focusInput = () => input.focus({ preventScroll: true });

function print(html, cls = "") {
    const follow = atBottom();
    const d = document.createElement("div");
    if (cls) d.className = cls;
    d.innerHTML = html;
    output.appendChild(d);
    if (follow) window.scrollTo(0, document.documentElement.scrollHeight);
}

const block = html => { print(html); print(""); };

const bye = () => `<span class="dim">Connection to portfolio closed by yourself.</span>`;

const commands = {
    help() {
        const rows = [
            ["about", "who I am and what I do"],
            ["skills", "my tech stack"],
            ["projects", "things I've built"],
            ["contact", "how to reach me"],
            ["ls", "list the files here"],
            ["neofetch", "system info, if you will"],
            ["clear", "wipe the screen"]
        ].map(([c, d]) => `  <b class="accent">${pad(c, 10)}</b>${d}`).join("\n");
        const more = COMPLETABLE.filter(c => c !== "help" && !HELP_MAIN.includes(c)).join(" · ");
        return `<span class="dim">Available commands:</span>

${rows}

<span class="dim">also try: ${more}</span>
<span class="dim">Tip: Tab completes commands · ↑ / ↓ for history · Ctrl+L to clear.</span>`;
    },

    about() {
        const bio = CONFIG.bio.map(line => {
            const m = /^   (\S.*)$/.exec(line);
            return m ? `   <b class="accent">${esc(m[1])}</b>` : esc(line);
        }).join("\n");
        return `<span class="section">## about</span>
<b>${esc(CONFIG.name)}</b><span class="dim"> · </span><span class="accent">${esc(CONFIG.title)}</span>

${bio}

<span class="cyan">${pad("location", 10)}</span>${esc(CONFIG.location)}
<span class="cyan">${pad("status", 10)}</span><span class="accent">${esc(CONFIG.status)}</span>`;
    },

    skills() {
        const rows = Object.entries(CONFIG.skills)
            .map(([k, v]) => `<span class="cyan">${esc(pad(k, 12))}</span>${v.map(esc).join(" · ")}`)
            .join("\n");
        return `<span class="section">## skills</span>\n${rows}`;
    },

    projects() {
        const items = CONFIG.projects.map(p => {
            const links = [
                p.github && `<a href="${escAttr(p.github)}" target="_blank" rel="noopener">github ↗</a>`,
                p.live   && `<a href="${escAttr(p.live)}" target="_blank" rel="noopener">live ↗</a>`
            ].filter(Boolean).join("  ");
            return `<span class="accent">▸</span> <b>${esc(p.name)}</b>\n   ${esc(p.desc)}\n   ${links}`;
        }).join("\n\n");
        return `<span class="section">## projects</span>\n${items}`;
    },

    contact() {
        const s = CONFIG.socials;
        const rows = [
            `<span class="cyan">${pad("email", 10)}</span><a href="mailto:${escAttr(CONFIG.email)}">${esc(CONFIG.email)}</a>`,
            s.github   && `<span class="cyan">${pad("github", 10)}</span><a href="${escAttr(s.github)}" target="_blank" rel="noopener">${esc(shorten(s.github))}</a>`,
            s.linkedin && `<span class="cyan">${pad("linkedin", 10)}</span><a href="${escAttr(s.linkedin)}" target="_blank" rel="noopener">${esc(shorten(s.linkedin))}</a>`,
            s.twitter  && `<span class="cyan">${pad("twitter", 10)}</span><a href="${escAttr(s.twitter)}" target="_blank" rel="noopener">${esc(shorten(s.twitter))}</a>`
        ].filter(Boolean).join("\n");
        return `<span class="section">## contact</span>\n${rows}

<span class="dim">Fastest way to reach me is email — I usually reply within a day.</span>`;
    },

    ls() {
        return `<span class="dim">total 5</span>
<b>README.md</b>   <b>about.md</b>   <b>contact.json</b>   <span class="cyan"><b>projects/</b></span>   <b>skills.txt</b>`;
    },

    cat(line) {
        const arg = line.slice(3).trim();
        if (!arg) return `<span class="red">cat:</span> missing operand <span class="dim">(try 'ls' first)</span>`;
        switch (arg) {
            case "README.md":
                return `<b># portfolio</b>

This is a portfolio wearing a terminal costume.

  - type <b>help</b> to see every command
  - try <b>neofetch</b>, or don't
  - nothing here is real, except the work`;
            case "about.md":
                return commands.about();
            case "skills.txt":
                return commands.skills();
            case "contact.json": {
                const entries = [
                    ["email", CONFIG.email],
                    ["github", CONFIG.socials.github],
                    ["linkedin", CONFIG.socials.linkedin],
                    ["twitter", CONFIG.socials.twitter]
                ];
                const rows = entries.map(([k, v]) => `    <span class="cyan">"${k}"</span>: "${esc(v)}"`).join(",\n");
                return `{\n${rows}\n}`;
            }
            case "projects":
            case "projects/":
                return `<span class="red">cat: projects/:</span> Is a directory`;
            default:
                return `<span class="red">cat: ${esc(arg)}:</span> No such file or directory`;
        }
    },

    neofetch() {
        const years = new Date().getFullYear() - CONFIG.started;
        return `<span class="accent">┌────────────────────┐
│                    │
│ guest@portfolio:~$ │
│                    │
└────────────────────┘</span>

<span class="cyan">${pad("os", 10)}</span>PortfolioOS v1.0 (stable)
<span class="cyan">${pad("shell", 10)}</span>guest-sh 5.9
<span class="cyan">${pad("uptime", 10)}</span>${years} years of shipping things
<span class="cyan">${pad("status", 10)}</span><span class="accent">${esc(CONFIG.status)}</span>`;
    },

    clear() { output.innerHTML = ""; },

    echo(line) {
        let text = line.slice(4).trim();
        if (text.length > 1 && ((text[0] === '"' && text.endsWith('"')) || (text[0] === "'" && text.endsWith("'"))))
            text = text.slice(1, -1);
        return esc(text);
    },

    date() {
        return fmtDate(new Date());
    },

    whoami: () => `guest`,
    pwd: () => `/home/guest`,

    open(line) {
        const raw = line.slice(4).trim();
        if (!raw) return `<span class="dim">usage: open &lt;github | twitter | linkedin&gt;</span>`;
        const url = CONFIG.socials[raw.toLowerCase()] || (/^https?:\/\//i.test(raw) ? raw : null);
        if (!url) return `<span class="red">open:</span> ${esc(raw)} <span class="dim">(unknown — try 'contact')</span>`;
        window.open(url, "_blank", "noopener");
        return `<span class="dim">opening ${esc(shorten(url))} ↗</span>`;
    },

    mail() {
        return `<a href="mailto:${escAttr(CONFIG.email)}">${esc(CONFIG.email)}</a> <span class="dim">— click to open your email app</span>`;
    },

    cowsay(line) {
        const lines = wrapText(line.slice(6).trim() || "moo.", 38).map(esc);
        const w = Math.max(...lines.map(l => l.length));
        let bubble;
        if (lines.length === 1) {
            bubble = ` ${"_".repeat(w + 2)}\n< ${lines[0]} >\n ${"-".repeat(w + 2)}`;
        } else {
            const mid = lines.slice(1, -1).map(l => `\\ ${l.padEnd(w)} /`).join("\n");
            bubble = [
                " " + "_".repeat(w + 2),
                `< ${lines[0].padEnd(w)} >`,
                ...(mid ? [mid] : []),
                `\\ ${lines[lines.length - 1].padEnd(w)} /`,
                " " + "-".repeat(w + 2)
            ].join("\n");
        }
        return bubble + `\n \\
  \\
         ^__^
        (oo)\\_______
       (__)\\7)---------\\/
           ||----w |
           ||     ||`;
    },

    fortune() {
        const list = CONFIG.fortunes;
        let i;
        do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === lastFortune);
        lastFortune = i;
        return `<span class="dim">${esc(list[i])}</span>`;
    },

    snake() { startSnake(); },
    fish() { runFish(); },

    sudo: () => `<span class="red">guest is not in the sudoers file. This incident will be reported.</span>`,
    rm(line) {
        if (line.includes("-rf")) return `<span class="red">Permission denied:</span> this is a portfolio, not a production server.`;
        return `<span class="red">rm:</span> missing operand <span class="dim">(nice try)</span>`;
    },
    vim: () => `<span class="amber">vim: E492: Not an editor command.</span> <span class="dim">(nice try)</span>`,
    emacs: () => `<span class="amber">emacs: E492: Not an editor command.</span> <span class="dim">(nice try)</span>`,
    exit: bye,
    quit: bye,
    logout: bye
};

const HIDDEN_FROM_TAB = new Set(["sudo", "rm", "vim", "emacs", "exit", "quit", "logout"]);
const COMPLETABLE = Object.keys(commands).filter(c => !HIDDEN_FROM_TAB.has(c)).sort();
const HELP_MAIN = ["about", "skills", "projects", "contact", "ls", "neofetch", "clear"];
let lastTabList = null;

function tabComplete() {
    const word = input.value.trim().toLowerCase();
    if (!word || /\s/.test(word)) return;
    const matches = COMPLETABLE.filter(c => c.startsWith(word));
    if (matches.length === 1) {
        input.value = matches[0];
    } else if (matches.length > 1) {
        const list = matches.join("   ");
        if (list !== lastTabList) { print(`<span class="dim">${esc(list)}</span>`); lastTabList = list; }
    }
}

const HISTORY_MAX = 100;
let history = [], histIdx = -1;

function execute(raw) {
    const cmdLine = raw.trim();
    if (!cmdLine) return;
    lastTabList = null;

    print(PROMPT + " " + `<span>${esc(cmdLine)}</span>`);
    if (history[history.length - 1] !== cmdLine) {
        history.push(cmdLine);
        if (history.length > HISTORY_MAX) history.shift();
    }
    histIdx = -1;

    const [cmd] = cmdLine.toLowerCase().split(/\s+/);
    const fn = commands[cmd];
    if (!fn) { block(`<span class="red">command not found:</span> ${esc(cmd)} <span class="dim">— try 'help'</span>`); return; }
    const html = fn(cmdLine);
    if (html) block(html);
}

input.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const sel = window.getSelection();
        if (!(sel && !sel.isCollapsed && output.contains(sel.anchorNode))) {
            e.preventDefault();
            if (input.value) print(PROMPT + " " + `<span>${esc(input.value)}</span>`);
            print("^C");
            input.value = "";
        }
        return;
    }
    if (e.key === "Enter") {
        execute(input.value);
        input.value = "";
    } else if (e.key === "Tab") {
        e.preventDefault();
        tabComplete();
    } else if (e.key === "ArrowUp" && history.length) {
        e.preventDefault();
        histIdx = histIdx === -1 ? history.length : histIdx;
        histIdx = Math.max(0, histIdx - 1);
        input.value = history[histIdx];
    } else if (e.key === "ArrowDown" && histIdx !== -1) {
        e.preventDefault();
        histIdx++;
        input.value = histIdx >= history.length ? "" : history[histIdx];
        if (!input.value) histIdx = -1;
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        output.innerHTML = "";
    }
});

input.addEventListener("input", () => { lastTabList = null; });

const unlockInput = () => input.removeAttribute("readonly");
input.addEventListener("focus", unlockInput);
input.addEventListener("click", e => { e.preventDefault(); unlockInput(); focusInput(); });
input.addEventListener("blur", () => { if (!input.value) input.setAttribute("readonly", ""); });

const cursor = liveLine.querySelector(".cursor");
const measureCtx = document.createElement("canvas").getContext("2d");
function positionCursor() {
    const cs = getComputedStyle(input);
    measureCtx.font = cs.font;
    const charW = measureCtx.measureText("0").width || 9;
    cursor.style.left = (input.offsetLeft + input.value.length * charW) + "px";
}
input.addEventListener("blur", positionCursor);
window.addEventListener("resize", positionCursor);
positionCursor();
cursor.style.visibility = "visible";

document.addEventListener("mousedown", e => {
    if (output.contains(e.target)) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && output.contains(sel.anchorNode)) sel.removeAllRanges();
});

document.addEventListener("copy", () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && output.contains(sel.anchorNode)) {
        setTimeout(() => sel.removeAllRanges(), 0);
    }
});

document.addEventListener("click", e => {
    const cmdLink = e.target.closest("[data-cmd]");
    if (cmdLink) { e.preventDefault(); execute(cmdLink.dataset.cmd); focusInput(); return; }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && output.contains(sel.anchorNode)) return;
    if (!e.target.closest("a")) focusInput();
});

function detectBrowser() {
    const ua = navigator.userAgent;
    if (/edg\//i.test(ua)) return "edge";
    if (/opera|opios/i.test(ua)) return "opera";
    if (/chrome|crios/i.test(ua)) return "chrome";
    if (/firefox|fxios/i.test(ua)) return "firefox";
    if (/safari/i.test(ua)) return "safari";
    return "unknown";
}

function wrapText(text, width) {
    const lines = [];
    let cur = "";
    for (const w of text.split(/\s+/)) {
        if (!cur) cur = w;
        else if ((cur + " " + w).length <= width) cur += " " + w;
        else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
}

function runFish() {
    const host = document.createElement("div");
    host.className = "fish";
    output.appendChild(host);
    if (atBottom()) window.scrollTo(0, document.documentElement.scrollHeight);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const pre = document.createElement("pre");
        pre.className = "anim";
        pre.textContent = "><> ><> ><>";
        host.appendChild(pre);
        setTimeout(() => host.remove(), 800);
        return;
    }
    const cols = Math.max(20, Math.floor(host.clientWidth / 10));
    const rows = 5;
    host.style.gridTemplateColumns = `repeat(${cols}, 10px)`;
    const cells = [];
    for (let i = 0; i < rows * cols; i++) {
        const c = document.createElement("span");
        host.appendChild(c);
        cells.push(c);
    }
    const setCell = (r, x, ch) => { if (x >= 0 && x < cols) cells[r * cols + x].textContent = ch; };
    const glyph = [">", "<", ">"];
    let remaining = 4 + Math.floor(Math.random() * 2);
    const lanes = [];
    while (lanes.length < remaining) {
        const r = Math.floor(Math.random() * rows);
        if (!lanes.includes(r)) lanes.push(r);
    }
    for (const row of lanes) {
        let col = -3;
        const timer = setInterval(() => {
            if (!host.isConnected) { clearInterval(timer); return; }
            setCell(row, col, " ");
            col++;
            for (let i = 0; i < glyph.length; i++) setCell(row, col + i, glyph[i]);
            if (col >= cols) {
                clearInterval(timer);
                if (--remaining === 0) host.remove();
            }
        }, Math.round(1000 / (4 + Math.random() * 4)));
    }
}

const SNAKE_W = 18, SNAKE_H = 8;
let snakeState = null;

function startSnake() {
    if (snakeState) return;
    print(`<span class="dim">arrows to move · esc to quit</span>`);
    const host = document.createElement("div");
    const board = document.createElement("div");
    board.className = "anim board";
    board.style.gridTemplateColumns = `repeat(${SNAKE_W + 2}, 10px)`;
    for (let i = 0; i < (SNAKE_W + 2) * (SNAKE_H + 2); i++) board.appendChild(document.createElement("span"));
    host.appendChild(board);

    const s = {
        body: [{ x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }],
        dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
        food: null, score: 0, host, board, cells: Array.from(board.children), timer: null, onKey: null
    };
    snakeState = s;

    const dirs = { ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1}, ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0} };
    s.onKey = e => {
        if (!snakeState) return;
        if (e.key === "Escape") {
            e.preventDefault(); e.stopPropagation();
            endSnake(true);
            return;
        }
        const d = dirs[e.key];
        if (d) {
            e.preventDefault(); e.stopPropagation();
            if (d.x !== -s.dir.x || d.y !== -s.dir.y) s.nextDir = d;
        } else {
            e.preventDefault(); e.stopPropagation();
        }
    };

    placeFood(s);
    renderSnake(s);
    const follow = atBottom();
    output.appendChild(host);
    if (follow) window.scrollTo(0, document.documentElement.scrollHeight);
    window.addEventListener("keydown", s.onKey, true);
    s.timer = setInterval(() => tickSnake(), 150);
}

function placeFood(s) {
    let p;
    do {
        p = { x: Math.floor(Math.random() * SNAKE_W), y: Math.floor(Math.random() * SNAKE_H) };
    } while (s.body.some(c => c.x === p.x && c.y === p.y));
    s.food = p;
}

function renderSnake(s) {
    const grid = Array.from({ length: SNAKE_H }, () => new Array(SNAKE_W).fill(" "));
    s.body.forEach((c, i) => { grid[c.y][c.x] = i === 0 ? "@" : "o"; });
    if (s.food) grid[s.food.y][s.food.x] = "*";
    const wall = "#".repeat(SNAKE_W + 2);
    [wall, ...grid.map(r => "#" + r.join("") + "#"), wall].forEach((row, y) => {
        for (let x = 0; x < row.length; x++) s.cells[y * (SNAKE_W + 2) + x].textContent = row[x];
    });
}

function tickSnake() {
    const s = snakeState;
    if (!s) return;
    s.dir = s.nextDir;
    const head = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
    const hitWall = head.x < 0 || head.x >= SNAKE_W || head.y < 0 || head.y >= SNAKE_H;
    const ate = !hitWall && head.x === s.food.x && head.y === s.food.y;
    if (hitWall || (!ate && s.body.some(c => c.x === head.x && c.y === head.y))) { endSnake(false); return; }
    s.body.unshift(head);
    if (ate) { s.score++; placeFood(s); } else s.body.pop();
    renderSnake(s);
}

function endSnake(quit) {
    const s = snakeState;
    if (!s) return;
    clearInterval(s.timer);
    window.removeEventListener("keydown", s.onKey, true);
    snakeState = null;
    block(`<span class="dim">${quit ? "snake ended" : "game over"} — score ${s.score}</span>`);
    focusInput();
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiIdx = 0, konamiFired = false, lastFortune = -1;

function fireKonami() {
    block(`<span class="accent">┌──────────────────────────────┐
│  KONAMI CODE ACCEPTED        │</span>
<span class="accent">└──────────────────────────────┘</span>
<span class="dim">+30 lives — spend them wisely.</span>`);
}

window.addEventListener("keydown", e => {
    if (konamiFired) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === KONAMI[konamiIdx]) {
        if (k.length === 1) e.preventDefault();
        konamiIdx++;
        if (konamiIdx === KONAMI.length) { konamiFired = true; fireKonami(); }
    } else {
        konamiIdx = 0;
    }
}, true);

(function boot() {
    [
        `<span class="dim">Last login: ${fmtDate(new Date())} on ${detectBrowser()}</span>`,
        "",
        `Welcome, <b class="accent">guest</b>. Type <a href="#" data-cmd="help">help</a> to see what's available.`
    ].forEach(l => print(l));

    setTimeout(() => {
        liveLine.hidden = false;
        input.disabled = false;
        positionCursor();
        if (matchMedia("(pointer: fine)").matches) focusInput();
    }, 500);
})();
