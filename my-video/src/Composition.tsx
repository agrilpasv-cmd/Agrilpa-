import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { Background } from './components/Background';
import { RealScreenSlide } from './components/RealScreenSlide';

export const AgrilpaExplainerVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#021810', overflow: 'hidden' }}>
      {/* Dynamic Agricultural Ambient Background */}
      <Background />

      {/* SCENE 1: Real Homepage & Hero (0s - 2.5s | frames 0 - 75) */}
      <Sequence from={0} durationInFrames={75} name="01-Inicio-Agrilpa">
        <RealScreenSlide
          imageSrc="screens/agrilpa_homepage_hero_1790270732121.png"
          badgeText="PASO 01 • PLATAFORMA EN VIVO"
          title="Conecta el Campo con el Mundo"
          subtitle="Comercio agrícola B2B directo sin intermediarios"
          panY={-60}
          zoom={1.02}
          cursorX={24}
          cursorY={38}
        />
      </Sequence>

      {/* SCENE 2: Real 'Cómo Funciona' Guide (2.4s - 5.0s | frames 70 - 150) */}
      <Sequence from={70} durationInFrames={80} name="02-Como-Funciona">
        <RealScreenSlide
          imageSrc="screens/agrilpa_como_funciona_hero_1790270822685.png"
          badgeText="PASO 02 • CÓMO FUNCIONA"
          title="Simple para Vendedores y Compradores"
          subtitle="Publica tu cosecha, solicita cotizaciones y acuerda entregas"
          panY={-120}
          zoom={1.03}
        />
      </Sequence>

      {/* SCENE 3: Real Product Details & Cotización (4.9s - 7.5s | frames 145 - 225) */}
      <Sequence from={145} durationInFrames={80} name="03-Catalogo-Cotizacion">
        <RealScreenSlide
          imageSrc="screens/agrilpa_product_detail_1790270985911.png"
          badgeText="PASO 03 • COTIZACIÓN DIRECTA"
          title="Ficha Técnica y Negociación en Tiempo Real"
          subtitle="Transparencia en volúmenes, certificaciones e Incoterms"
          panY={-40}
          zoom={1.04}
          cursorX={52}
          cursorY={42}
          clickFrame={35}
        />
      </Sequence>

      {/* SCENE 4: Real Registration & Call To Action (7.4s - 10.0s | frames 220 - 300) */}
      <Sequence from={220} durationInFrames={80} name="04-Registro-CTA">
        <RealScreenSlide
          imageSrc="screens/agrilpa_register_form_1790271130337.png"
          badgeText="PASO 04 • CREA TU CUENTA"
          title="¡Comienza Hoy en agrilpa.com!"
          subtitle="Regístrate gratis y expande tus ventas agrícolas"
          panY={-60}
          zoom={1.02}
          cursorX={70}
          cursorY={65}
          clickFrame={40}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
