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
        toggle.textContent = isDark ? "Light mode" : "Dark mode";
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

document.addEventListener("DOMContentLoaded", () => {
    const theme = getPreferredTheme();
    setTheme(theme);
    updateSessionInsights();
    setupTabs();
    setupCopyButtons();
    setupBlogCards();
    setupRevealAnimation();

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
