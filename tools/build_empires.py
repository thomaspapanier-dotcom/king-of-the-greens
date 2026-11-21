"""Build the Kingdom maps for the Empires outside the U.S. from Natural Earth admin-1 outlines.

Groups Natural Earth areas into Kingdoms (counties, provinces, states, prefectures), merges the pieces,
projects each Empire onto a flat map, simplifies the coastlines and writes js/empiremaps.js:
  EMPIRE_MAPS[empire] = { view: [w, h], paths: {kingdom: d}, label: {kingdom: [x, y]}, box: {kingdom: [x0, y0, x1, y1]} }

Run: python tools/build_empires.py <path to ne_10m_admin_1_states_provinces.zip>
The Kingdom and Realm names live in js/kingdoms.js; the codes here must match it.
"""
import json
import math
import pathlib
import sys
import unicodedata

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import natural_earth as ne  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
plain = lambda s: unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()

# ---------- Great Britain: council areas -> counties ----------
GB = {
    # Scotland
    'Highland': 'highland', 'Moray': 'moray', 'Aberdeenshire': 'aberdeenshire', 'Aberdeen': 'aberdeenshire',
    'Angus': 'angus', 'Dundee': 'angus', 'Perthshire and Kinross': 'perthshire', 'Fife': 'fife',
    'Stirling': 'stirlingshire', 'Clackmannanshire': 'stirlingshire', 'Falkirk': 'stirlingshire',
    'East Lothian': 'east-lothian', 'Edinburgh': 'lothians', 'Midlothian': 'lothians', 'West Lothian': 'lothians',
    'Glasgow': 'clyde', 'North Lanarkshire': 'clyde', 'South Lanarkshire': 'clyde', 'East Dunbartonshire': 'clyde',
    'West Dunbartonshire': 'clyde', 'Renfrewshire': 'clyde', 'East Renfrewshire': 'clyde', 'Inverclyde': 'clyde',
    'North Ayshire': 'ayrshire', 'South Ayrshire': 'ayrshire', 'East Ayrshire': 'ayrshire',
    'Dumfries and Galloway': 'dumfries', 'Scottish Borders': 'borders', 'Argyll and Bute': 'argyll',
    'Eilean Siar': 'isles', 'Orkney': 'isles', 'Shetland Islands': 'isles',
    # Wales
    'Gwynedd': 'gwynedd', 'Anglesey': 'gwynedd', 'Conwy': 'clwyd', 'Denbighshire': 'clwyd', 'Flintshire': 'clwyd',
    'Wrexham': 'clwyd', 'Powys': 'powys', 'Carmarthenshire': 'dyfed', 'Pembrokeshire': 'dyfed', 'Ceredigion': 'dyfed',
    'Swansea': 'glamorgan', 'Neath Port Talbot': 'glamorgan', 'Bridgend': 'glamorgan', 'Rhondda, Cynon, Taff': 'glamorgan',
    'Merthyr Tydfil': 'glamorgan', 'Caerphilly': 'gwent', 'Cardiff': 'glamorgan', 'Vale of Glamorgan': 'glamorgan',
    'Newport': 'gwent', 'Monmouthshire': 'gwent', 'Torfaen': 'gwent', 'Blaenau Gwent': 'gwent',
    # North of England
    'Northumberland': 'northumberland', 'North Tyneside': 'tyne-wear', 'South Tyneside': 'tyne-wear', 'Sunderland': 'tyne-wear',
    'Gateshead': 'tyne-wear', 'Newcastle upon Tyne': 'tyne-wear', 'Durham': 'durham', 'Hartlepool': 'durham',
    'Darlington': 'durham', 'Stockton-on-Tees': 'durham', 'North Yorkshire': 'north-yorkshire', 'York': 'north-yorkshire',
    'Middlesbrough': 'north-yorkshire', 'Redcar and Cleveland': 'north-yorkshire', 'East Riding of Yorkshire': 'east-yorkshire',
    'Kingston upon Hull': 'east-yorkshire', 'Doncaster': 'south-yorkshire', 'Rotherham': 'south-yorkshire',
    'Sheffield': 'south-yorkshire', 'Barnsley': 'south-yorkshire', 'Leeds': 'west-yorkshire', 'Bradford': 'west-yorkshire',
    'Wakefield': 'west-yorkshire', 'Calderdale': 'west-yorkshire', 'Kirklees': 'west-yorkshire', 'Cumbria': 'cumbria',
    'Lancashire': 'lancashire', 'Blackpool': 'lancashire', 'Blackburn with Darwen': 'lancashire',
    'Knowsley': 'merseyside', 'Liverpool': 'merseyside', 'Sefton': 'merseyside', 'Merseyside': 'merseyside',
    'Wigan': 'manchester', 'Stockport': 'manchester', 'Salford': 'manchester', 'Bolton': 'manchester', 'Trafford': 'manchester',
    'Manchester': 'manchester', 'Oldham': 'manchester', 'Rochdale': 'manchester', 'Tameside': 'manchester', 'Bury': 'manchester',
    'Cheshire West and Chester': 'cheshire', 'Cheshire East': 'cheshire', 'Warrington': 'cheshire', 'Halton': 'cheshire',
    # Midlands
    'Lincolnshire': 'lincolnshire', 'North Lincolnshire': 'lincolnshire', 'North East Lincolnshire': 'lincolnshire',
    'Derbyshire': 'derbyshire', 'Derby': 'derbyshire', 'Nottinghamshire': 'nottinghamshire', 'Nottingham': 'nottinghamshire',
    'Leicestershire': 'leicestershire', 'Leicester': 'leicestershire', 'Rutland': 'leicestershire',
    'Northamptonshire': 'northamptonshire', 'Staffordshire': 'staffordshire', 'Stoke-on-Trent': 'staffordshire',
    'Shropshire': 'shropshire', 'Telford and Wrekin': 'shropshire', 'Herefordshire': 'herefordshire',
    'Worcestershire': 'worcestershire', 'Warwickshire': 'warwickshire', 'Solihull': 'west-midlands', 'Coventry': 'west-midlands',
    'Birmingham': 'west-midlands', 'Sandwell': 'west-midlands', 'Dudley': 'west-midlands', 'Walsall': 'west-midlands',
    'Wolverhampton': 'west-midlands',
    # London, the South East and the East
    'Kent': 'kent', 'Medway': 'kent', 'Surrey': 'surrey', 'East Sussex': 'east-sussex', 'Brighton and Hove': 'east-sussex',
    'West Sussex': 'west-sussex', 'Hampshire': 'hampshire', 'Portsmouth': 'hampshire', 'Southampton': 'hampshire',
    'Isle of Wight': 'isle-of-wight', 'West Berkshire': 'berkshire', 'Wokingham': 'berkshire', 'Bracknell Forest': 'berkshire',
    'Royal Borough of Windsor and Maidenhead': 'berkshire', 'Slough': 'berkshire', 'Reading': 'berkshire',
    'Oxfordshire': 'oxfordshire', 'Buckinghamshire': 'buckinghamshire', 'Milton Keynes': 'buckinghamshire',
    'Bedford': 'bedfordshire', 'Central Bedfordshire': 'bedfordshire', 'Luton': 'bedfordshire', 'Hertfordshire': 'hertfordshire',
    'Essex': 'essex', 'Southend-on-Sea': 'essex', 'Thurrock': 'essex', 'Cambridgeshire': 'cambridgeshire',
    'Peterborough': 'cambridgeshire', 'Norfolk': 'norfolk', 'Suffolk': 'suffolk',
    # South West
    'Cornwall': 'cornwall', 'Isles of Scilly': 'cornwall', 'Devon': 'devon', 'Torbay': 'devon', 'Plymouth': 'devon',
    'Somerset': 'somerset', 'North Somerset': 'somerset', 'Bath and North East Somerset': 'somerset', 'Dorset': 'dorset',
    'Bournemouth': 'dorset', 'Poole': 'dorset', 'Wiltshire': 'wiltshire', 'Swindon': 'wiltshire',
    'Gloucestershire': 'gloucestershire', 'South Gloucestershire': 'gloucestershire', 'Bristol': 'bristol',
}
# ---------- Ireland (the whole island): pieces -> the 32 counties ----------
NI = {
    'Belfast': 'antrim', 'Antrim': 'antrim', 'Ballymena': 'antrim', 'Ballymoney': 'antrim', 'Carrickfergus': 'antrim',
    'Larne': 'antrim', 'Moyle': 'antrim', 'Newtownabbey': 'antrim', 'Lisburn': 'antrim',
    'North Down': 'down', 'Ards': 'down', 'Down': 'down', 'Castlereagh': 'down', 'Banbridge': 'down', 'Newry and Mourne': 'down',
    'Armagh': 'armagh', 'Craigavon': 'armagh',
    'Derry': 'londonderry', 'Limavady': 'londonderry', 'Coleraine': 'londonderry', 'Magherafelt': 'londonderry',
    'Strabane': 'tyrone', 'Omagh': 'tyrone', 'Dungannon': 'tyrone', 'Mid Ulster': 'tyrone', 'Fermanagh': 'fermanagh',
}
IE_MERGE = {'Fingal': 'dublin', 'Dún Laoghaire–Rathdown': 'dublin', 'South Dublin': 'dublin', 'Dublin': 'dublin',
            'North Tipperary': 'tipperary', 'South Tipperary': 'tipperary', 'Laoighis': 'laois'}


