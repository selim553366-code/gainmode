/** A phone outline around an app screenshot. Width drives the size; the screen keeps the device ratio. */
export function Phone({ src, alt, width = 260, className = '', style, eager = false }: { src: string; alt: string; width?: number; className?: string; style?: React.CSSProperties; eager?: boolean }) {
  return (
    <div
      className={`relative shrink-0 rounded-[17%/8%] bg-[#0B0F1F] shadow-[0_40px_80px_-20px_rgba(0,0,0,.7),0_0_0_1px_rgba(255,255,255,.12),inset_0_0_0_1px_rgba(255,255,255,.06)] ${className}`}
      style={{ width, padding: width * 0.032, ...style }}
    >
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} draggable={false} style={{ width: width * 0.936, height: width * 0.936 * (2532 / 1170) }} className="block rounded-[14%/6.6%] object-cover object-top" />
      <span className="pointer-events-none absolute left-1/2 top-[2.4%] h-[2.6%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
    </div>
  );
}
