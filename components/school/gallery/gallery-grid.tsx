import Image from "next/image";
import type { WebsiteGalleryItem } from "@/types/media";

export function GalleryGrid({ items }: { items: WebsiteGalleryItem[] }) {
  return <section aria-labelledby="gallery-collection-title" className="bg-white py-20 sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">Authentic PRISM moments</p>
      <h2 id="gallery-collection-title" className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-prism-navy sm:text-4xl lg:text-5xl">Learning, creativity and community</h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <figure key={item.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-prism-bg">
          <div className="relative aspect-[4/3] overflow-hidden"><Image src={item.image_url} alt={item.alt_text} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /></div>
          <figcaption className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-prism-navy">{item.title}</h3>{item.category && <span className="text-xs font-semibold uppercase tracking-wider text-prism-gold">{item.category}</span>}</div>{item.caption && <p className="mt-2 text-sm leading-6 text-slate-600">{item.caption}</p>}</figcaption>
        </figure>)}
      </div>
    </div>
  </section>;
}
