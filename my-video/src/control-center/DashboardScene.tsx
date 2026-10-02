import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {DashboardContent} from './DashboardView';
import {demoOverview} from './demo';
import {Frame, smooth} from './Frame';

export function DashboardScene() {
  const frame=useCurrentFrame();
  const progress=interpolate(frame,[8,58],[.05,1],smooth);
  const data={...demoOverview,views:{...demoOverview.views,seller:{...demoOverview.views.seller,
    metrics:demoOverview.views.seller.metrics.map(m=>({...m,value:m.value===null?null:Math.round(m.value*progress)})),
    money:{...demoOverview.views.seller.money,current:{USD:Math.round((demoOverview.views.seller.money.current.USD||0)*progress)}},
  }}};
  return <Frame path="/dashboard" step={0} title="Tu negocio, de un vistazo." subtitle="Métricas, actividad y pedidos. Compara tus resultados por período.">
    <div style={{translate:`0 ${interpolate(frame,[76,112],[0,-675],smooth)}px`,'--chart-reveal':`${interpolate(frame,[104,153],[0,100],smooth)}%`,'--pie-opacity':interpolate(frame,[115,140],[0,1],smooth)} as React.CSSProperties}>
      <DashboardContent data={data} days={30} endDate="2026-09-30" onDaysChange={()=>{}} onEndDateChange={()=>{}} onRefresh={()=>{}}/>
    </div>
  </Frame>;
}
