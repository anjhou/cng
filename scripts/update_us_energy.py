import csv, io, urllib.request, pathlib, datetime, json, math
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL='https://www.eia.gov/totalenergy/data/browser/csv.php?tbl=T01.03'
SERIES=dict(CLTCBUS='Coal',NNTCBUS='Natural Gas',PMTCBUS='Petroleum',NUETBUS='Nuclear',RETCBUS='Renewable',TETCBUS='Total')
FIELDS=['Year',*SERIES.values(),'Source']
def parse(raw):
    years={}
    for r in csv.DictReader(io.StringIO(raw)):
        code=r['MSN']; period=r['YYYYMM']
        if code not in SERIES or not period.endswith('13') or not period[:4].isdigit() or int(period[:4])>=datetime.date.today().year: continue
        try: v=float(r['Value'])
        except (ValueError,TypeError): continue
        if not math.isfinite(v): continue
        unit=' '.join(r.get('Unit','').lower().split())
        factors={'quadrillion btu':1, 'trillion btu':1/1000, 'billion btu':1/1000000}
        if unit not in factors: raise ValueError('Unexpected EIA unit: '+str(r.get('Unit')))
        v*=factors[unit]
        years.setdefault(period[:4],{})[SERIES[code]]=v
    rows=[dict(Year=y,**d,Source='EIA MER Table 1.3') for y,d in sorted(years.items()) if len(d)==6]
    if len(rows)<20 or not set(map(str,range(int(rows[-1]['Year'])-19,int(rows[-1]['Year'])+1))).issubset({r['Year'] for r in rows}): raise ValueError('Incomplete annual source')
    return rows
if __name__=='__main__':
    req=urllib.request.Request(URL,headers={'User-Agent':'Houston Chemical Energy data refresh'})
    with urllib.request.urlopen(req,timeout=90) as f: rows=parse(f.read().decode('utf-8-sig'))
    dest=ROOT/'static/data/us-energy.csv'
    if dest.exists():
        old=list(csv.DictReader(dest.open()))
        if not {r['Year'] for r in old}.issubset({r['Year'] for r in rows}): raise ValueError('Source lost previously published years')
    dest.parent.mkdir(parents=True,exist_ok=True)
    tmp=dest.with_suffix('.tmp')
    with tmp.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=FIELDS);w.writeheader();w.writerows(rows)
    tmp.replace(dest)
    (dest.parent/'us-energy-meta.json').write_text(json.dumps({'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':URL,'latest_year':rows[-1]['Year']}))
