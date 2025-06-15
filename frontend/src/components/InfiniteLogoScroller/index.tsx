import Image from 'next/image';

import Netflix from '@/assets/logos/Netflix.png';
import Spotify from '@/assets/logos/Spotify.png';
import Microsoft from '@/assets/logos/Microsoft.png';
import Slack from '@/assets/logos/Slack.png';
import Google from '@/assets/logos/Google.png';
import Coinbase from '@/assets/logos/Coinbase.png';
import Airbnb from '@/assets/logos/Airbnb.png';
import Canva from '@/assets/logos/Canva.png';
import Tinder from '@/assets/logos/Tinder.png';
import Adobe from '@/assets/logos/Adobe.png';
import Framer from '@/assets/logos/Framer.png';
import Zoom from '@/assets/logos/Zoom.png';
import Twitch from '@/assets/logos/Twitch.png';

const logos = [
  { src: Netflix, alt: 'Netflix' },
  { src: Spotify, alt: 'Spotify' },
  { src: Microsoft, alt: 'Microsoft' },
  { src: Slack, alt: 'Slack' },
  { src: Google, alt: 'Google' },
  { src: Coinbase, alt: 'Coinbase' },
  { src: Airbnb, alt: 'Airbnb' },
  { src: Canva, alt: 'Canva' },
  { src: Tinder, alt: 'Tinder' },
  { src: Adobe, alt: 'Adobe' },
  { src: Framer, alt: 'Framer' },
  { src: Zoom, alt: 'Zoom' },
  { src: Twitch, alt: 'Twitch' },
];

export default function LogoWall() {
  const firstRow = logos.slice(0, 7);
  const secondRow = logos.slice(7);

  return (
    <div className="py-6 px-2">
      <div className="max-w-7xl mx-auto grid gap-y-3">
        {/* 第一行 */}
        <div className="grid grid-cols-7 gap-x-3 justify-items-center">
          {firstRow.map(({ src, alt }) => (
            <Image
              key={alt}
              src={src}
              alt={alt}
              className="grayscale hover:grayscale-0 cursor-pointer transition duration-300"
            />
          ))}
        </div>

        {/* 第二行 */}
        <div className="grid grid-cols-7 gap-x-3 justify-items-center translate-x-10">
          {secondRow.map(({ src, alt }) => (
            <Image
              key={alt}
              src={src}
              alt={alt}
              className="grayscale hover:grayscale-0 cursor-pointer transition duration-300"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
