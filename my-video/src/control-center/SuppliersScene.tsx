import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {GeneratedNavbar} from '../GeneratedNavbar';
import {GeneratedCatalogView} from '../GeneratedCatalogView';
import {Frame, Pointer, Toast, smooth, typing} from './Frame';
import {demoProducts} from './demo';

export function SuppliersScene() {
  const frame=useCurrentFrame();
  const search=typing('Café',frame,18,35);
  const filters=frame>=44&&frame<88;
  return <Frame path="/productos" step={5} panel={false} title="Encuentra tu próximo aliado." subtitle="Busca productos y proveedores por categoría, origen y ubicación.">
    <GeneratedNavbar/>
    <GeneratedCatalogView userProducts={demoProducts} searchTerm={search} selectedCategory={frame>=42?'Café':'todos'} showFilters={filters} selectedCountry={frame>=72?'El Salvador':'todos'} activeField={frame<44?'search':filters?'country':''} contentOffset={interpolate(frame,[88,110],[0,-230],smooth)}/>
    {frame>=115&&<Toast text="Productos y empresas conectados en un solo lugar." from={115}/>}
    <Pointer points={[[0,750,340],[17,400,319],[42,160,380],[64,450,523],[85,450,523],[101,600,640],[145,600,640]]}/>
  </Frame>;
}
