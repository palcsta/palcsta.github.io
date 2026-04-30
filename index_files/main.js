function detectBrowser() {
    const ua = navigator.userAgent;

    if (ua.includes("Edg")) {
        return "Edge";
    }
    if (ua.includes("Chrome")) {
        return "Chrome";
    }
    if (ua.includes("Firefox")) {
        return "Firefox";
    }
    if (ua.includes("Safari")) {
        return "Safari";
    }

    return "Unknown";
}

function detectDeviceType() {
    const mobilePattern = /Android|iPhone|iPad|iPod|Mobile/i;
    return mobilePattern.test(navigator.userAgent) ? "Mobile / Tablet" : "Desktop";
}

function detectOrientation() {
    if (window.screen.orientation && window.screen.orientation.type) {
        return window.screen.orientation.type.replace(/-/g, " ");
    }

    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

function getPreferredTheme() {
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme) {
    const toggle = document.getElementById("darkModeToggle");
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (toggle) {
        toggle.textContent = isDark ? "☀️" : "🌙";
        toggle.setAttribute("aria-pressed", String(isDark));
    }

    const themeElement = document.querySelector(".theme-status");
    if (themeElement) {
        themeElement.textContent = isDark ? "Dark" : "Light";
    }
}

function updateSessionInsights() {
    const browserElement = document.querySelector(".agent-short");
    const deviceElement = document.querySelector(".mobile");
    const orientationElement = document.querySelector(".screen");
    const themeElement = document.querySelector(".theme-status");

    if (browserElement) {
        browserElement.textContent = detectBrowser();
    }
    if (deviceElement) {
        deviceElement.textContent = detectDeviceType();
    }
    if (orientationElement) {
        orientationElement.textContent = detectOrientation();
    }
    if (themeElement) {
        themeElement.textContent = document.body.classList.contains("dark-mode") ? "Dark" : "Light";
    }
}

function setupTabs() {
    const buttons = document.querySelectorAll(".tab-button");
    const panels = document.querySelectorAll(".tab-content");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.tab;

            buttons.forEach((item) => item.classList.remove("active"));
            panels.forEach((panel) => panel.classList.remove("active"));

            button.classList.add("active");
            document.getElementById(targetId)?.classList.add("active");
        });
    });
}

function setupCopyButtons() {
    const buttons = document.querySelectorAll(".copy-button");

    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            const code = button.parentElement?.querySelector("code");
            if (!code) {
                return;
            }

            try {
                await navigator.clipboard.writeText(code.innerText);
                const originalText = button.textContent;
                button.textContent = "Copied";
                button.classList.add("copied");

                window.setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove("copied");
                }, 1400);
            } catch (error) {
                button.textContent = "Failed";
                window.setTimeout(() => {
                    button.textContent = "Copy";
                }, 1400);
                console.error("Clipboard write failed", error);
            }
        });
    });
}

function setupRevealAnimation() {
    const nodes = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        nodes.forEach((node) => node.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.14 });

    nodes.forEach((node) => observer.observe(node));
}

function setupBlogCards() {
    const cards = document.querySelectorAll("[data-blog-card]");

    cards.forEach((card) => {
        const toggle = card.querySelector(".post-toggle");
        const hint = card.querySelector(".post-hint");

        if (!toggle) {
            return;
        }

        toggle.addEventListener("click", () => {
            const isOpen = card.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));

            if (hint) {
                hint.textContent = isOpen ? "Close post" : "Open post";
            }
        });
    });
}

