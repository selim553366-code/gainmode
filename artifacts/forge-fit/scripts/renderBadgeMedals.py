"""Renders one matte metal medal per badge, with the badge's icon embossed on it (assets/images/medals/badge-<id>.png).

Each icon is a Lucide icon turned into raised line relief: the SVG strokes become rounded 3D tubes standing on the face.
Run with Blender's Python module (pip install bpy). The manifest lists {id, tier, icon, color} for every badge (color paints the face) plus a "locked" one,
and svg_dir holds <icon>.svg (24x24 Lucide icons):
  python scripts/renderBadgeMedals.py -- <out_dir> <svg_dir> <manifest.json> [size=640] [samples=128] [only_id]
"""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
out_dir, svg_dir, manifest_path = argv[0], argv[1], argv[2]
size = int(argv[3]) if len(argv) > 3 else 640
samples = int(argv[4]) if len(argv) > 4 else 128
only = argv[5] if len(argv) > 5 else None

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

# tier: (base metal, face metal, metallic, roughness)
TIERS = {
    'bronze':    ('#B9783F', '#C98C54', 0.85, 0.52),
    'silver':    ('#B9C0CC', '#CCD2DC', 0.9, 0.46),
    'gold':      ('#D9A62E', '#E8BB4A', 0.9, 0.5),
    'platinum':  ('#8FB4D6', '#A9C8E4', 0.88, 0.44),
    'legendary': ('#8C5CE6', '#A57BF2', 0.8, 0.42),
    'locked':    ('#5E6673', '#6B7482', 0.25, 0.7),
}

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = size; sc.render.resolution_y = size
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.35   # Standard keeps the badge colours saturated; AgX washes them out
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.8, 0.84, 0.93, 1); bg.inputs[1].default_value = 0.4
    return sc

def metal(name, color, metallic, rough, grain=0.05):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(color)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    b.inputs['Anisotropic'].default_value = 0.25
    noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 700; noise.inputs['Detail'].default_value = 3
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = grain
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

def lathe(name, profile, mat, segments=192):
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, z)) for r, z in profile]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=segments, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    ob.data.materials.append(mat)
    return ob

def arc(cx, cz, r, a0, a1, n=10):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]

def build(base, face, metallic, rough, enamel=None):
    root = bpy.data.objects.new('medal', None); bpy.context.collection.objects.link(root)
    R, T = 0.5, 0.07
    # rim: a rounded torus-like band; face: a recessed disc with a fine beaded ring
    rim = [(0.36, T * 0.55)] + arc(R - 0.07, T - 0.07, 0.07, 90, 0, 8) + [(R, 0.0)] + arc(R - 0.07, -(T - 0.07), 0.07, 0, -90, 8) + [(0.36, -T * 0.55)]
    ob = lathe('rim', rim, metal('rim', base, metallic, rough, 0.04)); ob.parent = root
    disc = [(0.0, T * 0.3), (0.34, T * 0.3), (0.36, T * 0.55), (0.36, -T * 0.55), (0.34, -T * 0.3), (0.0, -T * 0.3)]
    face_mat = metal('face', shade(enamel, -0.12), 0.0, 0.5, 0.04) if enamel else metal('face', face, metallic, rough + 0.05, 0.05)
    ob = lathe('face', disc, face_mat); ob.parent = root
    # a thin raised bead ring on the face
    bead = arc(0.30, T * 0.3, 0.013, 180, 0, 8) + [(0.317, T * 0.3)]
    ob = lathe('bead', [(0.287, T * 0.3)] + arc(0.30, T * 0.3, 0.013, 180, 0, 8) + [(0.313, T * 0.3)], metal('bead', base, metallic, rough, 0.02)); ob.parent = root
    return root

PX = 0.0254 / 96          # Blender's SVG importer maps one SVG px to this many units
GLYPH = 0.47              # glyph size on the medal (the medal's diameter is 1.0)

def shade(h, amount):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) for i in (0, 2, 4)]
    return '#%02X%02X%02X' % tuple(int(v * (1 + amount)) for v in c)

def lighten(h, amount):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) for i in (0, 2, 4)]
    return '#%02X%02X%02X' % tuple(int(v + (255 - v) * amount) for v in c)

def emboss(root, svg_path, face_z, base, metallic, rough, enamel=None):
    """Import a stroke-only 24x24 SVG and turn each path into a rounded raised tube standing on the medal face."""
    bpy.ops.preferences.addon_enable(module='io_curve_svg')
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=svg_path)
    objs = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    holder = bpy.data.objects.new('glyph', None); bpy.context.collection.objects.link(holder)
    k = GLYPH / (24 * PX)
    holder.scale = (k, k, k)
    holder.location = (-12 * PX * k, -12 * PX * k, face_z)
    holder.parent = root
    mat = metal('glyph', lighten(enamel, 0.5), 0.0, 0.4, 0.02) if enamel else metal('glyph', lighten(base, 0.22), metallic, max(0.26, rough - 0.2), 0.02)
    for o in objs:
        o.parent = holder
        d = o.data
        d.dimensions = '3D'
        d.resolution_u = 24
        d.bevel_depth = 1.45 * PX       # a 2 px Lucide stroke has a radius of 1 px; chunkier reads better as relief at badge sizes
        d.bevel_resolution = 8
        d.materials.clear(); d.materials.append(mat)
    return holder

def camera_and_lights(sc):
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = 1.12
    co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
    co.location = (0, 0, 4); co.rotation_euler = (0, 0, 0)
    def area(name, loc, energy, sz, color=(1, 1, 1)):
        l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = sz; l.color = color
        o = bpy.data.objects.new(name, l); bpy.context.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    area('key', (-1.8, 2.0, 2.6), 520, 2.4)
    area('fill', (2.4, -1.4, 2.2), 150, 3.0, (0.88, 0.92, 1.0))
    area('rim', (1.6, 2.2, 1.2), 200, 1.2)

for entry in json.load(open(manifest_path)):
    if only and entry['id'] != only:
        continue
    base, face, metallic, rough = TIERS[entry['tier']]
    sc = reset()
    enamel = entry.get('color')       # a badge's own colour paints the face; the tier's metal stays on the rim
    root = build(base, face, metallic, rough, enamel)
    emboss(root, os.path.join(svg_dir, entry['icon'] + '.svg'), 0.07 * 0.3, face, metallic, rough, enamel)
    camera_and_lights(sc)
    sc.render.filepath = os.path.join(out_dir, f"badge-{entry['id']}.png")
    bpy.ops.render.render(write_still=True); print('rendered', entry['id'])
