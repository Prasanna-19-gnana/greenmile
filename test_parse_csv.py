import csv
import json

stations_file = "data/stations.json"
csv_file = "chennai_suburban_all_routes_stations.csv"

with open(stations_file, 'r') as f:
    stations_data = json.load(f)

existing_station_names = set(st['name'].lower().replace(' station', '') for st in stations_data)

new_stations = set()
with open(csv_file, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row['station_name'].lower().replace(' station', '')
        if name not in existing_station_names:
            new_stations.add(row['station_name'])

print(f"Total existing stations: {len(existing_station_names)}")
print(f"Total new stations: {len(new_stations)}")
print("Some new stations:", list(new_stations)[:10])
