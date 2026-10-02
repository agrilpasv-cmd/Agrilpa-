import React from 'react';
import {interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CompanyView} from './CompanyView';
import {GeneratedNavbar} from '../GeneratedNavbar';
import {Frame, smooth} from './Frame';
import {demoProducts} from './demo';

export function CompanyScene() {
  const frame=useCurrentFrame();
  return <Frame path="/vendedor/finca-el-roble" step={4} panel={false} title="Un perfil que genera confianza." subtitle="Presenta tu empresa, tu catálogo y la información de tu negocio.">
    <GeneratedNavbar/>
    <div style={{translate:`0 ${interpolate(frame,[62,98],[0,-340],smooth)}px`}}>
      <CompanyView profile={{id:'demo-seller',full_name:'Carlos Mendoza',company_name:'Finca El Roble',country:'El Salvador',bio:'Somos productores de café de altura en Santa Ana. Cultivamos y seleccionamos nuestra cosecha para ofrecer productos de calidad a compradores locales e internacionales.',company_website:null,address:'Santa Ana, El Salvador',created_at:'2026-01-15T12:00:00Z',avatar_url:staticFile('finca-el-roble-logo.jpg'),is_pro:false,export_history:[]}} products={demoProducts.map(p=>({...p,currency:'USD',image:staticFile(p.videoImage),min_order:'100 kg',min_order_quantity:100,price_type:'fixed'}))}/>
    </div>
  </Frame>;
}
