"""Renders the matte bumper plates used on the welcome screen (assets/images/plates/plate-*.png).

Run with Blender's Python module (pip install bpy):
  python scripts/renderBumperPlates.py -- <out_dir> <path to Inter_800ExtraBold.ttf> [size=640] [samples=96]
The PNGs are then cropped to the plate and resized to 440 px.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Euler
argv = sys.argv[sys.argv.index('--') + 1:]
out_dir, font_path = argv[0], argv[1]
size = int(argv[2]) if len(argv) > 2 else 640
samples = int(argv[3]) if len(argv) > 3 else 96

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

PLATES = [
    # name, colour, kg, yaw, pitch
    ('red', '#D8463E', '25', 34, 18),
    ('blue', '#2F6BFF', '20', -30, 16),
    ('yellow', '#F6BE3C', '15', 40, 22),
    ('green', '#2BA65C', '10', -36, 20),
]

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = size
    sc.render.resolution_y = size
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    world = bpy.data.worlds.new('w'); sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.78, 0.82, 0.92, 1); bg.inputs[1].default_value = 0.32
    return sc

def lathe(name, profile, mat, segments=160):
    """Spin a list of (radius, z) points around Z into a closed solid of revolution."""
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

def rubber(color):
    m = bpy.data.materials.new('rubber'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(color)
    b.inputs['Roughness'].default_value = 0.78
    b.inputs['Specular IOR Level'].default_value = 0.25
    # fine rubber grain
    noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 900; noise.inputs['Detail'].default_value = 2
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.06
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

def steel():
    m = bpy.data.materials.new('steel'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.78, 0.8, 0.83, 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = 0.32
    b.inputs['Anisotropic'].default_value = 0.6
    return m

def paint():
    m = bpy.data.materials.new('paint'); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb('#F4F4F2')
    b.inputs['Roughness'].default_value = 0.62
    return m

def build(color, kg):
    root = bpy.data.objects.new('plate', None); bpy.context.collection.objects.link(root)
    R, T, step = 0.5, 0.08, 0.022   # outer radius, half thickness, face recess
    # rubber body profile: rounded outer rim, recessed face between r=0.42 and r=0.19
    body = [(0.19, T - step), (0.40, T - step), (0.415, T - 0.002), (0.43, T)]
    for i in range(1, 9):   # rounded rim
        a = math.pi / 2 * (1 - i / 8)
        body.append((R - 0.07 + 0.07 * math.cos(a), (T - 0.07) + 0.07 * math.sin(a)))
    mirror = [(r, -z) for r, z in reversed(body)]
    prof = [(0.19, -(T - step))] + [p for p in body[::-1]][::-1]
    profile = body + [(R, 0)] + mirror
    profile = [p for p in profile]
    ob = lathe('rubber', [(0.19, T - step)] + body[1:] + [(R, 0.0)] + mirror[:-1] + [(0.19, -(T - step))] , rubber(color))
    ob.parent = root
    # steel hub with a 50 mm bore
    st = steel()
    hub = lathe('hub', [(0.062, T + 0.006), (0.172, T + 0.006), (0.18, T + 0.002), (0.19, T - step), (0.19, -(T - step)), (0.18, -T - 0.002), (0.172, -T - 0.006), (0.062, -T - 0.006), (0.062, T + 0.006)], st)
    hub.parent = root
    dark = bpy.data.materials.new('bore'); dark.use_nodes = True
    db = dark.node_tree.nodes['Principled BSDF']; db.inputs['Base Color'].default_value = (0.02, 0.022, 0.025, 1); db.inputs['Roughness'].default_value = 0.5
    sleeve = lathe('bore', [(0.0, T + 0.004), (0.061, T + 0.004), (0.061, -T - 0.004), (0.0, -T - 0.004)], dark)
    sleeve.parent = root
    for i in range(6):
        a = i / 6 * math.tau + 0.26
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.012, depth=0.006, location=(math.cos(a) * 0.12, math.sin(a) * 0.12, T + 0.008))
        sc_ = bpy.context.active_object; sc_.data.materials.append(st); sc_.parent = root
        bpy.ops.object.shade_smooth()
    # embossed weight on the upper face
    font = bpy.data.fonts.load(font_path)
    for text, y, scale in ((kg, 0.295, 0.19), ('KG', -0.3, 0.095)):
        cu = bpy.data.curves.new('t', 'FONT'); cu.body = text; cu.font = font; cu.size = scale
        cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = 0.008; cu.bevel_depth = 0.002
        to = bpy.data.objects.new('txt', cu); bpy.context.collection.objects.link(to)
        to.location = (0, y, T - step + 0.008); to.data.materials.append(paint()); to.parent = root
    return root

def camera_and_lights(sc):
    cam = bpy.data.cameras.new('c'); cam.lens = 85
    co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
    co.location = (0, 0, 3.15); co.rotation_euler = (0, 0, 0)
    def area(name, loc, energy, size, color=(1, 1, 1)):
        l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = size; l.color = color
        o = bpy.data.objects.new(name, l); bpy.context.collection.objects.link(o); o.location = loc
        d = Vector((0, 0, 0)) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    area('key', (-2.2, 2.4, 3.2), 520, 2.6)
    area('fill', (2.6, -0.8, 2.4), 160, 3.0, (0.86, 0.9, 1.0))
    area('rim', (1.6, 2.6, -1.4), 260, 1.5)

for name, color, kg, yaw, pitch in PLATES:
    sc = reset()
    root = build(color, kg)
    root.rotation_euler = Euler((math.radians(pitch), math.radians(yaw), math.radians(-8)), 'XYZ')
    camera_and_lights(sc)
    sc.render.filepath = os.path.join(out_dir, f'plate-{name}.png')
    bpy.ops.render.render(write_still=True)
    print('rendered', name)
