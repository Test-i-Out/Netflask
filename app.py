from flask import Flask, render_template, request, jsonify
import json
import random
from datetime import datetime, timedelta

app = Flask(__name__, static_folder="static")


# Mock data generators
def generate_mock_devices():
    devices = []
    device_types = ["Firewall", "Router", "Switch", "Load Balancer"]
    statuses = ["online", "offline", "maintenance"]
    domains = ["Production", "Staging", "Development", "DMZ", "Internal"]

    for i in range(1, 251):
        devices.append(
            {
                "id": i,
                "name": f"Device-{str(i).zfill(3)}",
                "type": random.choice(device_types),
                "status": random.choice(statuses),
                "lastSeen": (
                    datetime.now() - timedelta(days=random.randint(0, 7))
                ).isoformat(),
                "rulesCount": random.randint(10, 500),
                "domain": random.choice(domains),
            }
        )

    return devices


def generate_mock_rules(device_id, query):
    rules = []
    actions = ["ACCEPT", "DENY", "DROP"]
    sources = ["10.0.0.0/8", "192.168.1.0/24", "172.16.0.0/12", "any", "internal"]
    destinations = ["10.0.0.0/8", "192.168.1.0/24", "external", "any", "dmz"]
    services = ["HTTP", "HTTPS", "SSH", "FTP", "DNS", "any", "TCP-80", "TCP-443"]

    # Generate different rule counts based on query
    rule_count = random.randint(5, 25)
    if "unused" in query.lower() or "90 days" in query.lower():
        rule_count = random.randint(3, 15)
    elif "redundant" in query.lower() or "shadowed" in query.lower():
        rule_count = random.randint(2, 8)
    elif "any" in query.lower():
        rule_count = random.randint(10, 25)

    for i in range(1, rule_count + 1):
        last_used = None
        if random.random() > 0.3:
            last_used = (
                datetime.now() - timedelta(days=random.randint(0, 365))
            ).isoformat()

        rules.append(
            {
                "id": f"rule-{device_id}-{i}",
                "name": f"Rule_{str(i).zfill(3)}_Device_{device_id}",
                "sources": [random.choice(sources)],
                "destinations": [random.choice(destinations)],
                "services": [random.choice(services)],
                "action": random.choice(actions),
                "lastUsed": last_used,
                "enabled": random.random() > 0.2,
                "redundant": random.random() > 0.8,
                "shadowed": random.random() > 0.85,
                "severity": random.randint(1, 10) if random.random() > 0.7 else None,
                "deviceId": device_id,
            }
        )

    return rules


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/devices")
def devices():
    query = request.args.get("query", "")
    devices = generate_mock_devices()
    return render_template("devices.html", devices=devices, query=query)


@app.route("/results")
def results():
    query = request.args.get("query", "")
    device_id = int(request.args.get("deviceId", 0))
    device_name = request.args.get("deviceName", "")

    devices = generate_mock_devices()
    device = next((d for d in devices if d["id"] == device_id), None)

    if not device:
        return render_template("error.html", message="Device not found"), 404

    rules = generate_mock_rules(device_id, query)

    # Calculate statistics
    stats = {
        "total": len(rules),
        "accept": len([r for r in rules if r["action"] == "ACCEPT"]),
        "deny": len([r for r in rules if r["action"] == "DENY"]),
        "drop": len([r for r in rules if r["action"] == "DROP"]),
        "unused": len([r for r in rules if not r["lastUsed"]]),
        "redundant": len([r for r in rules if r["redundant"]]),
        "shadowed": len([r for r in rules if r["shadowed"]]),
        "highSeverity": len([r for r in rules if r["severity"] and r["severity"] >= 8]),
    }

    return render_template(
        "results.html", rules=rules, device=device, query=query, stats=stats
    )


@app.route("/api/devices")
def api_devices():
    devices = generate_mock_devices()
    return jsonify({"devices": devices, "total": len(devices)})


@app.route("/api/query", methods=["POST"])
def api_query():
    data = request.get_json()
    query = data.get("query", "")
    device_id = data.get("deviceId", 0)

    devices = generate_mock_devices()
    device = next((d for d in devices if d["id"] == device_id), None)

    if not device:
        return jsonify({"error": "Device not found"}), 404

    rules = generate_mock_rules(device_id, query)

    return jsonify(
        {
            "rules": rules,
            "total": len(rules),
            "query": query,
            "deviceId": device_id,
            "deviceName": device["name"],
        }
    )


@app.route("/export")
def export_csv():
    query = request.args.get("query", "")
    device_id = int(request.args.get("deviceId", 0))

    rules = generate_mock_rules(device_id, query)

    # Generate CSV content
    csv_content = "Rule Name,Sources,Destinations,Services,Action,Last Used,Enabled,Redundant,Shadowed,Severity\n"
    for rule in rules:
        csv_content += f"{rule['name']},{';'.join(rule['sources'])},{';'.join(rule['destinations'])},{';'.join(rule['services'])},{rule['action']},{rule['lastUsed'] or 'Never'},{rule['enabled']},{rule['redundant']},{rule['shadowed']},{rule['severity'] or 'N/A'}\n"

    response = app.make_response(csv_content)
    response.headers["Content-Type"] = "text/csv"
    response.headers["Content-Disposition"] = (
        f'attachment; filename=firemon-results-{device_id}-{datetime.now().strftime("%Y%m%d")}.csv'
    )

    return response


if __name__ == "__main__":
    app.run(debug=True)
