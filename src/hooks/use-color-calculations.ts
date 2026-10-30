export function useColorCalculations() {

  const randomFromInterval = (min: number, max: number): number => 
    Math.random() * (max - min) + min;

  const getRandomColors = (): string[] => {
    const randomHue = randomFromInterval(0, 360);
    const randomSaturation = randomFromInterval(40, 60);
    const randomLightness = randomFromInterval(30, 70);

    return [
      `hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`,
      `hsl(${(randomHue + 180) % 360}, ${randomSaturation}%, ${randomLightness}%)`,
    ];
  };

  const hexToHSLDict = (hex: string) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / delta) % 6;
          break;
        case g:
          h = (b - r) / delta + 2;
          break;
        case b:
          h = (r - g) / delta + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: s, l: l };
  };

  const hslStringToDict = (hslStr: string) => {
    const matches = hslStr.match(/[\d.]+/g);
    if (!matches || matches.length < 3) return { h: 0, s: 0, l: 0 };
    return {
      h: parseFloat(matches[0]),
      s: parseFloat(matches[1]) / 100,
      l: parseFloat(matches[2]) / 100,
    };
  };

  const hueDiff = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360;
    const circular = d > 180 ? 360 - d : d;
    return circular / 180; // 0 = ten sam hue, 1 = przeciwległy
  };
  
  const compareHexAndHsl = (hex: string, hsl: string, 
    W_HUE: number, W_LIGHT: number, W_SAT: number): number => {
    const a = hexToHSLDict(hex);
    const b = hslStringToDict(hsl);
  
    const dh = hueDiff(a.h, b.h);
    const dl = Math.abs(a.l - b.l);
    const ds = Math.abs(a.s - b.s);
    return W_HUE * dh + W_LIGHT * dl + W_SAT * ds;
  };

  return { getRandomColors, compareHexAndHsl };
}
