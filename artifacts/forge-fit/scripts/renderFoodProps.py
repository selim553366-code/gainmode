"""Renders matte 3D food props for the Nutrition page (assets/images/food/apple.png).

Run with Blender's Python module (pip install bpy):
  python scripts/renderFoodProps.py -- <out_dir> [size=640] [samples=128]
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:]
out_dir = argv[0]
size = int(argv[1]) if len(argv) > 1 else 640
samples = int(argv[2]) if len(argv) > 2 else 128

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

def mat(color, rough=0.55, spec=0.35, grain=0.03):
    m = bpy.data.materials.new('m'); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(color); b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = spec
    noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 500; noise.inputs['Detail'].default_value = 2
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = grain
    nt.links.new(noise.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m

def lathe(name, profile, material, segments=96):
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, z)) for r, z in profile]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=segments, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    ob.data.materials.append(material)
    return ob

def apple():
    # two soft lobes on top, a gentle dip at the stem, narrowing toward the base
    pts = [(0.0, 0.40)]
    for i in range(1, 49):
        t = i / 48                                  # 0 = stem dip, 1 = base
        theta = t * math.pi
        r = 0.5 * math.sin(theta) ** 0.7 * (1 - 0.18 * t ** 2)
        z = 0.5 * math.cos(theta) * (0.92 if t < 0.5 else 1.0)
        if t < 0.14: z -= (0.14 - t) * 0.55            # dip around the stem
        pts.append((r, z))
    pts[-1] = (0.0, pts[-1][1])
    body = lathe('body', pts, mat('#D6362E', 0.5, 0.4, 0.015))
    stem = lathe('stem', [(0.0, 0.30), (0.024, 0.30), (0.018, 0.60), (0.0, 0.62)], mat('#5B3A1E', 0.7))
    stem.rotation_euler = (math.radians(6), 0, math.radians(-6))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=48, ring_count=24, location=(0.2, 0.0, 0.5))
    leaf = bpy.context.active_object; leaf.scale = (0.24, 0.02, 0.1); leaf.rotation_euler = (0, math.radians(-28), 0)
    leaf.data.materials.append(mat('#3E9B4F', 0.55)); bpy.ops.object.shade_smooth()
    return [body, stem, leaf]

def scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.film_transparent = True; sc.render.resolution_x = size; sc.render.resolution_y = size
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = -0.3
    world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.8, 0.84, 0.93, 1); bg.inputs[1].default_value = 0.45
    return sc

sc = scene()
parts = apple()
holder = bpy.data.objects.new('h', None); bpy.context.collection.objects.link(holder)
for p in parts: p.parent = holder
holder.rotation_euler = Euler((math.radians(-8), math.radians(-10), math.radians(-6)), 'XYZ')
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = 1.55
co = bpy.data.objects.new('cam', cam); bpy.context.collection.objects.link(co); sc.camera = co
co.location = (0, -4, 0.05); co.rotation_euler = (math.radians(90), 0, 0)
def area(name, loc, energy, sz, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.size = sz; l.color = color
    o = bpy.data.objects.new(name, l); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('key', (-2.2, -2.6, 2.6), 650, 2.6)
area('fill', (2.6, -2.2, 1.2), 200, 3.0, (0.88, 0.92, 1.0))
area('rim', (1.8, 2.2, 2.0), 260, 1.4)
sc.render.filepath = os.path.join(out_dir, 'apple.png')
bpy.ops.render.render(write_still=True); print('rendered apple')
