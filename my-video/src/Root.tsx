import React from 'react';
import { Composition } from 'remotion';
import './agrilpa-video.css';
import { CodeRegistration } from './CodeRegistration';
import { CodeProductPublishing } from './CodeProductPublishing';
import { CodeCatalogSearch } from './CodeCatalogSearch';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="AgrilpaMacRegistration" component={CodeRegistration} durationInFrames={600} fps={30} width={1920} height={1440}/>
      <Composition id="AgrilpaMacProductPublishing" component={CodeProductPublishing} durationInFrames={600} fps={30} width={1920} height={1440}/>
      <Composition id="AgrilpaMacCatalogSearch" component={CodeCatalogSearch} durationInFrames={600} fps={30} width={1920} height={1440}/>
    </>
  );
};