def kingdom_of(empire, p):
    a3, name = p['adm0_a3'], p['name']
    if empire == 'GB':
        if a3 != 'GBR' or p['region'] == 'Northern Ireland':
            return None
        if p['region'] == 'Greater London':
            return 'GB-london'  # its 33 boroughs make one Kingdom
        if name not in GB:
            print('  unplaced GB area:', name)
            return None
        return f'GB-{GB[name]}'
    if empire == 'IE':
        if a3 == 'GBR' and p['region'] == 'Northern Ireland':
            if name not in NI:
                print('  unplaced NI area:', name)
                return None
            return f'IE-{NI[name]}'
        if a3 == 'IRL':
            return 'IE-' + IE_MERGE.get(name, plain(name).lower().replace(' ', '-'))
        return None
    if empire == 'CA':
        return p['iso_3166_2'] if a3 == 'CAN' else None
    if empire == 'AU':
        if a3 != 'AUS' or p['iso_3166_2'].endswith('~'):
            return None  # Macquarie Island, Jervis Bay
        return p['iso_3166_2']
    if empire == 'JP':
        return p['iso_3166_2'] if a3 == 'JPN' else None
    iso = p['iso_3166_2']
    if empire in ('DE', 'SE', 'KR', 'CN'):
        return iso if a3 == A3[empire] and not iso.endswith('~') else None
    if empire == 'NL':
        return iso if a3 == 'NLD' and not iso.startswith('NL-BQ') else None  # leave out the Caribbean islands
    if empire == 'NZ':
        return iso if a3 == 'NZL' and iso.startswith('NZ-') and not iso.endswith('~') and iso != 'NZ-CIT' else None
    if empire == 'FR':  # departments -> the 13 regions of mainland France and Corsica
        code = 'FR-' + p['region_cod'].strip().removeprefix('FR-')
        return code if a3 == 'FRA' and code not in FR_OVERSEAS else None
    if empire == 'ES':  # provinces -> the 17 autonomous communities
        if a3 != 'ESP' or p['region'] in ('Ceuta', 'Melilla'):
            return None
        return 'ES-' + p['region_cod'].strip().split('.')[-1]


