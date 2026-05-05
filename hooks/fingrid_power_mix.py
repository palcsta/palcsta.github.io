# /// script
# dependencies = ["requests"]
# ///
import requests
import os
import sys
import json

def get_fingrid_data():
    # Attempt to find the API key in environment or common files
    api_key = os.environ.get("FINGRID_API_KEY")
    if not api_key:
        return {"error": "FINGRID_API_KEY environment variable not set. Please set it to use Fingrid Power Mix hook."}
    
    variables = {
        "Nuclear Production (MW)": 188,
        "Wind Production (MW)": 181,
        "Hydro Production (MW)": 191,
        "Solar Production (MW)": 248,
        "Total Consumption (MW)": 193,
        "Total Production (MW)": 192
    }
    
    results = {}
    headers = {"x-api-key": api_key, "Accept": "application/json"}
    
    for name, var_id in variables.items():
        try:
            url = f"https://api.fingrid.fi/v1/variable/{var_id}/events/json"
            # Get the latest event
            response = requests.get(url, headers=headers, params={"limit": 1}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data:
                    results[name] = data[0].get("value")
                else:
                    results[name] = "No data"
            else:
                results[name] = f"Error: Status {response.status_code}"
        except Exception as e:
            results[name] = f"Error: {str(e)}"
            
    return results

if __name__ == "__main__":
    data = get_fingrid_data()
    
    context_str = "\n[Fingrid Power Mix (Real-time)]\n"
    if "error" in data:
        context_str += data["error"]
    else:
        for k, v in data.items():
            context_str += f"- {k}: {v}\n"
            
    response = {
        "hookSpecificOutput": {
            "additionalContext": context_str
        }
    }
    print(json.dumps(response))
    sys.exit(0)