function setupBlogSort() {
    const sortControl = document.getElementById("blog-sort");
    const postList = document.querySelector(".post-list");

    if (!sortControl || !postList) {
        return;
    }

    const sortPosts = (direction) => {
        const cards = Array.from(postList.querySelectorAll("[data-blog-card]"));

        cards.sort((left, right) => {
            const leftDate = left.dataset.published || "";
            const rightDate = right.dataset.published || "";

            return direction === "oldest"
                ? leftDate.localeCompare(rightDate)
                : rightDate.localeCompare(leftDate);
        });

        cards.forEach((card) => postList.appendChild(card));
    };

    const applyOrder = (direction) => {
        sortControl.dataset.sortOrder = direction;
        sortControl.textContent = direction === "oldest" ? "Oldest" : "Newest";
        sortPosts(direction);
    };

    sortControl.addEventListener("click", () => {
        const nextOrder = sortControl.dataset.sortOrder === "newest" ? "oldest" : "newest";
        applyOrder(nextOrder);
    });

    applyOrder(sortControl.dataset.sortOrder || "newest");
}

const HN_TOP_STORIES_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";
const HN_STORY_SCAN_LIMIT = 60;
const HN_RENDER_LIMIT = 10;

const SOURCE_STYLE_ENTRIES = [
    ["github.com", { emoji: "🐙", tone: "cool", label: "GitHub" }],
    ["news.ycombinator.com", { emoji: "🟧", tone: "warm", label: "Hacker News" }],
    ["arstechnica.com", { emoji: "📰", tone: "warm", label: "Ars Technica" }],
    ["techcrunch.com", { emoji: "🚀", tone: "warm", label: "TechCrunch" }],
    ["theverge.com", { emoji: "🌐", tone: "cool", label: "The Verge" }],
    ["wired.com", { emoji: "🔌", tone: "cool", label: "Wired" }],
    ["bloomberg.com", { emoji: "💹", tone: "warm", label: "Bloomberg" }],
    ["reuters.com", { emoji: "📰", tone: "warm", label: "Reuters" }],
    ["nytimes.com", { emoji: "🗞️", tone: "warm", label: "NYTimes" }],
    ["wsj.com", { emoji: "💼", tone: "warm", label: "WSJ" }],
    ["ft.com", { emoji: "📈", tone: "warm", label: "FT" }],
    ["economist.com", { emoji: "📊", tone: "warm", label: "Economist" }],
    ["bbc.com", { emoji: "📻", tone: "warm", label: "BBC" }],
    ["bbc.co.uk", { emoji: "📻", tone: "warm", label: "BBC" }],
    ["theguardian.com", { emoji: "🗞️", tone: "warm", label: "Guardian" }],
    ["npr.org", { emoji: "🎙️", tone: "warm", label: "NPR" }],
    ["apnews.com", { emoji: "📰", tone: "warm", label: "AP News" }],
    ["axios.com", { emoji: "⚡", tone: "warm", label: "Axios" }],
    ["washingtonpost.com", { emoji: "🏛️", tone: "warm", label: "WaPo" }],
    ["latimes.com", { emoji: "🌴", tone: "warm", label: "LA Times" }],
    ["cnn.com", { emoji: "📺", tone: "warm", label: "CNN" }],
    ["cnbc.com", { emoji: "💰", tone: "warm", label: "CNBC" }],
    ["marketwatch.com", { emoji: "📉", tone: "warm", label: "MarketWatch" }],
    ["forbes.com", { emoji: "🏢", tone: "warm", label: "Forbes" }],
    ["fortune.com", { emoji: "🏙️", tone: "warm", label: "Fortune" }],
    ["semafor.com", { emoji: "🌍", tone: "warm", label: "Semafor" }],
    ["404media.co", { emoji: "🧪", tone: "cool", label: "404 Media" }],
    ["informationisbeautiful.net", { emoji: "🎨", tone: "cool", label: "Info Beautiful" }],
    ["theinformation.com", { emoji: "🧾", tone: "warm", label: "The Information" }],
    ["information.com", { emoji: "🧾", tone: "warm", label: "The Information" }],
    ["venturebeat.com", { emoji: "📣", tone: "warm", label: "VentureBeat" }],
    ["engadget.com", { emoji: "📱", tone: "cool", label: "Engadget" }],
    ["9to5mac.com", { emoji: "🍎", tone: "cool", label: "9to5Mac" }],
    ["macrumors.com", { emoji: "🍏", tone: "cool", label: "MacRumors" }],
    ["androidauthority.com", { emoji: "🤖", tone: "cool", label: "Android Authority" }],
    ["tomshardware.com", { emoji: "🛠️", tone: "cool", label: "Tom's Hardware" }],
    ["anandtech.com", { emoji: "🧠", tone: "cool", label: "AnandTech" }],
    ["phoronix.com", { emoji: "🐧", tone: "cool", label: "Phoronix" }],
    ["zdnet.com", { emoji: "💻", tone: "cool", label: "ZDNET" }],
    ["theregister.com", { emoji: "🖥️", tone: "cool", label: "The Register" }],
    ["slashdot.org", { emoji: "💬", tone: "cool", label: "Slashdot" }],
    ["ieee.org", { emoji: "🔬", tone: "cool", label: "IEEE" }],
    ["spectrum.ieee.org", { emoji: "📡", tone: "cool", label: "IEEE Spectrum" }],
    ["acm.org", { emoji: "🧮", tone: "cool", label: "ACM" }],
    ["nature.com", { emoji: "🧬", tone: "cool", label: "Nature" }],
    ["science.org", { emoji: "🔭", tone: "cool", label: "Science" }],
    ["sciencedirect.com", { emoji: "🧫", tone: "cool", label: "ScienceDirect" }],
    ["mit.edu", { emoji: "🏫", tone: "cool", label: "MIT" }],
    ["stanford.edu", { emoji: "🎓", tone: "cool", label: "Stanford" }],
    ["berkeley.edu", { emoji: "🐻", tone: "cool", label: "Berkeley" }],
    ["cmu.edu", { emoji: "🤝", tone: "cool", label: "CMU" }],
    ["harvard.edu", { emoji: "📚", tone: "cool", label: "Harvard" }],
    ["openai.com", { emoji: "🌀", tone: "cool", label: "OpenAI" }],
    ["anthropic.com", { emoji: "🧠", tone: "cool", label: "Anthropic" }],
    ["googleblog.com", { emoji: "🔎", tone: "cool", label: "Google Blog" }],
    ["blog.google", { emoji: "🔎", tone: "cool", label: "Google Blog" }],
    ["deepmind.google", { emoji: "🧠", tone: "cool", label: "DeepMind" }],
    ["ai.googleblog.com", { emoji: "🤖", tone: "cool", label: "Google AI" }],
    ["microsoft.com", { emoji: "🪟", tone: "cool", label: "Microsoft" }],
    ["blogs.microsoft.com", { emoji: "🪟", tone: "cool", label: "MS Blog" }],
    ["aws.amazon.com", { emoji: "☁️", tone: "cool", label: "AWS" }],
    ["amazon.science", { emoji: "📦", tone: "cool", label: "Amazon Science" }],
    ["cloudflare.com", { emoji: "☁️", tone: "cool", label: "Cloudflare" }],
    ["netflixtechblog.com", { emoji: "🎬", tone: "cool", label: "Netflix Tech" }],
    ["stripe.com", { emoji: "💳", tone: "cool", label: "Stripe" }],
    ["engineering.fb.com", { emoji: "🛠️", tone: "cool", label: "Meta Eng" }],
    ["meta.com", { emoji: "🧿", tone: "cool", label: "Meta" }],
    ["uber.com", { emoji: "🚕", tone: "cool", label: "Uber" }],
    ["engineering.atspotify.com", { emoji: "🎧", tone: "cool", label: "Spotify Eng" }],
    ["spotify.com", { emoji: "🎵", tone: "cool", label: "Spotify" }],
    ["vercel.com", { emoji: "▲", tone: "cool", label: "Vercel" }],
    ["netlify.com", { emoji: "🕸️", tone: "cool", label: "Netlify" }],
    ["render.com", { emoji: "🖼️", tone: "cool", label: "Render" }],
    ["fly.io", { emoji: "🛫", tone: "cool", label: "Fly.io" }],
    ["railway.app", { emoji: "🚉", tone: "cool", label: "Railway" }],
    ["supabase.com", { emoji: "🟩", tone: "cool", label: "Supabase" }],
    ["postgresql.org", { emoji: "🐘", tone: "cool", label: "PostgreSQL" }],
    ["mysql.com", { emoji: "🗄️", tone: "cool", label: "MySQL" }],
    ["sqlite.org", { emoji: "💾", tone: "cool", label: "SQLite" }],
    ["mongodb.com", { emoji: "🍃", tone: "cool", label: "MongoDB" }],
    ["redis.io", { emoji: "🟥", tone: "cool", label: "Redis" }],
    ["docker.com", { emoji: "🐳", tone: "cool", label: "Docker" }],
    ["kubernetes.io", { emoji: "⎈", tone: "cool", label: "Kubernetes" }],
    ["linuxfoundation.org", { emoji: "🐧", tone: "cool", label: "Linux Foundation" }],
    ["kernel.org", { emoji: "🧵", tone: "cool", label: "Kernel.org" }],
    ["gnu.org", { emoji: "🐃", tone: "cool", label: "GNU" }],
    ["mozilla.org", { emoji: "🦊", tone: "cool", label: "Mozilla" }],
    ["developer.mozilla.org", { emoji: "🦊", tone: "cool", label: "MDN" }],
    ["w3.org", { emoji: "🌍", tone: "cool", label: "W3C" }],
    ["webkit.org", { emoji: "🧭", tone: "cool", label: "WebKit" }],
    ["nodejs.org", { emoji: "🟢", tone: "cool", label: "Node.js" }],
    ["deno.com", { emoji: "🦕", tone: "cool", label: "Deno" }],
    ["bun.sh", { emoji: "🥟", tone: "cool", label: "Bun" }],
    ["python.org", { emoji: "🐍", tone: "cool", label: "Python" }],
    ["pytorch.org", { emoji: "🔥", tone: "cool", label: "PyTorch" }],
    ["tensorflow.org", { emoji: "🧡", tone: "cool", label: "TensorFlow" }],
    ["rust-lang.org", { emoji: "🦀", tone: "cool", label: "Rust" }],
    ["go.dev", { emoji: "🐹", tone: "cool", label: "Go" }],
    ["golang.org", { emoji: "🐹", tone: "cool", label: "Go" }],
    ["swift.org", { emoji: "🕊️", tone: "cool", label: "Swift" }],
    ["kotlinlang.org", { emoji: "🟠", tone: "cool", label: "Kotlin" }],
    ["oracle.com", { emoji: "☕", tone: "cool", label: "Oracle" }],
    ["java.com", { emoji: "☕", tone: "cool", label: "Java" }],
    ["llvm.org", { emoji: "⚙️", tone: "cool", label: "LLVM" }],
    ["ziglang.org", { emoji: "⚡", tone: "cool", label: "Zig" }],
    ["haskell.org", { emoji: "λ", tone: "cool", label: "Haskell" }],
    ["elixir-lang.org", { emoji: "💧", tone: "cool", label: "Elixir" }],
    ["r-project.org", { emoji: "📊", tone: "cool", label: "R Project" }],
    ["obsidian.md", { emoji: "🪨", tone: "cool", label: "Obsidian" }],
    ["notion.so", { emoji: "📝", tone: "cool", label: "Notion" }],
    ["substack.com", { emoji: "✉️", tone: "warm", label: "Substack" }],
    ["medium.com", { emoji: "✍️", tone: "warm", label: "Medium" }],
    ["dev.to", { emoji: "👩‍💻", tone: "cool", label: "DEV" }],
    ["hashnode.com", { emoji: "🧱", tone: "cool", label: "Hashnode" }],
    ["daringfireball.net", { emoji: "🔥", tone: "warm", label: "Daring Fireball" }],
    ["paulgraham.com", { emoji: "📝", tone: "warm", label: "Paul Graham" }],
    ["a16z.com", { emoji: "💼", tone: "warm", label: "a16z" }],
    ["ycombinator.com", { emoji: "🟧", tone: "warm", label: "YC" }],
    ["semianalysis.com", { emoji: "🔍", tone: "warm", label: "SemiAnalysis" }],
    ["coindesk.com", { emoji: "🪙", tone: "warm", label: "CoinDesk" }],
    ["cointelegraph.com", { emoji: "₿", tone: "warm", label: "Cointelegraph" }],
    ["protocol.com", { emoji: "📡", tone: "warm", label: "Protocol" }],
    ["propublica.org", { emoji: "🔎", tone: "warm", label: "ProPublica" }],
    ["restofworld.org", { emoji: "🌏", tone: "warm", label: "Rest of World" }],
    ["eff.org", { emoji: "🛡️", tone: "cool", label: "EFF" }],
    ["archive.org", { emoji: "🏛️", tone: "cool", label: "Internet Archive" }],
    ["wikimedia.org", { emoji: "📖", tone: "cool", label: "Wikimedia" }],
    ["wikipedia.org", { emoji: "📚", tone: "cool", label: "Wikipedia" }],
    ["youtube.com", { emoji: "▶️", tone: "warm", label: "YouTube" }],
    ["youtu.be", { emoji: "▶️", tone: "warm", label: "YouTube" }],
    ["vimeo.com", { emoji: "🎥", tone: "warm", label: "Vimeo" }],
    ["loom.com", { emoji: "📹", tone: "cool", label: "Loom" }],
    ["podcasts.apple.com", { emoji: "🎧", tone: "warm", label: "Apple Podcasts" }],
    ["reddit.com", { emoji: "👽", tone: "warm", label: "Reddit" }],
    ["lobste.rs", { emoji: "🦞", tone: "cool", label: "Lobsters" }],
    ["producthunt.com", { emoji: "😺", tone: "warm", label: "Product Hunt" }],
    ["huggingface.co", { emoji: "🤗", tone: "cool", label: "Hugging Face" }],
    ["replicate.com", { emoji: "🧬", tone: "cool", label: "Replicate" }],
    ["perplexity.ai", { emoji: "🔍", tone: "cool", label: "Perplexity" }],
    ["semver.org", { emoji: "🔢", tone: "cool", label: "SemVer" }],
    ["ietf.org", { emoji: "📜", tone: "cool", label: "IETF" }],
    ["rfc-editor.org", { emoji: "📘", tone: "cool", label: "RFC Editor" }],
    ["npmjs.com", { emoji: "📦", tone: "cool", label: "npm" }],
    ["pypi.org", { emoji: "📦", tone: "cool", label: "PyPI" }],
    ["crates.io", { emoji: "📦", tone: "cool", label: "crates.io" }],
    ["brew.sh", { emoji: "🍺", tone: "cool", label: "Homebrew" }]
];

