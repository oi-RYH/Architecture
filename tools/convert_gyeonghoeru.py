# Gyeonghoeru (국가유산청 원천자원) FBX → web glTF, one file per explanatory layer.
# Run: Blender -b --factory-startup --python tools/convert_gyeonghoeru.py -- <fbx> <out_dir>
# The source is a single merged mesh with 33 materials, so layers are assigned by
# material (see LAYER_OF). Geometry is not simplified; Draco quantizes positions
# to 16 bit and UVs to 14 bit. Color maps ≤2048px, normal maps ≤1024px (DirectX
# green flipped to OpenGL), written as PNG for tools/ktx2_textures.py. The source files are not modified.
import bpy, sys, os, json
import numpy as np

src, out = sys.argv[sys.argv.index('--') + 1:][:2]
LAYER_OF = {
 'base': ['Land01A', 'Land02A', 'Pillar01A', 'Stone', 'Stair', 'Yeonhwadae'],
 'frame': ['Redpillar', 'Redwood', 'Changbang01A', 'Changbang01B', 'Green_wood', 'Greenwoo01A'],
 'brackets': ['Gongpoes', 'Soro'],
 'eaves': ['AngelRafter', 'Buyeon', 'Roof01A'],
 'roof': ['Giwa01A', 'Giwa02A', 'Rooformament01A', 'Rooformament01B', 'Rooformament01C', 'Roofstone', 'Gable'],
 'finishes': ['Windowframe', 'Doorpaper01A', 'Wall', 'WhiteWall01A', 'Floor01A', 'Floor02A', 'Ceiling', 'Metal'],
 'ornaments': ['Stela'],
}
CUTOUT = {'AngelRafter'}
layer_by_mat = {f'MI_KHL_{m}': l for l, ms in LAYER_OF.items() for m in ms}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=src)
mesh = [o for o in bpy.data.objects if o.type == 'MESH'][0]

# ---- materials: drop broken normal maps, alpha only where the texture really cuts out
for m in bpy.data.materials:
    nt = m.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    for l in [l for l in nt.links if l.to_node == bsdf and l.to_socket.name == 'Alpha']:
        src_socket = l.from_socket
        nt.links.remove(l)
        if m.name.replace('MI_KHL_', '') in CUTOUT:
            r = nt.nodes.new('ShaderNodeMath'); r.operation = 'ROUND'
            nt.links.new(src_socket, r.inputs[0]); nt.links.new(r.outputs[0], bsdf.inputs['Alpha'])
    broken = [n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and n.image.size[0] == 0]
    for n in broken:
        for l in [l for l in nt.links if l.from_node == n]:
            nm = l.to_node
            for l2 in [l2 for l2 in nt.links if l2.from_node == nm or l2.to_node == nm]: nt.links.remove(l2)
        nt.nodes.remove(n)
    bsdf.inputs['Roughness'].default_value = .78
    bsdf.inputs['Metallic'].default_value = .35 if m.name.endswith('Metal') else 0.

# ---- textures: resize, flip DirectX normals
done = set()
for m in bpy.data.materials:
    for n in m.node_tree.nodes:
        if n.type != 'TEX_IMAGE' or not n.image or n.image.size[0] == 0: continue
        im = n.image
        if im.name in done: continue
        done.add(im.name)
        normal = any(l.to_node.type == 'NORMAL_MAP' for l in n.outputs[0].links)
        cap = 1024 if normal else 2048
        w, h = im.size
        if max(w, h) > cap: im.scale(int(w * cap / max(w, h)), int(h * cap / max(w, h)))
        if normal:
            px = np.empty(im.size[0] * im.size[1] * 4, dtype=np.float32); im.pixels.foreach_get(px)
            px[1::4] = 1. - px[1::4]; im.pixels.foreach_set(px)
        im.update()

# ---- split by material, regroup by layer
bpy.context.view_layer.objects.active = mesh; mesh.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
report = {'source': os.path.basename(src), 'layers': {}, 'materials': {}}
parts = {}
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    mat = o.material_slots[0].material.name
    layer = layer_by_mat[mat]
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    report['materials'][mat] = {'layer': layer, 'triangles': tris}
    parts.setdefault(layer, []).append(o)
os.makedirs(out, exist_ok=True)
for layer, objs in parts.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = f'GHR_{layer}'; o['architecturalLayer'] = layer
    report['layers'][layer] = sum(v['triangles'] for v in report['materials'].values() if v['layer'] == layer)
for layer in parts:
    o = bpy.data.objects[f'GHR_{layer}']
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, f'{layer}.gltf'), export_format='GLTF_SEPARATE',
        use_selection=True, export_extras=True, export_yup=True, export_apply=True,
        export_texture_dir='textures', export_image_format='AUTO',
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16, export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=14, export_materials='EXPORT', export_animations=False)
json.dump(report, open(os.path.join(out, 'layer-report.json'), 'w'), ensure_ascii=False, indent=1)
print('DONE', json.dumps(report['layers']))
