export type QRCode = {
  value: string;
  renderAs?: 'canvas' | 'svg';
  size?: number;
  bgColor?: string | number;
  fgColor?: string | number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  imageSettings?: QRCodeImage;
};

export type QRCodeImage = {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  excavate?: boolean;
};
