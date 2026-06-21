import csv
import json

with open("data/stations.json", 'r') as f:
    stations_data = json.load(f)

existing_names = {st['name'].lower().replace(' station', '').replace('railway ', ''): st for st in stations_data}

new_stations = set()
with open("chennai_suburban_all_routes_stations.csv", 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row['station_name'].lower().replace(' station', '').replace('railway ', '')
        matched = False
        for ext_name in existing_names.keys():
            if name in ext_name or ext_name in name:
                matched = True
                break
        if not matched:
            new_stations.add(row['station_name'])

print(f"Total definitely new stations: {len(new_stations)}")
print("Some definitely new stations:", list(new_stations)[:20])