const SOURCE_STYLES = new Map(SOURCE_STYLE_ENTRIES);

function getHostname(value) {
    if (!value) {
        return "";
    }

    try {
        return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    } catch (error) {
        return "";
    }
}

function deriveSourceStyle(hostname) {
    const segments = hostname.split(".").filter(Boolean);

    for (let index = 0; index < segments.length; index += 1) {
        const candidate = segments.slice(index).join(".");
        if (SOURCE_STYLES.has(candidate)) {
            return SOURCE_STYLES.get(candidate);
        }
    }

    if (hostname.includes("github")) {
        return { emoji: "🐙", tone: "cool", label: "GitHub" };
    }
    if (hostname.includes("news") || hostname.includes("times") || hostname.includes("journal")) {
        return { emoji: "📰", tone: "warm", label: "News" };
    }
    if (hostname.includes("blog")) {
        return { emoji: "✍️", tone: "warm", label: "Blog" };
    }
    if (hostname.includes("video") || hostname.includes("youtube")) {
        return { emoji: "▶️", tone: "warm", label: "Video" };
    }
    if (hostname.includes("ai") || hostname.includes("research") || hostname.includes("dev")) {
        return { emoji: "🧠", tone: "cool", label: "Research" };
    }
    if (hostname.includes("cloud") || hostname.includes("infra") || hostname.includes("engineer")) {
        return { emoji: "☁️", tone: "cool", label: "Infra" };
    }

    return { emoji: "🔗", tone: "cool", label: formatHostname(hostname) };
}

