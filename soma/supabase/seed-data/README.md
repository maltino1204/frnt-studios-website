# Seed data

## postal_codes_de.csv

Centroids (WGS84) for 8,298 German postal codes (PLZ).

- Source: "Geokoordinaten für Postleitzahlen" by Markus Konrad, WZB Berlin
  (https://github.com/WZBSocialScienceCenter/plz_geocoord), January 2019.
- License: Apache License 2.0.
- Provenance note: the upstream coordinates were produced with a commercial
  geocoding API. Before production launch, replace this file with a dataset
  whose terms explicitly allow storage and redistribution (e.g. GeoNames postal
  codes, CC BY 4.0, or OpenPLZ, ODbL) or a licensed geocoder. The schema
  (`postal_code,lat,lng`) stays the same. See docs/STATUS.md → production blockers.
