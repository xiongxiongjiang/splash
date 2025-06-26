interface LandingPageBgProps {
  animationSpeed?: 'slow' | 'fast';
}

export default function LandingPageBg({ animationSpeed = 'slow' }: LandingPageBgProps) {
  const animationClass = animationSpeed === 'slow' ? 'hue-rotate-animation-slow' : 'hue-rotate-animation-fast';

  return (
    <>
      {/* 弥散渐变背景 */}
      <div className={`bg-gradient-mesh ${animationClass}`}>
        {/* <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div> */}
      </div>
      <div className="bg-gradient-mesh-top"></div>
    </>
  );
}