function formatHostname(hostname) {
    if (!hostname) {
        return "Source";
    }

    return hostname
        .replace(/^www\./, "")
        .split(".")
        .slice(0, 2)
        .join(".")
        .replace(/[-_]/g, " ");
}

function formatSourceLabel(hostname, sourceStyle) {
    if (sourceStyle?.label && sourceStyle.label !== "Source") {
        return sourceStyle.label;
    }

    return formatHostname(hostname)
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatRelativeTime(unixSeconds) {
    if (!unixSeconds) {
        return "just now";
    }

    const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);

    if (elapsedSeconds < 3600) {
        const minutes = Math.max(1, Math.floor(elapsedSeconds / 60));
        return `${minutes}m ago`;
    }
    if (elapsedSeconds < 86400) {
        const hours = Math.floor(elapsedSeconds / 3600);
        return `${hours}h ago`;
    }

    const days = Math.floor(elapsedSeconds / 86400);
    return `${days}d ago`;
}

function formatShortClock(date = new Date()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function createHnStoryMarkup(story) {
    const hostname = getHostname(story.url);
    const sourceStyle = deriveSourceStyle(hostname);
    const sourceName = formatSourceLabel(hostname, sourceStyle);
    const safeTitle = story.title || "Untitled story";
    const safeUrl = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    const comments = typeof story.descendants === "number" ? `${story.descendants} comments` : "discussion";
    const author = story.by ? `by ${story.by}` : "HN";

    return `
        <li class="hn-story-item">
            <a class="hn-story-link" href="${safeUrl}" target="_blank" rel="noreferrer">
                <div class="hn-story-title">${safeTitle}</div>
                <div class="hn-story-bottomline">
                    <span class="hn-source-pill" data-tone="${sourceStyle.tone}">
                        <span aria-hidden="true">${sourceStyle.emoji}</span>
                        <span class="hn-source-name">${sourceName}</span>
                    </span>
                    <span class="hn-story-score">${story.score || 0} pts</span>
                </div>
                <div class="hn-story-meta">${author} · ${comments} · ${formatRelativeTime(story.time)}</div>
            </a>
        </li>
    `;
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
    }

    return response.json();
}

