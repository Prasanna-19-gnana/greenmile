import csv
import json
import time
import urllib.request
import urllib.parse
import os
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of earth in kilometers.
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def normalize_name(name):
    return name.lower().replace(' station', '').replace('railway ', '').strip()

# Load old stations
with open("data/stations.json", "r") as f:
    old_stations = json.load(f)

old_station_map = {normalize_name(st['name']): st for st in old_stations}

# Read CSV
unique_stations = {}
routes = {}

with open("chennai_suburban_all_routes_stations.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row['station_name'].strip()
        route_id = row['route_id']
        order = int(row['station_order'])
        minutes = float(row['minutes_from_previous'])
        
        if name not in unique_stations:
            unique_stations[name] = None
        
        if route_id not in routes:
            routes[route_id] = []
        routes[route_id].append({
            'name': name,
            'order': order,
            'minutes': minutes
        })

print(f"Found {len(unique_stations)} unique stations.")

final_stations = []
station_ids = {}

id_counter = 1
for name in unique_stations.keys():
    norm = normalize_name(name)
    
    matched = None
    if norm in old_station_map:
        matched = old_station_map[norm]
    else:
        for ext_name, st in old_station_map.items():
            if norm in ext_name or ext_name in norm:
                matched = st
                break
                
    if matched:
        lat, lng = matched['lat'], matched['lng']
    else:
        print(f"Geocoding {name}...")
        query = f"{name} Railway Station Tamil Nadu"
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'GreenMile-Hackathon'})
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                if len(data) > 0:
                    lat, lng = float(data[0]['lat']), float(data[0]['lon'])
                else:
                    print(f"  -> Not found! Using fallback")
                    lat, lng = 13.0827, 80.2707
        except Exception as e:
            print(f"  -> Error: {e}")
            lat, lng = 13.0827, 80.2707
        time.sleep(1) # Rate limit
        
    st_id = f"st_{id_counter}"
    station_ids[name] = st_id
    id_counter += 1
    
    final_stations.append({
        "id": st_id,
        "name": name,
        "lat": lat,
        "lng": lng,
        "type": "train"
    })

os.rename("data/stations.json", "data/stations_backup.json")
with open("data/stations.json", "w") as f:
    json.dump(final_stations, f, indent=2)

connections = []
for route_id, st_list in routes.items():
    st_list.sort(key=lambda x: x['order'])
    
    for i in range(1, len(st_list)):
        prev = st_list[i-1]
        curr = st_list[i]
        
        from_id = station_ids[prev['name']]
        to_id = station_ids[curr['name']]
        
        from_st = next(s for s in final_stations if s['id'] == from_id)
        to_st = next(s for s in final_stations if s['id'] == to_id)
        
        dist = haversine(from_st['lat'], from_st['lng'], to_st['lat'], to_st['lng'])
        if dist == 0:
            dist = 1.0
            
        duration = curr['minutes']
        if duration == 0:
            duration = 3.0
            
        connections.append({
            "from": from_id,
            "to": to_id,
            "mode": "train",
            "distance": round(dist, 2),
            "duration": duration,
            "co2": round(dist * 30 / 1000, 2),
            "cost": max(5, round(dist * 0.5))
        })

os.rename("data/connections.json", "data/connections_backup.json")
with open("data/connections.json", "w") as f:
    json.dump(connections, f, indent=2)

print("Done!")
