import csv, datetime as dt, json, math, os, pathlib, time, urllib.request, urllib.parse
ROUTES = {'PET.RWTC.D': 'petroleum/pri/spt', 'PET.RBRTE.D': 'petroleum/pri/spt', 'NG.RNGWHHD.D': 'natural-gas/pri/fut', 'NG.RNGC1TX3.D': 'natural-gas/pri/fut', 'PET.EMM_EPM0_PTE_NUS_DPG.W': 'petroleum/pri/gnd', 'PET.EMD_EPD2D_PTE_NUS_DPG.W': 'petroleum/pri/gnd', 'PET.EER_EPJK_PF4_RGC_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLLPA_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLEM_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLBN_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLBI_PF4_Y44MB_DPG.D': 'petroleum/pri/spt', 'PET.EER_EPLNG_PF4_Y44MB_DPG.D': 'petroleum/pri/spt'}
PATH=pathlib.Path('static/data/eia-prices.csv')
FIELDS=['series_id','period','value','retrieved_at']
def retrieve(sid,key,start):
    offset=0; rows={}
    while True:
        q={'api_key':key,'frequency':'weekly' if sid.endswith('.W') else 'daily','data[0]':'value','facets[series][]':sid.split('.')[1],'start':start,'length':5000,'offset':offset,'sort[0][column]':'period','sort[0][direction]':'asc'}
        url='https://api.eia.gov/v2/'+ROUTES[sid]+'/data/?'+urllib.parse.urlencode(q)
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url,timeout=45) as r: body=json.load(r)['response']
                data=body['data'];break
            except Exception:
                if attempt==2: raise RuntimeError('EIA request failed after retries') from None
                time.sleep(5*(attempt+1))
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

def main():
    key=os.environ.get('EIA_API_KEY');
    if not key:raise SystemExit('Missing GitHub EIA_API_KEY secret')
    existing={}
    if PATH.exists():
        with PATH.open() as f:
            for row in csv.DictReader(f):existing[(row['series_id'],row['period'])]=row
    failures=[]; success=0
    start=(dt.date.today()-dt.timedelta(days=3660)).isoformat()
    for sid in ROUTES:
        try:
            rows=retrieve(sid,key,start);existing.update(rows);success+=1;print(sid,len(rows),'observations')
        except Exception:failures.append(sid);print(sid,'FAILED; prior data retained')
    if not success:raise SystemExit('No successful series; unchanged snapshot')
    temp=PATH.with_suffix('.tmp');PATH.parent.mkdir(parents=True,exist_ok=True)
    with temp.open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=FIELDS,lineterminator='\n');writer.writeheader();writer.writerows(existing[k] for k in sorted(existing))
    temp.replace(PATH)
    print('Unavailable series:',', '.join(failures) or 'none')
if __name__=='__main__':main()
