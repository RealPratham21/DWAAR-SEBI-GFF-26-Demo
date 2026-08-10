import Image from 'next/image';
import Link from 'next/link';

const EVENT_LOGOS = [
  {
    src: '/images/event-logos/sebi-logo-scores.jpg',
    alt: 'Securities and Exchange Board of India (SEBI)',
    href: 'https://www.sebi.gov.in/',
    width: 148,
    height: 44,
    imageClassName: 'h-8 w-auto max-w-[148px] object-contain object-left',
    containerClassName: '',
  },
  {
    src: '/images/event-logos/gff-2026-logo-light.png',
    alt: 'Global Fintech Fest 2026',
    href: 'https://globalfintechfest.com/',
    width: 112,
    height: 63,
    imageClassName: 'h-7 w-auto max-w-[112px] object-contain object-left',
    containerClassName: '',
  },
] as const;

export function LandingEventLogoStrip() {
  return (
    <div
      className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3"
      aria-label="SEBI and Global Fintech Fest 2026 event context"
    >
      {EVENT_LOGOS.map((logo) => (
        <Link
          key={logo.src}
          href={logo.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex shrink-0 items-center ${logo.containerClassName}`}
          aria-label={logo.alt}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={logo.imageClassName}
            priority
          />
        </Link>
      ))}
    </div>
  );
}