async function loadHackerNewsPanel() {
    const list = document.getElementById("hn-story-list");
    const status = document.getElementById("hn-status");
    const sortBtn = document.getElementById("hn-sort-btn");

    if (!list || !status) {
        return;
    }

    const sortMode = sortBtn ? sortBtn.dataset.sort : "top";

    try {
        const ids = await fetchJson(HN_TOP_STORIES_URL);
        const storyIds = ids.slice(0, HN_STORY_SCAN_LIMIT);
        const stories = await Promise.allSettled(
            storyIds.map((id) => fetchJson(`${HN_ITEM_URL}/${id}.json`))
        );

        const rankedStories = stories
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value)
            .filter((story) => story && story.type === "story" && story.title)
            .sort((left, right) => {
                if (sortMode === "top") {
                    // Default HN ranking (implied by the order of IDs returned by topstories.json)
                    // But if we want to sort the scan window:
                    const scoreDelta = (right.score || 0) - (left.score || 0);
                    if (scoreDelta !== 0) {
                        return scoreDelta;
                    }
                    return (right.descendants || 0) - (left.descendants || 0);
                } else {
                    // Sort strictly by points
                    return (right.score || 0) - (left.score || 0);
                }
            })
            .slice(0, HN_RENDER_LIMIT);

        if (!rankedStories.length) {
            throw new Error("No stories available");
        }

        list.innerHTML = rankedStories.map((story) => createHnStoryMarkup(story)).join("");
        status.textContent = `Live HN ${formatShortClock()}`;
    } catch (error) {
        status.textContent = "Live HN";
        list.innerHTML = "";
        console.error("Failed to load Hacker News panel", error);
    }
}

