import { useState, useEffect } from 'react';
/**
 * 获取当前设备的类型
 *
 * 根据用户的设备屏幕宽度判断设备类型，使用以下断点值：
 * - 'mobile': 移动端设备，屏幕宽度小于 `--breakpoint-tablet`（744px）
 * - 'tablet': 平板设备，屏幕宽度大于等于 `--breakpoint-tablet`（744px），小于 `--breakpoint-web`（1024px）
 * - 'web': 桌面设备，屏幕宽度大于等于 `--breakpoint-web`（1024px）
 *
 * @returns {string} 设备类型：'mobile' | 'tablet' | 'web'
 *
 * @example
 * const deviceType = getDeviceType();
 * console.log(deviceType); // 输出 'mobile', 'tablet' 或 'web'
 */

const useBreakpoint = () => {
  const [deviceType, setDeviceType] = useState('mobile'); // 默认设备类型为 mobile

  useEffect(() => {
    // 获取 CSS 中定义的断点值
    // const breakpointMobile = parseInt(
    //   getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-mobile'),
    // );
    const breakpointTablet = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-tablet'),
    );
    const breakpointWeb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-web'));

    // 判断当前设备的类型
    const checkBreakpoint = () => {
      const width = window.innerWidth; // 获取当前窗口宽度

      let newDeviceType = 'mobile';
      if (width >= breakpointWeb) {
        newDeviceType = 'web';
      } else if (width >= breakpointTablet) {
        newDeviceType = 'tablet';
      }

      // 只有当设备类型发生变化时才更新状态
      if (newDeviceType !== deviceType) {
        setDeviceType(newDeviceType);
      }
    };

    // 初始检查设备类型
    checkBreakpoint();

    // 窗口大小变化时重新检查设备类型
    const handleResize = () => checkBreakpoint();

    // 监听窗口尺寸变化
    window.addEventListener('resize', handleResize);

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [deviceType]);

  return deviceType; // 返回当前的设备类型
};

export default useBreakpoint;
