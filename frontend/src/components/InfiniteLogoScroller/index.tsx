'use client';

import { useState } from 'react';

import Image from 'next/image';

// 静态导入所有 logo 的彩色和灰色图
import Adobe from '@/assets/logos/Adobe.svg';
import AdobeGray from '@/assets/logos/Adobe_gray.svg';
import Airbnb from '@/assets/logos/Airbnb.svg';
import AirbnbGray from '@/assets/logos/Airbnb_gray.svg';
import Canva from '@/assets/logos/Canva.svg';
import CanvaGray from '@/assets/logos/Canva_gray.svg';
import Coinbase from '@/assets/logos/Coinbase.svg';
import CoinbaseGray from '@/assets/logos/Coinbase_gray.svg';
import Descript from '@/assets/logos/Descript.svg';
import DescriptGray from '@/assets/logos/Descript_gray.svg';
import Framer from '@/assets/logos/Framer.svg';
import FramerGray from '@/assets/logos/Framer_gray.svg';
import GitHub from '@/assets/logos/GitHub.svg';
import GitHubGray from '@/assets/logos/GitHub_gray.svg';
import Google from '@/assets/logos/Google.svg';
import GoogleGray from '@/assets/logos/Google_gray.svg';
import Microsoft from '@/assets/logos/Microsoft.svg';
import MicrosoftGray from '@/assets/logos/Microsoft_gray.svg';
import Netflix from '@/assets/logos/Netflix.svg';
import NetflixGray from '@/assets/logos/Netflix_gray.svg';
import Slack from '@/assets/logos/Slack.svg';
import SlackGray from '@/assets/logos/Slack_gray.svg';
import Spotify from '@/assets/logos/Spotify.svg';
import SpotifyGray from '@/assets/logos/Spotify_gray.svg';
import Tinder from '@/assets/logos/Tinder.svg';
import TinderGray from '@/assets/logos/Tinder_gray.svg';
import Twitch from '@/assets/logos/Twitch.svg';
import TwitchGray from '@/assets/logos/Twitch_gray.svg';
import Zoom from '@/assets/logos/Zoom.svg';
import ZoomGray from '@/assets/logos/Zoom_gray.svg';

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


function HoverLogo({ name, gray, color }: { name: string; gray: StaticImageData; color: StaticImageData }) {
  const [src, setSrc] = useState<StaticImageData>(gray);

  return (
    <Image
      src={src}
      alt={`${name} logo`}
      onMouseEnter={() => setSrc(color)}
      onMouseLeave={() => setSrc(gray)}
      className="cursor-pointer transition duration-300 w-[100px] md:w-[190px]"
    />
  );
}

export default function LogoWall() {
  const firstRow = logos.slice(0, 7);
  const secondRow = logos.slice(7);

  return (
    <div className="py-2 z-10 overflow-hidden">
      {/* 第一行 */}
      <p className="w-full justify-between flex translate-x-[25px] md:translate-x-[50px]">
        {firstRow.map((logo) => (
          <HoverLogo key={logo.name} {...logo} />
        ))}
      </p>

      {/* 第二行 */}
      <p className="w-full justify-between flex translate-x-[25px] md:translate-x-[-50px]">
        {secondRow.map((logo) => (
          <HoverLogo key={logo.name} {...logo} />
        ))}
      </p>
    </div>
  );
}