A3 = {'DE': 'DEU', 'SE': 'SWE', 'KR': 'KOR', 'CN': 'CHN'}
FR_OVERSEAS = {'FR-GUF', 'FR-MTQ', 'FR-GUA', 'FR-LRE', 'FR-MAY'}
# Islands drawn closer in, as on most maps of the country: (degrees east, degrees north).
SHIFT = {'ES-CN': (5, 6)}


def union_rings(rings):
    """Merge neighbouring pieces: shared borders appear once each way and cancel out."""
    key = lambda pt: (round(pt[0], 5), round(pt[1], 5))
    edges = {}
    for ring in rings:
        pts = [key(p) for p in ring]
        if pts[0] != pts[-1]:
            pts.append(pts[0])
        for a, b in zip(pts, pts[1:]):
            if a == b:
                continue
            if (b, a) in edges:
                edges[(b, a)] -= 1
                if edges[(b, a)] == 0:
                    del edges[(b, a)]
            else:
                edges[(a, b)] = edges.get((a, b), 0) + 1
    nxt = {}
    for (a, b), n in edges.items():
        for _ in range(n):
            nxt.setdefault(a, []).append(b)
    out = []
    while nxt:
        start = next(iter(nxt))
        ring, cur = [start], start
        while True:
            b = nxt[cur].pop()
            if not nxt[cur]:
                del nxt[cur]
            ring.append(b)
            cur = b
            if cur == start or cur not in nxt:
                break
        if len(ring) > 3:
            out.append(ring)
    return out


