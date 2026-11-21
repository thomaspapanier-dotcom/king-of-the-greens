"""Minimal reader for the Natural Earth admin-1 shapefile (no extra packages needed).

read(zip_path, countries) -> list of {'props': {...}, 'rings': [[(lon, lat), ...], ...]} for the given ISO3 codes.
"""
import struct
import zipfile

NUL = chr(0)


def _dbf(data):
    n, hlen, rlen = struct.unpack('<IHH', data[4:12])
    fields, off = [], 32
    while data[off] != 0x0D:
        name = data[off:off + 11].split(b'\0')[0].decode('ascii')
        fields.append((name, data[off + 16]))
        off += 32
    rows = []
    for i in range(n):
        rec = data[hlen + i * rlen: hlen + (i + 1) * rlen]
        pos, row = 1, {}
        for name, ln in fields:
            row[name] = rec[pos:pos + ln].decode('utf8', 'replace').strip(NUL + ' ')
            pos += ln
        rows.append(row)
    return rows


def _shp(data):
    shapes, off = [], 100
    while off < len(data):
        _, clen = struct.unpack('>II', data[off:off + 8])
        body = data[off + 8: off + 8 + clen * 2]
        off += 8 + clen * 2
        st = struct.unpack('<i', body[:4])[0]
        if st not in (5, 15, 25):
            shapes.append([])
            continue
        nparts, npts = struct.unpack('<ii', body[36:44])
        parts = list(struct.unpack(f'<{nparts}i', body[44:44 + 4 * nparts])) + [npts]
        p0 = 44 + 4 * nparts
        pts = struct.unpack(f'<{2 * npts}d', body[p0:p0 + 16 * npts])
        shapes.append([[(pts[2 * k], pts[2 * k + 1]) for k in range(parts[j], parts[j + 1])] for j in range(nparts)])
    return shapes


def read(zip_path, countries):
    z = zipfile.ZipFile(zip_path)
    base = 'ne_10m_admin_1_states_provinces'
    rows = _dbf(z.read(base + '.dbf'))
    shapes = _shp(z.read(base + '.shp'))
    return [{'props': r, 'rings': s} for r, s in zip(rows, shapes) if r.get('adm0_a3') in countries]
