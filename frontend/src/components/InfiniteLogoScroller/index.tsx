'use client';

import Image from 'next/image';

// 静态导入所有 logo 的灰色图
import styles from './index.module.scss';

import AdobeGray from '@/assets/logos/Adobe_gray.svg';
import AirbnbGray from '@/assets/logos/Airbnb_gray.svg';
import CanvaGray from '@/assets/logos/Canva_gray.svg';
import CoinbaseGray from '@/assets/logos/Coinbase_gray.svg';
import DescriptGray from '@/assets/logos/Descript_gray.svg';
import FramerGray from '@/assets/logos/Framer_gray.svg';
import GitHubGray from '@/assets/logos/GitHub_gray.svg';
import GoogleGray from '@/assets/logos/Google_gray.svg';
import MazeGray from '@/assets/logos/Maze_gray.svg';
import MediumGray from '@/assets/logos/Medium_gray.svg';
import MicrosoftGray from '@/assets/logos/Microsoft_gray.svg';
import NetflixGray from '@/assets/logos/Netflix_gray.svg';
import PendoGray from '@/assets/logos/Pendo_gray.svg';
import SlackGray from '@/assets/logos/Slack_gray.svg';
import SpotifyGray from '@/assets/logos/Spotify_gray.svg';
import TelloGray from '@/assets/logos/Tello_gray.svg';
import TinderGray from '@/assets/logos/Tinder_gray.svg';
import TwitchGray from '@/assets/logos/Twitch_gray.svg';
import ZoomGray from '@/assets/logos/Zoom_gray.svg';

import type { StaticImageData } from 'next/image';

interface Logo {
  name: string;
  gray: StaticImageData;
}

const logos: Logo[] = [
  { name: 'Netflix', gray: NetflixGray },
  { name: 'Spotify', gray: SpotifyGray },
  { name: 'Microsoft', gray: MicrosoftGray },
  { name: 'Slack', gray: SlackGray },
  { name: 'Google', gray: GoogleGray },
  { name: 'Coinbase', gray: CoinbaseGray },
  { name: 'Airbnb', gray: AirbnbGray },
  { name: 'Descript', gray: DescriptGray },
  { name: 'Medium', gray: MediumGray },
  { name: 'Pendo', gray: PendoGray },
  { name: 'Canva', gray: CanvaGray },
  { name: 'Tinder', gray: TinderGray },
  { name: 'Adobe', gray: AdobeGray },
  { name: 'Framer', gray: FramerGray },
  { name: 'Zoom', gray: ZoomGray },
  { name: 'GitHub', gray: GitHubGray },
  { name: 'Twitch', gray: TwitchGray },
  { name: 'Tello', gray: TelloGray },
  { name: 'Maze', gray: MazeGray },
  { name: 'Airbnb', gray: AirbnbGray },
];

function LogoImage({ name, gray }: { name: string; gray: StaticImageData }) {
  return <Image src={gray} alt={`${name} logo`} className="w-[125px] web:w-[160px]" loading="lazy" />;
}

export default function InfiniteLogoScroller() {
  // 平均分成两组
  const mid = Math.ceil(logos.length / 2);
  const firstRow = logos.slice(0, mid);
  const secondRow = logos.slice(mid);
  // 每行都拼接两遍实现无缝滚动
  const firstRowList = [...firstRow, ...firstRow];
  const secondRowList = [...secondRow, ...secondRow];

  return (
    <div className={styles.scrollerContainer}>
      <div className={styles.scroller}>
        <div className={`${styles.scrollerInner} mobile:!gap-0 tablet:!gap-[2em]`}>
          {firstRowList.map((logo, idx) => (
            <LogoImage key={logo.name + idx + 'row1'} gray={logo.gray} name={`${logo.name} logo`} />
          ))}
          <div className="w-[65px] web:w-[80px]"></div>
        </div>
        <div className={`${styles.scrollerInner} mobile:!gap-0 tablet:!gap-[2em]`}>
          <div className="w-[65px] web:w-[80px]"></div>
          {secondRowList.map((logo, idx) => (
            <LogoImage key={logo.name + idx + 'row2'} gray={logo.gray} name={`${logo.name} logo`} />
          ))}
        </div>
      </div>
    </div>
  );
}
