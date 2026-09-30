import React from 'react';
import {Img, staticFile} from 'remotion';

export function Link({children, ...props}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props}>{children}</a>;
}

export function Image({src, width, height, ...props}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <Img {...props} src={staticFile(String(src).replace(/^\//, ''))} width={width} height={height}/>;
}

export function ProductImage({src,alt,className='',containerClassName=''}:{src:string;alt:string;className?:string;containerClassName?:string;priority?:boolean}) {
  return <div className={`relative w-full h-full ${containerClassName}`}>
    <Img src={src} alt={alt} className={`w-full h-full ${className}`}/>
  </div>;
}
