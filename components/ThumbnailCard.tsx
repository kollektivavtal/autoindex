export function ThumbnailImage({ src }: { src: string }) {
  return (
    <div className="aspect-[707/1000] w-24 shrink-0 overflow-hidden rounded-md bg-white shadow-md ring-1 ring-black/10 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-lg sm:w-40 dark:ring-white/50 dark:ring-offset-2 dark:ring-offset-[var(--color-background)]">
      <img alt="" className="h-full w-full object-cover" src={src} />
    </div>
  );
}

export type ThumbnailRowProps = {
  href: string;
  src: string;
  title: string;
  description?: string;
};

export function ThumbnailRow({ href, src, title, description }: ThumbnailRowProps) {
  return (
    <li className="group relative flex flex-col items-start gap-y-2 xxs:flex-row xxs:items-center xxs:gap-x-4 sm:gap-x-6">
      <ThumbnailImage src={src} />
      <span className="flex flex-col gap-y-1 font-lilex">
        <a
          href={href}
          className="section-heading font-bold text-link underline after:absolute after:inset-0 tracking-tighter break-all"
        >
          {title}
        </a>
        {description && (
          <span className="text-slate-500 dark:text-slate-300 body-text">
            {description}
          </span>
        )}
      </span>
    </li>
  );
}

export function ThumbnailRowList({ children }: { children: React.ReactNode }) {
  return <ol className="flex w-full flex-col gap-y-8">{children}</ol>;
}
