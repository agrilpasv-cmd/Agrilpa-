import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MousePointer2,
  Plus,
  Share,
} from 'lucide-react';
import {
  CommercePage,
  FilterTabs,
  Metrics,
  SearchField,
  StatusBadge,
  commerceStyles as s,
} from '@/components/dashboard/commerce-ui';
import {GeneratedDashboardShell} from './GeneratedDashboardShell';
import './control-center/control-center.css';

const DEMO_QUOTATIONS = [
  {
    id: 'COT-849201',
    title: 'Café de altura salvadoreño',
    image: 'cafe-premium-salvadoreno.jpg',
    quantity: '1,000 kg · $6.50 USD / kg',
    received: 'Recibida hace 5 min',
    buyer: 'Agroindustrias Pacífico',
    channel: 'Mensajería Agrilpa',
    country: 'El Salvador, San Salvador',
    delivery: 'Entrega: 15 nov. 2026',
    status: 'Pendiente',
    tone: 'amber' as const,
    unread: true,
  },
  {
    id: 'COT-848914',
    title: 'Cacao en grano fermentado',
    image: 'cacao-grano-fermentado-chocolate.jpg',
    quantity: '500 kg · $4.80 USD / kg',
    received: 'Recibida hoy',
    buyer: 'Cooperativa Los Andes',
    channel: 'Mensajería Agrilpa',
    country: 'Guatemala, Escuintla',
    delivery: 'Entrega: 22 nov. 2026',
    status: 'Pendiente',
    tone: 'amber' as const,
    unread: true,
  },
  {
    id: 'COT-847302',
    title: 'Café arábica grano tostado',
    image: 'cafe-arabica-grano-tostado.jpg',
    quantity: '2,500 kg · $7.20 USD / kg',
    received: 'Recibida el 28 oct. 2026',
    buyer: 'Importadora Centroamericana',
    channel: 'Mensajería Agrilpa',
    country: 'Costa Rica, San José',
    delivery: 'Entrega: 05 dic. 2026',
    status: 'Aceptada',
    tone: 'green' as const,
    unread: false,
  },
];

export const CodeQuotations: React.FC = () => {
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
            agrilpa.com/dashboard/cotizaciones
          </div>
          <span style={{fontSize: 11, color: '#6b7177', marginRight: 14}}>
            Demostración
          </span>
          <Share size={19} />
          <Plus size={21} style={{marginLeft: 10}} />
        </div>

        <div style={{position: 'relative', height: 896, overflow: 'hidden'}}>
          <GeneratedDashboardShell
            activeHref="/dashboard/cotizaciones"
            cotizacionesCount={2}
          >
            <CommercePage
              title="Cotizaciones"
              description="Revisa las solicitudes de tus compradores y convierte el interés en negocios."
            >
              <Metrics
                items={[
                  {
                    label: 'Solicitudes recibidas',
                    value: 6,
                    hint: 'Todas tus cotizaciones',
                    active: true,
                    onClick: () => {},
                  },
                  {
                    label: 'Pendientes',
                    value: 2,
                    hint: 'Por revisar y responder',
                    active: false,
                    onClick: () => {},
                  },
                  {
                    label: 'Aceptadas',
                    value: 4,
                    hint: 'Solicitudes aprobadas',
                    active: false,
                    onClick: () => {},
                  },
                  {
                    label: 'Rechazadas',
                    value: 0,
                    hint: 'Solicitudes descartadas',
                    active: false,
                    onClick: () => {},
                  },
                ]}
              />

              <div className={s.section}>
                <div className={s.sectionHead}>
                  <div className={s.sectionTitle}>
                    <h2>Solicitudes de compradores</h2>
                    <span>6</span>
                  </div>
                  <div className={s.toolbar}>
                    <SearchField
                      value=""
                      onChange={() => {}}
                      placeholder="Buscar producto, comprador o destino"
                    />
                    <span className={s.resultCount}>3 de 6 solicitudes</span>
                  </div>
                  <FilterTabs
                    value="all"
                    onChange={() => {}}
                    options={[
                      {value: 'all', label: 'Todas', count: 6},
                      {value: 'pending', label: 'Pendientes', count: 2},
                      {value: 'accepted', label: 'Aceptadas', count: 4},
                      {value: 'rejected', label: 'Rechazadas', count: 0},
                    ]}
                  />
                </div>

                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Producto / cantidad</th>
                      <th>Comprador</th>
                      <th>Destino / entrega</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_QUOTATIONS.map((q, idx) => (
                      <tr
                        key={q.id}
                        style={
                          idx === 0
                            ? {
                                background:
                                  'color-mix(in srgb, var(--muted) 42%, var(--background))',
                              }
                            : undefined
                        }
                      >
                        <td>
                          <div className={s.productCell}>
                            <div
                              className={s.productThumb}
                              style={
                                idx === 0
                                  ? {background: 'var(--background)'}
                                  : undefined
                              }
                            >
                              <Img src={staticFile(q.image)} />
                            </div>
                            <div>
                              <span className={s.cellTitle}>{q.title}</span>
                              <span className={s.cellMeta}>{q.quantity}</span>
                              <span className={s.cellMeta}>{q.received}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={s.cellTitle}>{q.buyer}</span>
                          <span className={s.cellIconLine}>
                            <MessageCircle size={13} />
                            {q.channel}
                          </span>
                        </td>
                        <td>
                          <span className={s.cellIconLine}>
                            <MapPin size={13} />
                            {q.country}
                          </span>
                          <span className={s.cellMeta}>{q.delivery}</span>
                        </td>
                        <td>
                          <StatusBadge tone={q.tone}>{q.status}</StatusBadge>
                        </td>
                        <td>
                          <div className={s.cellActions}>
                            <button type="button" className={s.iconButton}>
                              <MessageCircle size={17} />
                            </button>
                            <button type="button" className={s.iconButton}>
                              <ArrowUpRight size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CommercePage>
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
            <Bell size={16} />
            <span>Nueva cotización recibida · 1,000 kg de Café de altura</span>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 1188,
              top: 742,
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

