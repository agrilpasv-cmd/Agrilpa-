import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MousePointer2,
  Plus,
  Share,
} from 'lucide-react';
import {GeneratedDashboardShell} from './GeneratedDashboardShell';
import {QuotationView} from './control-center/QuotationView';
import './control-center/control-center.css';

export const CodeBuyAndAgree: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <div
        className="cc-root"
        style={{
          width: 1280,
          height: 960,
          transformOrigin: '0 0',
          scale: 1.5,
          position: 'absolute',
        }}
      >
        <div
          style={{
            height: 64,
            background: 'linear-gradient(#f2f3f4,#e5e7e9)',
            color: '#45484b',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 22px',
            borderBottom: '1px solid #cdd1d5',
          }}
        >
          {['#ff5f57', '#ffbd2e', '#28c840'].map((color) => (
            <span
              key={color}
              style={{
                width: 14,
                height: 14,
                background: color,
                borderRadius: '50%',
              }}
            />
          ))}
          <ArrowLeft size={20} style={{marginLeft: 26, color: '#777'}} />
          <ChevronRight size={20} style={{color: '#aaa'}} />
          <div
            style={{
              margin: '0 auto',
              width: 620,
              height: 34,
              borderRadius: 8,
              background: '#d9dde1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              fontSize: 14,
            }}
          >
            <LockKeyhole size={13} />
            agrilpa.com/dashboard/cotizaciones/COT-849201
          </div>
          <span style={{fontSize: 11, color: '#6b7177', marginRight: 14}}>
            Demostración
          </span>
          <Share size={19} />
          <Plus size={21} style={{marginLeft: 10}} />
        </div>

        <div style={{position: 'relative', height: 896, overflow: 'hidden'}}>
          <GeneratedDashboardShell activeHref="/dashboard/compras">
            <QuotationView
              data={{
                viewer: 'buyer',
                orderId: 'ORD-849201',
                counterpart: {
                  id: 'finca-el-roble',
                  company_name: 'Finca El Roble S.A. de C.V.',
                  avatar_url: staticFile('cafe-premium-salvadoreno.jpg'),
                  country: 'El Salvador · Productor verificado',
                },
                quotation: {
                  id: 'COT849201',
                  product_id: 'cafe-especialidad-oro-verde',
                  product_title: 'Café de especialidad Oro-Verde (Lote Altura)',
                  product_image: staticFile('cafe-premium-salvadoreno.jpg'),
                  buyer_id: 'demo-buyer',
                  buyer_name: 'Agroindustrias Pacífico',
                  quantity: 1000,
                  quantity_unit: 'kg',
                  status: 'accepted',
                  created_at: '2026-10-31T14:20:00Z',
                  destination_country: 'El Salvador',
                  destination_location: 'San Salvador, Bodega Central',
                  delivery_method: 'delivery',
                  estimated_date: '2026-11-15',
                  purchase_frequency: 'monthly',
                  incoterm: 'DDP · Puesto en bodega del comprador',
                  target_price: 6.5,
                  agreed_unit_price: 6.0,
                  currency: 'USD',
                  agreed_currency: 'USD',
                  notes:
                    'Acuerdo cerrado: 40 sacos de 25 kg con bolsa GrainPro, certificado de calidad SCA 86 pts y entrega directa en planta.',
                } as any,
              }}
            />
          </GeneratedDashboardShell>

          <div
            style={{
              position: 'absolute',
              top: 96,
              right: 32,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 10,
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)',
            }}
          >
            <CheckCircle2 size={16} />
            <span>
              Acuerdo confirmado · Pedido #ORD-849201 creado por $6,000.00 USD
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 1068,
              top: 726,
              zIndex: 60,
              pointerEvents: 'none',
              color: '#fff',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
            }}
          >
            <MousePointer2 size={24} strokeWidth={1.5} fill="#151719" />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