function setupHnSort() {
    const sortBtn = document.getElementById("hn-sort-btn");
    if (!sortBtn) return;

    sortBtn.addEventListener("click", () => {
        if (sortBtn.dataset.sort === "top") {
            sortBtn.dataset.sort = "points";
            sortBtn.textContent = "Points";
        } else {
            sortBtn.dataset.sort = "top";
            sortBtn.textContent = "Top";
        }
        loadHackerNewsPanel();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const theme = getPreferredTheme();
    setTheme(theme);
    updateSessionInsights();
    setupTabs();
    setupCopyButtons();
    setupBlogCards();
    setupBlogSort();
    setupRevealAnimation();
    setupHnSort();
    loadHackerNewsPanel();
    loadElectricityPrices();

    document.getElementById("darkModeToggle")?.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
        localStorage.setItem("theme", nextTheme);
        setTheme(nextTheme);
        updateSessionInsights();
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
        if (!localStorage.getItem("theme")) {
            setTheme(event.matches ? "dark" : "light");
            updateSessionInsights();
        }
    });

    window.addEventListener("resize", updateSessionInsights);
});

async function loadElectricityPrices() {
    const chart = document.getElementById("price-chart");
    const display = document.getElementById("current-price-display");
    const updatedAt = document.getElementById("price-updated-at");

    if (!chart || !display) return;

    try {
        console.log("Loading electricity prices from local storage...");
        // Fetch the locally stored JSON file generated by GitHub Actions
        const response = await fetch("./prices.json");
        if (!response.ok) throw new Error("Price data not available yet");
        
        const data = await response.json();
        if (!data || !data.prices || !data.prices.length) throw new Error("Empty price data");

        const now = new Date();
        
        // Find current price index in the full list
        const currentIndex = data.prices.findIndex(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            return now >= start && now <= end;
        });

        // Determine which 48 points to show
        let startIndex = 0;
        if (currentIndex !== -1) {
            // Show 12 points (3h) of history and 36 points (9h) of future if possible
            startIndex = Math.max(0, currentIndex - 36);
        }
        
        const recentPrices = data.prices.slice(startIndex, startIndex + 48).reverse();
        const priceValues = recentPrices.map(p => p.price);
        
        const maxPrice = Math.max(...priceValues);
        const minPrice = Math.min(...priceValues);
        const range = (maxPrice - minPrice) || 1;
        
        let currentPrice = null;

        const barsHtml = recentPrices.map(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            const isCurrent = now >= start && now <= end;
            
            if (isCurrent) currentPrice = p.price;

            const height = Math.max(12, ((p.price - minPrice) / range) * 100);
            
            return `
                <div class="price-bar ${isCurrent ? 'is-current' : ''}" 
                     style="height: ${height.toFixed(1)}%" 
                     title="${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${p.price.toFixed(2)} snt">
                </div>
            `;
        }).join("");

        // Add a horizontal line for the max price
        chart.innerHTML = `
            ${barsHtml}
            <div class="price-max-line" style="bottom: 100%">
                <span>${maxPrice.toFixed(1)}</span>
            </div>
        `;

        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        if (currentPrice !== null) {
            display.textContent = `${currentPrice.toFixed(2)} ${timeStr}`;
        } else if (currentIndex !== -1) {
            display.textContent = `${data.prices[currentIndex].price.toFixed(2)} ${timeStr}`;
        } else {
            // Fallback to the most recent price in data (usually the latest one)
            display.textContent = `${data.prices[0].price.toFixed(2)} ${timeStr}`;
        }

        updatedAt.textContent = "";
        
    } catch (error) {
        display.textContent = "Data Updating";
        console.error("Electricity Price Error:", error.message);
        chart.innerHTML = `<div style="color: var(--muted); font-size: 0.65rem; padding: 10px;">${error.message}</div>`;
    }
}
