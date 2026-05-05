# /// script
# dependencies = ["requests"]
# ///
import requests
import os
import sys
import json
from datetime import datetime, timezone

def get_github_pulse(username):
    url = f"https://api.github.com/users/{username}/events/public"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            events = response.json()
            # GitHub events are in UTC
            today = datetime.now(timezone.utc).date()
            commits_today = 0
            latest_repo = "N/A"
            
            for event in events:
                event_date = datetime.strptime(event["created_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).date()
                if event_date == today:
                    if event["type"] == "PushEvent":
                        commits_today += event["payload"].get("size", 0)
                        if latest_repo == "N/A":
                            latest_repo = event["repo"]["name"]
                elif event_date < today:
                    break # Events are sorted by date desc
                    
            return {
                "username": username,
                "commits_today": commits_today,
                "latest_activity_repo": latest_repo,
                "date": today.isoformat()
            }
        else:
            return {"error": f"GitHub API error: Status {response.status_code}"}
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

if __name__ == "__main__":
    # You can change the username here or pass it via env
    username = os.environ.get("GITHUB_USERNAME", "palcsta")
    data = get_github_pulse(username)
    
    context_str = f"\n[GitHub Pulse ({username})]\n"
    if "error" in data:
        context_str += data["error"]
    else:
        context_str += f"- Commits today: {data['commits_today']}\n"
        context_str += f"- Latest active repo: {data['latest_activity_repo']}\n"
            
    response = {
        "hookSpecificOutput": {
            "additionalContext": context_str
        }
    }
    print(json.dumps(response))
    sys.exit(0)
