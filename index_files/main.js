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

function setupRevealAnimation(container = document) {
    const nodes = container.querySelectorAll(".reveal");

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
        if (card.dataset.initialized) return;
        
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
        
        card.dataset.initialized = "true";
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

function getWeatherIcon(code) {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "☁️";
    if (code <= 57) return "🌦️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌧️";
    if (code <= 86) return "❄️";
    if (code <= 99) return "⛈️";
    return "🌡️";
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

let cachedHnStories = null;

async function loadHackerNewsPanel() {
    const list = document.getElementById("hn-story-list");
    const status = document.getElementById("hn-status");
    const sortBtn = document.getElementById("hn-sort-btn");

    if (!list || !status) {
        return;
    }

    const sortMode = sortBtn ? sortBtn.dataset.sort : "points";
    
    // Helper to render the stories
    const renderStories = (stories) => {
        let rankedStories = [...stories];
        if (sortMode === "points") {
            rankedStories.sort((left, right) => (right.score || 0) - (left.score || 0));
        } else {
            rankedStories.sort((left, right) => left.originalIndex - right.originalIndex);
        }
        
        rankedStories = rankedStories.slice(0, HN_RENDER_LIMIT);
        list.innerHTML = rankedStories.map((story) => createHnStoryMarkup(story)).join("");
        status.textContent = `Live HN ${formatShortClock()}`;
    };

    // If we have cached stories, render them immediately (instant sort)
    if (cachedHnStories) {
        renderStories(cachedHnStories);
        return;
    }

    // Otherwise, fetch them
    if (sortBtn) sortBtn.style.opacity = "0.5";
    status.textContent = "Loading...";

    try {
        const ids = await fetchJson(HN_TOP_STORIES_URL);
        const storyIds = ids.slice(0, HN_STORY_SCAN_LIMIT);
        const storiesResults = await Promise.allSettled(
            storyIds.map((id) => fetchJson(`${HN_ITEM_URL}/${id}.json`))
        );

        cachedHnStories = storiesResults
            .filter((result) => result.status === "fulfilled")
            .map((result, index) => {
                const story = result.value;
                if (story) story.originalIndex = index;
                return story;
            })
            .filter((story) => story && story.type === "story" && story.title);

        if (!cachedHnStories.length) {
            throw new Error("No stories available");
        }

        renderStories(cachedHnStories);
    } catch (error) {
        status.textContent = "Live HN";
        list.innerHTML = "";
        console.error("Failed to load Hacker News panel", error);
    } finally {
        if (sortBtn) sortBtn.style.opacity = "1";
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

async function loadBlogPosts() {
    const container = document.getElementById("dynamic-blog-list");
    if (!container) return;

    try {
        const response = await fetch("./blogs/list.json");
        if (!response.ok) throw new Error("Blog list not available");
        const blogList = await response.json();

        const postsHtml = await Promise.all(blogList.map(async (meta) => {
            const res = await fetch(meta.file);
            const md = await res.text();
            
            // Basic parser for sections and frontmatter
            const sections = md.split(/\n# /).filter(Boolean);
            const contentSections = sections.slice(1).map(section => {
                const lines = section.split("\n");
                const headerLine = lines[0];
                const isWide = headerLine.includes("(wide)");
                const isHope = headerLine.includes("hope");
                const tagAndTitle = headerLine.replace(/\(.*\)/, "").trim();
                const [tag, ...titleParts] = tagAndTitle.split(" ");
                const title = titleParts.join(" ");
                
                const rest = lines.slice(1).join("\n");
                const bodyHtml = marked.parse(rest);
                const h2Match = bodyHtml.match(/<h2>(.*?)<\/h2>/);
                const actualTitle = h2Match ? h2Match[1] : title;
                const cleanBody = bodyHtml.replace(/<h2>.*?<\/h2>/, "");

                return `
                    <section class="blog-card ${isWide ? 'blog-card-wide' : ''} ${isHope ? 'blog-card-hope' : ''}">
                        <span class="section-tag">${tag}</span>
                        <h2>${actualTitle}</h2>
                        ${cleanBody}
                    </section>
                `;
            }).join("");

            return `
                <article class="post-preview" data-blog-card data-published="${meta.date}">
                    <button class="post-toggle" type="button" aria-expanded="false">
                        <span class="post-meta">${meta.date} · Personal blog</span>
                        <span class="post-title">${meta.title}</span>
                        <span class="post-summary">${meta.summary}</span>
                        <span class="post-hint">Open post</span>
                    </button>

                    <div class="post-body">
                        <div class="blog-grid post-body-grid">
                            ${contentSections}
                        </div>
                    </div>
                </article>
            `;
        }));

        container.innerHTML = postsHtml.join("");
        
        // Re-initialize blog cards and sort
        setupBlogCards();
        setupBlogSort();
        setupRevealAnimation(container);
        
    } catch (error) {
        console.error("Failed to load blogs:", error);
        container.innerHTML = `<p style="padding: 20px; color: var(--muted);">Failed to load blog posts. Please try again later.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const theme = getPreferredTheme();
    setTheme(theme);
    updateSessionInsights();
    setupTabs();
    setupCopyButtons();
    loadBlogPosts();
    setupRevealAnimation();
    setupHnSort();
    loadHackerNewsPanel();
    loadElectricityPrices();
    loadRandomQuote();
    
    // Refresh electricity prices every minute to catch interval changes
    setInterval(loadElectricityPrices, 60000);

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
    const weatherRow = document.getElementById("weather-row");
    const display = document.getElementById("current-price-display");
    const updatedAt = document.getElementById("price-updated-at");

    if (!chart || !display) return;

    try {
        console.log("Fetching electricity prices...");
        // Fetch with cache buster to ensure we get the latest data
        const response = await fetch(`./prices.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("Price data not available yet");
        
        const data = await response.json();
        if (!data || !data.prices || !data.prices.length) throw new Error("Empty price data");

        const now = new Date();
        
        // Find current price index in the list (data is sorted newest first)
        let currentIndex = data.prices.findIndex(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            return now >= start && now <= end;
        });

        // Robust fallback: If no exact match (e.g. slight data delay), find the most recent past price
        if (currentIndex === -1) {
            currentIndex = data.prices.findIndex(p => new Date(p.startDate) <= now);
        }
        
        // Final fallback to the very first item if still -1
        if (currentIndex === -1) currentIndex = 0;

        // Update the "top right" price display IMMEDIATELY before potentially slow weather fetch
        const currentP = data.prices[currentIndex];
        const startT = new Date(currentP.startDate);
        const endT = new Date(currentP.endDate);
        const timeStr = `${startT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}–${endT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        
        display.textContent = `${currentP.price.toFixed(2)} snt · ${timeStr}`;

        // Fetch weather for Oitti, Hausjärvi in parallel
        let weatherData = null;
        try {
            const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=60.785&longitude=24.832&hourly=temperature_2m,weathercode&timezone=auto&forecast_days=2");
            if (weatherRes.ok) {
                weatherData = await weatherRes.json();
            }
        } catch (we) {
            console.error("Weather fetch failed:", we);
        }

        // Determine which 48 points to show (12 hours of 15min data)
        // data.prices is newest-first (descending time).
        // Slice starting from currentIndex (current time) to currentIndex + 48 (12 hours forward/past).
        // Since data is newest-first, index 0 is the newest.
        let sliceStart = currentIndex;
        let sliceEnd = Math.min(data.prices.length, sliceStart + 48);
        
        // Remove .reverse() so the leftmost bar is the newest (current) price.
        const recentPrices = data.prices.slice(sliceStart, sliceEnd);
        const priceValues = recentPrices.map(p => p.price);
        
        const maxPrice = Math.max(...priceValues);
        const minPrice = Math.min(...priceValues);
        const range = (maxPrice - minPrice) || 1;
        
        const barsHtml = recentPrices.map(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            // Re-calculate isCurrent for each bar in the slice
            const isCurrent = (start <= now && now <= end);
            const isNegative = p.price <= 0;
            
            let colorClass = "price-green";
            if (p.price > 25) colorClass = "price-blue";
            else if (p.price > 20) colorClass = "price-purple";
            else if (p.price > 15) colorClass = "price-red";
            else if (p.price > 10) colorClass = "price-orange";
            else if (p.price > 5) colorClass = "price-yellow";
            
            const height = Math.max(12, ((p.price - minPrice) / range) * 100);
            
            return `
                <div class="price-bar ${isCurrent ? 'is-current' : ''} ${isNegative ? 'is-negative' : ''} ${colorClass}" 
                     style="height: ${height.toFixed(1)}%" 
                     title="${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${p.price.toFixed(2)} snt">
                </div>
            `;
        }).join("");

        const markersHtml = recentPrices.map((p, index) => {
            const start = new Date(p.startDate);
            // Every hour starts with :00.
            if (start.getMinutes() === 0) {
                // Calculate position: (index * (barWidth + gap)). 
                // Since bars are flex: 1, calculating exact percentage is tricky with gaps.
                // We'll use a CSS-calc based on the number of bars.
                return `
                    <div class="price-hour-marker" style="left: calc(${index} * (100% / ${recentPrices.length}))">
                        <span class="price-hour-label">${start.getHours()}</span>
                    </div>
                `;
            }
            return "";
        }).join("");

        if (weatherRow && weatherData) {
            weatherRow.innerHTML = recentPrices.map(p => {
                const start = new Date(p.startDate);
                if (start.getMinutes() === 0) {
                    const year = start.getFullYear();
                    const month = String(start.getMonth() + 1).padStart(2, '0');
                    const day = String(start.getDate()).padStart(2, '0');
                    const hour = String(start.getHours()).padStart(2, '0');
                    const localIso = `${year}-${month}-${day}T${hour}:00`;
                    
                    const wIndex = weatherData.hourly.time.indexOf(localIso);
                    
                    if (wIndex !== -1) {
                        const temp = weatherData.hourly.temperature_2m[wIndex];
                        const code = weatherData.hourly.weathercode[wIndex];
                        return `
                            <div class="weather-item">
                                <span class="weather-icon" title="Weather code: ${code}">${getWeatherIcon(code)}</span>
                                <span class="weather-temp">${Math.round(temp)}°</span>
                            </div>
                        `;
                    }
                }
                return `<div class="weather-item" style="visibility: hidden;"></div>`;
            }).join("");
        }

        chart.innerHTML = `
            ${barsHtml}
            ${markersHtml}
            <div class="price-max-line" style="bottom: 100%">
                <span>${maxPrice.toFixed(1)}</span>
            </div>
        `;

        if (updatedAt) {
            updatedAt.textContent = `Updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        }
        
    } catch (error) {
        display.textContent = "Updating Price...";
        console.error("Electricity Price Error:", error.message);
        if (chart) {
            chart.innerHTML = `<div style="color: var(--muted); font-size: 0.65rem; padding: 10px;">${error.message}</div>`;
        }
    }
}

async function loadRandomQuote() {
    const container = document.getElementById("quote-container");
    const textElem = document.getElementById("quote-text");
    const authorElem = document.getElementById("quote-author");

    if (!container || !textElem || !authorElem) return;

    try {
        const response = await fetch("./jesus_quotes.json");
        if (!response.ok) throw new Error("Quotes data not found");
        
        const quotes = await response.json();
        if (!quotes || !quotes.length) throw new Error("No quotes available");

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        textElem.textContent = randomQuote.quote;
        authorElem.textContent = randomQuote.author;
        container.style.display = "block";
    } catch (error) {
        console.error("Quote Error:", error.message);
        container.style.display = "none";
    }
}
