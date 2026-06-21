import json
import math

def distance(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)*math.sin(dLat/2) + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dLon/2)*math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# Coordinates for all required stations. Approximated from Google Maps.
coords = {
    "Chennai Beach": [13.0925, 80.2933],
    "Chennai Fort": [13.0820, 80.2810],
    "Chennai Park": [13.0818, 80.2736],
    "Chennai Park Town": [13.0811, 80.2747],
    "Chennai Central": [13.0827, 80.2707],
    "Chennai Egmore": [13.0785, 80.2608],
    "Chetpet": [13.0715, 80.2435],
    "Nungambakkam": [13.0594, 80.2355],
    "Kodambakkam": [13.0506, 80.2268],
    "Mambalam": [13.0390, 80.2280],
    "Saidapet": [13.0210, 80.2210],
    "Guindy": [13.0080, 80.2130],
    "St Thomas Mount": [12.9950, 80.1980],
    "Pazhavanthangal": [12.9860, 80.1870],
    "Meenambakkam": [12.9810, 80.1790],
    "Tirusulam": [12.9770, 80.1650],
    "Pallavaram": [12.9690, 80.1480],
    "Chromepet": [12.9540, 80.1380],
    "Tambaram Sanatorium": [12.9370, 80.1220],
    "Tambaram": [12.9250, 80.1110],
    "Perungalathur": [12.9050, 80.0950],
    "Vandalur": [12.8880, 80.0840],
    "Urapakkam": [12.8680, 80.0650],
    "Guduvancheri": [12.8440, 80.0550],
    "Potheri": [12.8220, 80.0380],
    "Kattangulattur": [12.8120, 80.0260],
    "Maraimalai Nagar": [12.7930, 80.0130],
    "Singaperumal Koil": [12.7600, 79.9980],
    "Paranur": [12.7210, 79.9860],
    "Chengalpattu": [12.6950, 79.9760],

    "Chintadripet": [13.0720, 80.2740],
    "Chepauk": [13.0640, 80.2810],
    "Thiruvallikeni": [13.0580, 80.2800],
    "Light House": [13.0450, 80.2790],
    "Mundakanniamman Koil": [13.0370, 80.2740],
    "Thirumayilai": [13.0330, 80.2670],
    "Mandaveli": [13.0230, 80.2600],
    "Greenways Road": [13.0180, 80.2520],
    "Kotturpuram": [13.0110, 80.2430],
    "Kasturba Nagar": [13.0010, 80.2480],
    "Indira Nagar": [12.9930, 80.2500],
    "Thiruvanmiyur": [12.9840, 80.2520],
    "Taramani": [12.9770, 80.2450],
    "Perungudi": [12.9660, 80.2440],
    "Velachery": [12.9754, 80.2206],
    "Puzhuthivakkam": [12.9810, 80.2080],
    "Adambakkam": [12.9870, 80.2030]
}

suburban = ["Chennai Beach", "Chennai Fort", "Chennai Park", "Chennai Egmore", "Chetpet", "Nungambakkam", "Kodambakkam", "Mambalam", "Saidapet", "Guindy", "St Thomas Mount", "Pazhavanthangal", "Meenambakkam", "Tirusulam", "Pallavaram", "Chromepet", "Tambaram Sanatorium", "Tambaram", "Perungalathur", "Vandalur", "Urapakkam", "Guduvancheri", "Potheri", "Kattangulattur", "Maraimalai Nagar", "Singaperumal Koil", "Paranur", "Chengalpattu"]
mrts = ["Chennai Beach", "Chennai Fort", "Chennai Park Town", "Chintadripet", "Chepauk", "Thiruvallikeni", "Light House", "Mundakanniamman Koil", "Thirumayilai", "Mandaveli", "Greenways Road", "Kotturpuram", "Kasturba Nagar", "Indira Nagar", "Thiruvanmiyur", "Taramani", "Perungudi", "Velachery", "Puzhuthivakkam", "Adambakkam", "St Thomas Mount"]

stations = []
connections = []
station_ids = {}

def add_station(name, line):
    global stations, station_ids
    if name not in station_ids:
        sid = f"st_{len(stations)+1}"
        station_ids[name] = sid
        lat, lng = coords[name]
        stations.append({
            "id": sid,
            "name": name,
            "lat": lat,
            "lng": lng,
            "type": "train",
            "lines": [line]
        })
    else:
        # Station is an interchange, add line to lines array
        st = next(s for s in stations if s["id"] == station_ids[name])
        if line not in st["lines"]:
            st["lines"].append(line)

# Build Stations
for s in suburban: add_station(s, "Suburban Train")
for m in mrts: add_station(m, "MRTS")

# Add missing nodes like Chennai Central just for completeness if needed. Let's add it.
add_station("Chennai Central", "Suburban Train")

def add_edges(seq, line, mode="train", speed=40):
    for i in range(len(seq)-1):
        s1 = seq[i]
        s2 = seq[i+1]
        id1 = station_ids[s1]
        id2 = station_ids[s2]
        dist = distance(coords[s1][0], coords[s1][1], coords[s2][0], coords[s2][1])
        dur = (dist / speed) * 60
        cost = 5 if dist < 10 else 10 # simple cost
        co2 = dist * 30 # user rule: 30g/km
        # Bi-directional
        connections.append({"from": id1, "to": id2, "mode": mode, "distance_km": dist, "duration_min": dur, "cost": cost, "frequency_min": 15, "co2_factor": 30, "line": line})
        connections.append({"from": id2, "to": id1, "mode": mode, "distance_km": dist, "duration_min": dur, "cost": cost, "frequency_min": 15, "co2_factor": 30, "line": line})

add_edges(suburban, "Suburban Train")
add_edges(mrts, "MRTS")

def add_transfer(s1, s2):
    if s1 in station_ids and s2 in station_ids:
        id1 = station_ids[s1]
        id2 = station_ids[s2]
        connections.append({"from": id1, "to": id2, "mode": "walk", "distance_km": 0.2, "duration_min": 3, "cost": 0, "frequency_min": 0, "co2_factor": 0, "line": "Transfer"})
        connections.append({"from": id2, "to": id1, "mode": "walk", "distance_km": 0.2, "duration_min": 3, "cost": 0, "frequency_min": 0, "co2_factor": 0, "line": "Transfer"})

# Explicit transfers
# Chennai Beach and St Thomas Mount are identical node IDs in our data, so no transfer edge needed!
# They share the same ID.
# Chennai Park to Chennai Park Town
add_transfer("Chennai Park", "Chennai Park Town")
# Chennai Park to Chennai Central
add_transfer("Chennai Park", "Chennai Central")

with open('data/stations.json', 'w') as f: json.dump(stations, f, indent=2)
with open('data/connections.json', 'w') as f: json.dump(connections, f, indent=2)

print("Generated strict graph.")
