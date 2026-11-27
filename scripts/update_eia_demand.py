import io, xlrd, csv, datetime as dt, json, math, os, pathlib, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
P=pathlib.Path('static/data/eia-demand.csv'); F=['series_id','period','value','retrieved_at','source']
SERIES=json.loads(pathlib.Path('scripts/demand-series.json').read_text()); today=dt.date.today(); floor=today-dt.timedelta(days=3653)
def retrieve_api(sid,start,key):
    freq='weekly' if sid.endswith('.W') else 'monthly'; start=start.isoformat()[:10 if freq=='weekly' else 7]
    q={'api_key':key,'frequency':freq,'start':start,'length':5000,'sort[0][column]':'period','sort[0][direction]':'desc'}
    route = 'petroleum/sum/snd'
    q.update({'data[0]':'value','facets[series][]':sid.split('.')[1]})
    url='https://api.eia.gov/v2/'+route+'/data/?'+urllib.parse.urlencode(q)
    try:
        with urllib.request.urlopen(url,timeout=15) as r: body=json.load(r)['response']
        if not body['data']:raise RuntimeError('Empty native response')
    except Exception:
        q.pop('data[0]');q.pop('facets[series][]')
        url='https://api.eia.gov/v2/seriesid/'+sid+'?'+urllib.parse.urlencode(q)
        with urllib.request.urlopen(url,timeout=15) as r: body=json.load(r)['response']
    rows={}; stamp=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    for r in body['data']:
        try:
            period=r['period']; date=dt.date.fromisoformat(period if freq=='weekly' else period+'-01'); v=float(r['value'])
            if not math.isfinite(v) or date>today or period<start:continue
        except (ValueError,TypeError,KeyError):continue
        rows[sid,period]=dict(zip(F,[sid,period,str(v),stamp,'EIA API']))
    if not rows:raise RuntimeError('No observations')
    return rows

def retrieve_xls(sid,start):
    _,code,freq=sid.split('.')
    url=f'https://www.eia.gov/dnav/pet/hist_xls/{code.lower()}{freq.lower()}.xls'
    req=urllib.request.Request(url,headers={'User-Agent':'HoustonCNG historical data updater'})
    with urllib.request.urlopen(req,timeout=20) as r:
        raw=r.read(15_000_001)
    if len(raw)>15_000_000: raise RuntimeError('Workbook too large')
    book=xlrd.open_workbook(file_contents=raw)
    rows={}; stamp=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    for sheet in book.sheets():
        for h in range(min(sheet.nrows,12)):
            for c in range(1,sheet.ncols):
                if str(sheet.cell_value(h,c)).strip().upper()!=code: continue
                metadata=' '.join(str(sheet.cell_value(j,c)) for j in range(max(0,h-3),min(h+4,sheet.nrows))).lower()
                if 'thousand barrels per day' not in metadata: continue
                for i in range(h+1,sheet.nrows):
                    try:
                        cell=sheet.cell(i,0)
                        if cell.ctype==xlrd.XL_CELL_DATE: date=xlrd.xldate_as_datetime(cell.value,book.datemode).date()
                        else: continue
                        val=sheet.cell_value(i,c)
                        if isinstance(val,str) and not val.strip(): continue
                        v=float(val)
                        if not math.isfinite(v) or date>today:continue
                        period=date.isoformat() if freq=='W' else date.isoformat()[:7]
                        if period<start.isoformat()[:10 if freq=='W' else 7]:continue
                        rows[sid,period]=dict(zip(F,[sid,period,str(v),stamp,'EIA historical XLS:'+code]))
                    except (ValueError,TypeError,OverflowError):continue
    if not rows:raise RuntimeError('No matching series and unit in workbook')
    return rows

def retrieve(sid,start,key):
    print(sid,'trying historical XLS',flush=True)
    try:return retrieve_xls(sid,start)
    except Exception as e:
        print(sid,'XLS failed:',f'HTTP {e.code}' if isinstance(e,urllib.error.HTTPError) else type(e).__name__,flush=True)
    if not key:raise RuntimeError('No API key for fallback')
    print(sid,'trying API fallback',flush=True)
    return retrieve_api(sid,start,key)

def main():
    key=os.environ.get('EIA_API_KEY');
    existing={}
    if P.exists():
        with P.open() as f: existing={(r['series_id'],r['period']):r for r in csv.DictReader(f)}
    def start(sid):
        dates=[d for i,d in existing if i==sid]; return max(floor,dt.date.fromisoformat(max(dates)+('-01' if sid.endswith('.M') else ''))-dt.timedelta(days=120)) if dates else floor
    success=0
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs={pool.submit(retrieve,s['seriesId'],start(s['seriesId']),key):s['seriesId'] for s in SERIES}
        for f in as_completed(jobs):
            sid=jobs[f]
            try: rows=f.result();existing.update(rows);success+=1;print(sid,len(rows),'observations',flush=True)
            except Exception as e: print(sid,'FAILED',f'HTTP {e.code}' if isinstance(e,urllib.error.HTTPError) else type(e).__name__,'prior data retained',flush=True)
    if not success:raise SystemExit('No successful series; snapshot unchanged')
    P.parent.mkdir(parents=True,exist_ok=True); tmp=P.with_suffix('.tmp')
    with tmp.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=F,lineterminator='\n');w.writeheader();w.writerows(existing[k] for k in sorted(existing))
    tmp.replace(P)
if __name__=='__main__':main()
