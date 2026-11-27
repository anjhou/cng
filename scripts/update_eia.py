from concurrent.futures import ThreadPoolExecutor, as_completed
import csv, datetime as dt, json, math, os, pathlib, time, urllib.request, urllib.parse, urllib.error, io
ROUTES = {'PET.RWTC.D': 'petroleum/pri/spt', 'PET.RBRTE.D': 'petroleum/pri/spt', 'NG.RNGWHHD.D': 'natural-gas/pri/fut', 'NG.RNGC1TX3.D': 'natural-gas/pri/fut', 'PET.EMM_EPM0_PTE_NUS_DPG.W': 'petroleum/pri/gnd', 'PET.EMD_EPD2D_PTE_NUS_DPG.W': 'petroleum/pri/gnd', 'PET.EER_EPJK_PF4_RGC_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLLPA_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLEM_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLBN_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLBI_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLNG_PF4_Y44MB_DPG.D': 'petroleum/pri/spt'}
PATH=pathlib.Path('static/data/eia-prices.csv')
FIELDS=['series_id','period','value','retrieved_at']
def retrieve(sid,key,start):
    offset=0; rows={}
    while True:
        q={'api_key':key,'frequency':'weekly' if sid.endswith('.W') else 'daily','data[0]':'value','facets[series][]':sid.split('.')[1],'start':start,'length':5000,'offset':offset,'sort[0][column]':'period','sort[0][direction]':'asc'}
        url='https://api.eia.gov/v2/'+ROUTES[sid]+'/data/?'+urllib.parse.urlencode(q)
        for attempt in range(2):
            try:
                with urllib.request.urlopen(url,timeout=15) as r: body=json.load(r)['response']
                data=body['data'];break
            except Exception as exc:
                detail = f"HTTP {exc.code}" if isinstance(exc, urllib.error.HTTPError) else type(exc).__name__
                if isinstance(exc, urllib.error.URLError): detail += ": " + type(exc.reason).__name__
                print(sid, "attempt", attempt+1, detail, flush=True)
                if attempt==1: raise RuntimeError(detail) from None
                time.sleep(2)
        stamp=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
        for r in data:
            try:
                date=dt.date.fromisoformat(r['period']); value=float(r['value'])
                if r.get('series') not in (None,sid.split('.')[1]) or not math.isfinite(value) or date>dt.date.today():continue
            except (ValueError,TypeError,KeyError):continue
            rows[(sid,date.isoformat())]={'series_id':sid,'period':date.isoformat(),'value':str(value),'retrieved_at':stamp}
        offset+=len(data)
        if offset>=int(body['total']): break
        if not data or offset>50000:raise RuntimeError('Incomplete pagination')
    if not rows:raise RuntimeError('No valid observations')
    return rows

# FRED republishes these EIA spot-price series in the same units and frequency.
FRED={'PET.RWTC.D':'DCOILWTICO','PET.RBRTE.D':'DCOILBRENTEU','NG.RNGWHHD.D':'DHHNGSP'}
def fetch_with_fallback(sid,key,start):
    print(sid,'starting native EIA request',flush=True)
    try:
        return retrieve(sid,key,start)
    except Exception:
        if sid not in FRED: raise
    code=FRED[sid]
    print(sid,'trying FRED fallback',code,flush=True)
    url='https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode({'id':code,'cosd':start})
    with urllib.request.urlopen(url,timeout=20) as response:
        data=csv.DictReader(io.StringIO(response.read().decode('utf-8-sig')))
        rows={};stamp=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
        for r in data:
            try:
                date=dt.date.fromisoformat(r.get('observation_date') or r.get('DATE') or '');value=float(r[code])
                if not math.isfinite(value) or not start<=date.isoformat()<=dt.date.today().isoformat():continue
            except (ValueError,TypeError,KeyError):continue
            rows[(sid,date.isoformat())]={'series_id':sid,'period':date.isoformat(),'value':str(value),'retrieved_at':stamp}
        if not rows:raise RuntimeError('No FRED observations')
        print(sid,'FRED fallback successful',flush=True)
        return rows

def main():
    key=os.environ.get('EIA_API_KEY');
    if not key:raise SystemExit('Missing GitHub EIA_API_KEY secret')
    existing={}
    if PATH.exists():
        with PATH.open() as f:
            for row in csv.DictReader(f):existing[(row['series_id'],row['period'])]=row
    failures=[]; success=0
    start=(dt.date.today()-dt.timedelta(days=3660)).isoformat()
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(fetch_with_fallback,sid,key,start):sid for sid in ROUTES}
        for future in as_completed(futures):
            sid=futures[future]
            try:
                rows=future.result();existing.update(rows);success+=1;print(sid,len(rows),'observations',flush=True)
            except Exception as exc:
                failures.append(sid);print(sid,'FAILED;',type(exc).__name__,'prior data retained',flush=True)
    if not success:raise SystemExit('No successful series; unchanged snapshot')
    temp=PATH.with_suffix('.tmp');PATH.parent.mkdir(parents=True,exist_ok=True)
    with temp.open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=FIELDS,lineterminator='\n');writer.writeheader();writer.writerows(existing[k] for k in sorted(existing))
    temp.replace(PATH)
    print('Unavailable series:',', '.join(failures) or 'none')
if __name__=='__main__':main()
