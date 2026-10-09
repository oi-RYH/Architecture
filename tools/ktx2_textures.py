"""Re-encode a glTF folder's PNG textures as KTX2 (KHR_texture_basisu), matching the
Geunjeongjeon settings: color maps ETC1S qlevel 255 / clevel 2 (sRGB), normal maps
UASTC quality 3 + Zstd 18 (linear), mipmaps on both. Every *.gltf in the folder is
rewritten to point at the .ktx2 files; the PNGs are removed afterwards.

usage: python3 tools/ktx2_textures.py <model_dir> [--toktx PATH]
"""
import json, os, subprocess, sys, glob

model_dir = sys.argv[1]
toktx = sys.argv[sys.argv.index('--toktx') + 1] if '--toktx' in sys.argv else os.path.expanduser('~/.local/opt/ktx-4.4.2/bin/toktx')
gltfs = sorted(glob.glob(os.path.join(model_dir, '*.gltf')))

# Which role does each image file play (normal vs color)?
roles = {}
for path in gltfs:
    g = json.load(open(path))
    tex_src = [t.get('source') for t in g.get('textures', [])]
    for m in g.get('materials', []):
        uses = [('normal', m.get('normalTexture'))]
        pbr = m.get('pbrMetallicRoughness', {})
        uses += [('color', pbr.get('baseColorTexture')), ('linear', pbr.get('metallicRoughnessTexture'))]
        for role, ref in uses:
            if not ref: continue
            uri = g['images'][tex_src[ref['index']]]['uri']
            roles.setdefault(uri, role)

encoded = {}
for uri, role in sorted(roles.items()):
    src = os.path.join(model_dir, uri)
    dst_uri = os.path.splitext(uri)[0] + '.ktx2'
    dst = os.path.join(model_dir, dst_uri)
    if role == 'color':
        args = ['--encode', 'etc1s', '--clevel', '2', '--qlevel', '255', '--assign_oetf', 'srgb']
    else:
        args = ['--encode', 'uastc', '--uastc_quality', '3', '--zcmp', '18', '--assign_oetf', 'linear']
    subprocess.run([toktx, '--t2', '--genmipmap', *args, dst, src], check=True)
    encoded[uri] = dst_uri
    print(f'{role:6s} {os.path.getsize(src):>10d} -> {os.path.getsize(dst):>10d}  {dst_uri}')

for path in gltfs:
    g = json.load(open(path))
    for im in g.get('images', []):
        if im['uri'] in encoded:
            im['uri'] = encoded[im['uri']]; im['mimeType'] = 'image/ktx2'
    for t in g.get('textures', []):
        src = t.pop('source', None)
        exts = t.setdefault('extensions', {})
        exts.pop('EXT_texture_webp', None)
        if src is not None: exts['KHR_texture_basisu'] = {'source': src}
    for key in ('extensionsUsed', 'extensionsRequired'):
        ex = [e for e in g.get(key, []) if e != 'EXT_texture_webp']
        if 'KHR_texture_basisu' not in ex: ex.append('KHR_texture_basisu')
        g[key] = ex
    json.dump(g, open(path, 'w'), separators=(',', ':'))

for uri in encoded: os.remove(os.path.join(model_dir, uri))
print('ENCODED', len(encoded))