def simplify(pts, tol):
    """Douglas-Peucker. A closed ring is split at its farthest point first (start == end would keep everything)."""
    if len(pts) > 3 and pts[0] == pts[-1]:
        ring = pts[:-1]
        far = max(range(len(ring)), key=lambda k: (ring[k][0] - ring[0][0]) ** 2 + (ring[k][1] - ring[0][1]) ** 2)
        a = _dp(ring[:far + 1], tol)
        b = _dp(ring[far:] + [ring[0]], tol)
        return a + b[1:]
    return _dp(pts, tol)


def _dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (x1, y1), (x2, y2) = pts[i], pts[j]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1e-9
        best, bi = 0, -1
        for k in range(i + 1, j):
            d = abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / L
            if d > best:
                best, bi = d, k
        if best > tol:
            keep[bi] = True
            stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]


def area(r):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]))) / 2


def centroid(r):
    a = cx = cy = 0
    for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
        f = x0 * y1 - x1 * y0
        a += f
        cx += (x0 + x1) * f
        cy += (y0 + y1) * f
    return (cx / (3 * a), cy / (3 * a)) if a else r[0]


def build(feats, empire, width=1000):
    groups = {}
    for f in feats:
        k = kingdom_of(empire, f['props'])
        if k:
            dx, dy = SHIFT.get(k, (0, 0))
            rings = [[(x + dx, y + dy) for x, y in r] for r in f['rings']] if (dx or dy) else f['rings']
            groups.setdefault(k, []).extend(rings)
    merged = {k: union_rings(r) for k, r in groups.items()}
    lats = [p[1] for rs in merged.values() for r in rs for p in r]
    lons = [p[0] for rs in merged.values() for r in rs for p in r]
    c = math.cos(math.radians((min(lats) + max(lats)) / 2))
    x0, x1 = min(lons) * c, max(lons) * c
    y0, y1 = -max(lats), -min(lats)
    s = width / (x1 - x0)
    W, H = width, round((y1 - y0) * s)
    proj = lambda p: ((p[0] * c - x0) * s, (-p[1] - y0) * s)
    paths, label, box = {}, {}, {}
    for k, rings in merged.items():
        prj = [[proj(p) for p in r] for r in rings]
        prj.sort(key=area, reverse=True)
        big = area(prj[0])
        keep = []
        for i, r in enumerate(prj):
            a = area(r)
            if i > 0 and (a < 30 or a < big * 0.002):
                continue  # specks of islands
            sr = simplify(r, 1.3)
            if len(sr) < 4 and i == 0:
                sr = simplify(r, 0.15) if len(simplify(r, 0.15)) >= 4 else r  # tiny Kingdoms keep their shape
            if len(sr) >= 4:
                keep.append(sr)
        fmt = (lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')) if area(prj[0]) < 400 else (lambda v: str(round(v)))
        paths[k] = ''.join('M' + 'L'.join(f'{fmt(x)},{fmt(y)}' for x, y in r) + 'Z' for r in keep)
        cx, cy = centroid(prj[0])
        label[k] = [round(cx), round(cy)]
        xs = [p[0] for r in keep for p in r]
        ys = [p[1] for r in keep for p in r]
        box[k] = [round(min(xs)), round(min(ys)), round(max(xs)), round(max(ys))]
    return {'view': [W, H], 'paths': paths, 'label': label, 'box': box}


if __name__ == '__main__':
    src = sys.argv[1]
    feats = ne.read(src, {'GBR', 'IRL', 'CAN', 'AUS', 'JPN', 'DEU', 'SWE', 'CHN', 'FRA', 'NLD', 'NZL', 'ESP', 'KOR'})
    maps = {e: build(feats, e) for e in ['GB', 'IE', 'CA', 'AU', 'JP', 'DE', 'SE', 'CN', 'FR', 'NL', 'NZ', 'ES', 'KR']}
    js = ('// Kingdom outlines for the Empires outside the U.S. (Natural Earth, public domain).\n'
          '// Built by tools/build_empires.py; names and Realms are in js/kingdoms.js.\n'
          'export const EMPIRE_MAPS = ' + json.dumps(maps, separators=(',', ':')) + ';\n')
    (ROOT / 'js/empiremaps.js').write_text(js, encoding='utf8', newline='\n')
    for e, m in maps.items():
        print(e, m['view'], len(m['paths']), 'kingdoms', sum(len(d) for d in m['paths'].values()) // 1024, 'KB')
    print('total', len(js) // 1024, 'KB')
