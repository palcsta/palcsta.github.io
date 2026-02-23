console.log("lenght of this page:(document.body.innerHTML.length)", document.body.innerHTML.length);
console.log("some of ur information ", navigator);

function amIsleeping() {
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    const demoElement = document.getElementById("demo");
    if (!demoElement) return;

    if (today.getHours() > 7 && today.getHours() < 23) {
        demoElement.innerHTML = "It's " + today.getHours() + " and I'm not sleeping";
    } else {
        demoElement.innerHTML = "It's " + today.getHours() + " and I'm probably sleeping";
    }
}
// amIsleeping();

let first = true;

function queries() {
    const navigatorJson = JSON.stringify(navigator, null, 2);
    const beautifiedJson = navigatorJson.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const htmlFormattedJson = beautifiedJson.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
    
    const agentElement = document.querySelector('.agent-short');
    const mobileElement = document.querySelector('.mobile');
    const screenElement = document.querySelector('.screen');
    
    let mobileOrTab = false;
    let ori = window.screen.orientation ? window.screen.orientation.type : 'unknown';
    
    if (navigator.userAgent.toLowerCase().includes("android") || 
        navigator.userAgent.toLowerCase().includes("ios")) {
        mobileOrTab = true;
    }
    
    if (mobileElement) {
        mobileElement.innerHTML = mobileOrTab ? '📱 Mobile/Tablet' : '💻 Desktop';
        if (screenElement) screenElement.innerHTML = ori.replace(/-/g, ' ');
        
        if (agentElement) {
            // Extract a cleaner browser name
            const ua = navigator.userAgent;
            let browser = "Unknown";
            if (ua.includes("Chrome")) browser = "Chrome";
            else if (ua.includes("Firefox")) browser = "Firefox";
            else if (ua.includes("Safari")) browser = "Safari";
            else if (ua.includes("Edge")) browser = "Edge";
            agentElement.innerHTML = browser;
        }
    }
}

function Seconds(n) {
    if (n == 0) {
        setTimeout(function () {
            Seconds(n);
            queries();
        }, 300);
    } else if (n < 500000000000000) {
        setTimeout(function () {
            Seconds(n);
            queries();
        }, 3000);
    }
    console.log(n = n + 3, 'seconds passed');
}

Seconds(0);

// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
        const getPreferredTheme = () => {
            const storedTheme = localStorage.getItem('darkMode');
            if (storedTheme === 'dark' || storedTheme === 'light') {
                return storedTheme;
            }
            // For backward compatibility or if not set, check system preference
            if (storedTheme === 'enabled') return 'dark';
            if (storedTheme === 'disabled') return 'light';
            
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };

        const setTheme = (theme) => {
            if (theme === 'dark') {
                document.body.classList.add('dark-mode');
                darkModeToggle.innerHTML = "☀️ Light Mode";
            } else {
                document.body.classList.remove('dark-mode');
                darkModeToggle.innerHTML = "🌙 Dark Mode";
            }
        };

        darkModeToggle.addEventListener("click", function() {
            const currentTheme = getPreferredTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('darkMode', newTheme);
            setTheme(newTheme);
        });

        // Apply the initial theme
        setTheme(getPreferredTheme());
    }
});

function copyCode(button) {
    const container = button.parentElement;
    const code = container.querySelector('code').innerText;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.innerText;
        button.innerText = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}
