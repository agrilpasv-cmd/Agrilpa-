import React from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {DashboardScene} from './control-center/DashboardScene';
import {PublicationsScene} from './control-center/PublicationsScene';
import {QuotationsScene} from './control-center/QuotationsScene';
import {MessagesScene} from './control-center/MessagesScene';
import {CompanyScene} from './control-center/CompanyScene';
import {SuppliersScene} from './control-center/SuppliersScene';

export function CodeControlCenter() {
  return <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={210}><DashboardScene/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:15})}/>
    <TransitionSeries.Sequence durationInFrames={165}><PublicationsScene/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:15})}/>
    <TransitionSeries.Sequence durationInFrames={150}><QuotationsScene/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:15})}/>
    <TransitionSeries.Sequence durationInFrames={165}><MessagesScene/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:15})}/>
    <TransitionSeries.Sequence durationInFrames={135}><CompanyScene/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:15})}/>
    <TransitionSeries.Sequence durationInFrames={150}><SuppliersScene/></TransitionSeries.Sequence>
  </TransitionSeries>;
}
