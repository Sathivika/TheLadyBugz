# TheLadyBugz
FloodSafe scores flood risk per road segment, shows it on an interactive map, lets users close roads, and recomputes safe routes automatically for different vehicles, including ambulances and people heading to the nearest shelter. It has three modes: PLAN , ALERT and RESPOND

## Run locally

```powershell
# backend (terminal 1)
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:CITY="kathmandu"
python -m uvicorn main:app --reload

# frontend (terminal 2)
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

- `$env:DEMO="1"` gives the offline synthetic grid.
- `$env:REFRESH="1"` re-downloads the cached road network.
- Change city with `$env:CITY="pokhara"` or `$env:CENTER="27.69,85.33"`. Add shelters by appending rows to `backend/data/shelters.csv` (name,lat,lon,type,capacity,source).

See [SHELTERS_CHANGES.md](SHELTERS_CHANGES.md) for details of the shelter database, safe-shelter routing, CSV import and offline cache.
