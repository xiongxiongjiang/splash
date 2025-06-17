'use client';

import { useState } from 'react';

import Image from 'next/image';

// 静态导入所有 logo 的彩色和灰色图
import Adobe from '@/assets/logos/Adobe.png';
import AdobeGray from '@/assets/logos/Adobe_gray.png';
import Airbnb from '@/assets/logos/Airbnb.png';
import AirbnbGray from '@/assets/logos/Airbnb_gray.png';
import Canva from '@/assets/logos/Canva.png';
import CanvaGray from '@/assets/logos/Canva_gray.png';
import Coinbase from '@/assets/logos/Coinbase.png';
import CoinbaseGray from '@/assets/logos/Coinbase_gray.png';
import Descript from '@/assets/logos/Descript.png';
import DescriptGray from '@/assets/logos/Descript_gray.png';
import Framer from '@/assets/logos/Framer.png';
import FramerGray from '@/assets/logos/Framer_gray.png';
import GitHub from '@/assets/logos/GitHub.png';
import GitHubGray from '@/assets/logos/GitHub_gray.png';
import Google from '@/assets/logos/Google.png';
import GoogleGray from '@/assets/logos/Google_gray.png';
import Microsoft from '@/assets/logos/Microsoft.png';
import MicrosoftGray from '@/assets/logos/Microsoft_gray.png';
import Netflix from '@/assets/logos/Netflix.png';
import NetflixGray from '@/assets/logos/Netflix_gray.png';
import Slack from '@/assets/logos/Slack.png';
import SlackGray from '@/assets/logos/Slack_gray.png';
import Spotify from '@/assets/logos/Spotify.png';
import SpotifyGray from '@/assets/logos/Spotify_gray.png';
import Tinder from '@/assets/logos/Tinder.png';
import TinderGray from '@/assets/logos/Tinder_gray.png';
import Twitch from '@/assets/logos/Twitch.png';
import TwitchGray from '@/assets/logos/Twitch_gray.png';
import Zoom from '@/assets/logos/Zoom.png';
import ZoomGray from '@/assets/logos/Zoom_gray.png';

import type { StaticImageData } from 'next/image';

interface Logo {
  name: string;
  color: StaticImageData;
  gray: StaticImageData;
}

const logos: Logo[] = [
  { name: 'Netflix', color: Netflix, gray: NetflixGray },
  { name: 'Spotify', color: Spotify, gray: SpotifyGray },
  { name: 'Microsoft', color: Microsoft, gray: MicrosoftGray },
  { name: 'Slack', color: Slack, gray: SlackGray },
  { name: 'Google', color: Google, gray: GoogleGray },
  { name: 'Coinbase', color: Coinbase, gray: CoinbaseGray },
  { name: 'Descript', color: Descript, gray: DescriptGray },
  { name: 'Airbnb', color: Airbnb, gray: AirbnbGray },
  { name: 'Canva', color: Canva, gray: CanvaGray },
  { name: 'Tinder', color: Tinder, gray: TinderGray },
  { name: 'Adobe', color: Adobe, gray: AdobeGray },
  { name: 'Framer', color: Framer, gray: FramerGray },
  { name: 'Zoom', color: Zoom, gray: ZoomGray },
  { name: 'GitHub', color: GitHub, gray: GitHubGray },
  { name: 'Twitch', color: Twitch, gray: TwitchGray },
];

const IMG_WIDTH = 230;
const IMG_HEIGHT = 80;

function HoverLogo({ name, gray, color }: { name: string; gray: StaticImageData; color: StaticImageData }) {
  const [src, setSrc] = useState<StaticImageData>(gray);

  return (
    <Image
      src={src}
      alt={`${name} logo`}
      width={IMG_WIDTH}
      height={IMG_HEIGHT}
      onMouseEnter={() => setSrc(color)}
      onMouseLeave={() => setSrc(gray)}
      className="cursor-pointer transition duration-300"
    />
  );
}

export default function LogoWall() {
  const firstRow = logos.slice(0, 7);
  const secondRow = logos.slice(7);

  return (
    <div className="py-6 z-10 overflow-hidden">
      {/* 第一行 */}
      <p className="inline-flex gap-x-8 translate-x-[50px]">
        {firstRow.map((logo) => (
          <HoverLogo key={logo.name} {...logo} />
        ))}
      </p>

      {/* 第二行 */}
      <p className="inline-flex gap-x-[0.5px] translate-x-[-80px] mt-4">
        {secondRow.map((logo) => (
          <HoverLogo key={logo.name} {...logo} />
        ))}
      </p>
    </div>
  );
}
