import React from 'react';
import { Composition, Folder } from 'remotion';
import './agrilpa-video.css';
import { CodeRegistration } from './CodeRegistration';
import { CodeProductPublishing } from './CodeProductPublishing';
import { CodeCatalogSearch } from './CodeCatalogSearch';
import {CodeControlCenter} from './CodeControlCenter';
import {DashboardScene} from './control-center/DashboardScene';
import {PublicationsScene} from './control-center/PublicationsScene';
import {QuotationsScene} from './control-center/QuotationsScene';
import {MessagesScene} from './control-center/MessagesScene';
import {CompanyScene} from './control-center/CompanyScene';
import {SuppliersScene} from './control-center/SuppliersScene';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="AgrilpaControlCenter" component={CodeControlCenter} durationInFrames={900} fps={30} width={1920} height={1440}/>
      <Folder name="Centro-de-control">
        <Composition id="Control-Dashboard" component={DashboardScene} durationInFrames={210} fps={30} width={1920} height={1440}/>
        <Composition id="Control-Publicaciones" component={PublicationsScene} durationInFrames={165} fps={30} width={1920} height={1440}/>
        <Composition id="Control-Cotizaciones" component={QuotationsScene} durationInFrames={150} fps={30} width={1920} height={1440}/>
        <Composition id="Control-Mensajes" component={MessagesScene} durationInFrames={165} fps={30} width={1920} height={1440}/>
        <Composition id="Control-Empresa" component={CompanyScene} durationInFrames={135} fps={30} width={1920} height={1440}/>
        <Composition id="Control-Proveedores" component={SuppliersScene} durationInFrames={150} fps={30} width={1920} height={1440}/>
      </Folder>
      <Composition id="AgrilpaMacRegistration" component={CodeRegistration} durationInFrames={600} fps={30} width={1920} height={1440}/>
      <Composition id="AgrilpaMacProductPublishing" component={CodeProductPublishing} durationInFrames={600} fps={30} width={1920} height={1440}/>
      <Composition id="AgrilpaMacCatalogSearch" component={CodeCatalogSearch} durationInFrames={600} fps={30} width={1920} height={1440}/>
    </>
  );
};
