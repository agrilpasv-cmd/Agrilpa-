import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MousePointer2,
  Plus,
  Share,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import {
  CommercePage,
  DetailLabel,
  FilterTabs,
  Metrics,
  SearchField,
  StatusBadge,
  commerceStyles as s,
} from '@/components/dashboard/commerce-ui';
import {GeneratedDashboardShell} from './GeneratedDashboardShell';
import './control-center/control-center.css';

const DEMO_SALES = [
  {
    id: 'ORD-849201',
    title: 'Café de altura salvadoreño',
    image: 'cafe-premium-salvadoreno.jpg',
    quantity: '1,000 kg · 40 sacos GrainPro de 25 kg',
    buyer: 'Agroindustrias Pacífico',
    location: 'San Salvador, El Salvador',
    status: 'En tránsito',
    tone: 'blue' as const,
    amount: '$6,500.00',
    date: 'Entrega: 15 nov. 2026',
    isNew: true,
  },
  {
    id: 'ORD-847302',
    title: 'Café arábica grano tostado',
    image: 'cafe-arabica-grano-tostado.jpg',
    quantity: '2,500 kg · Lote exportación',
    buyer: 'Importadora Centroamericana',
    location: 'San José, Costa Rica',
    status: 'Entregado',
    tone: 'green' as const,
    amount: '$18,000.00',
    date: 'Entregado el 28 oct. 2026',
    isNew: false,
  },
  {
    id: 'ORD-846119',
    title: 'Cacao en grano fermentado',
    image: 'cacao-grano-fermentado-chocolate.jpg',
    quantity: '500 kg · Sacos de yute',
    buyer: 'Cooperativa Los Andes',
    location: 'Escuintla, Guatemala',
    status: 'Entregado',
    tone: 'green' as const,
    amount: '$2,400.00',
    date: 'Entregado el 19 oct. 2026',
    isNew: false,
  },
];

export const CodeSellAndDeliver: React.FC = () => {
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
            agrilpa.com/dashboard/ventas
          </div>
          <span style={{fontSize: 11, color: '#6b7177', marginRight: 14}}>
            Demostración
          </span>
          <Share size={19} />
          <Plus size={21} style={{marginLeft: 10}} />
        </div>

        <div style={{position: 'relative', height: 896, overflow: 'hidden'}}>
          <GeneratedDashboardShell activeHref="/dashboard/ventas">
            <CommercePage
              title="Mis ventas"
              description="Gestiona tus pedidos y da seguimiento a cada entrega directamente con el comprador."
              action={
                <button type="button" className={s.secondaryButton}>
                  <CheckCheck size={17} />
                  Marcar como vistos
                </button>
              }
            >
              <Metrics
                items={[
                  {
                    label: 'Pedidos recibidos',
                    value: 8,
                    hint: 'Historial de operaciones',
                    active: true,
                    onClick: () => {},
                  },
                  {
                    label: 'En preparación',
                    value: 1,
                    hint: 'Pendientes de despacho',
                    active: false,
                    onClick: () => {},
                  },
                  {
                    label: 'En tránsito',
                    value: 2,
                    hint: 'En camino a su destino',
                    active: false,
                    onClick: () => {},
                  },
                  {
                    label: 'Entregados',
                    value: 5,
                    hint: 'Operaciones completadas',
                    active: false,
                    onClick: () => {},
                  },
                ]}
              />

              <div className={s.section}>
                <div className={s.sectionHead}>
                  <div className={s.sectionTitle}>
                    <h2>Tus pedidos de venta</h2>
                    <span>8</span>
                  </div>
                  <div className={s.toolbar}>
                    <SearchField
                      value=""
                      onChange={() => {}}
                      placeholder="Buscar producto, comprador o pedido"
                    />
                    <button type="button" className={s.secondaryButton}>
                      <SlidersHorizontal size={16} />
                      Fechas
                    </button>
                    <span className={s.resultCount}>3 de 8 pedidos</span>
                  </div>
                  <FilterTabs
                    value="all"
                    onChange={() => {}}
                    options={[
                      {value: 'all', label: 'Todos', count: 8},
                      {value: 'preparation', label: 'En preparación', count: 1},
                      {value: 'transit', label: 'En tránsito', count: 2},
                      {value: 'delivered', label: 'Entregados', count: 5},
                    ]}
                  />
                </div>

                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Producto / pedido</th>
                      <th>Comprador / destino</th>
                      <th>Estado</th>
                      <th>Importe / entrega</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_SALES.map((order, idx) => (
                      <tr
                        key={order.id}
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
                              <Img src={staticFile(order.image)} />
                            </div>
                            <div>
                              <span className={s.cellTitle}>{order.title}</span>
                              <span className={s.cellMeta}>
                                #{order.id}
                                {order.isNew && (
                                  <span className={s.newLabel}>Despachado</span>
                                )}
                              </span>
                              <span className={s.cellMeta}>
                                {order.quantity}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={s.cellTitle}>{order.buyer}</span>
                          <span className={s.cellIconLine}>
                            <MapPin size={13} />
                            {order.location}
                          </span>
                        </td>
                        <td>
                          <StatusBadge tone={order.tone}>
                            {order.status}
                          </StatusBadge>
                        </td>
                        <td>
                          <strong className={s.money}>{order.amount}</strong>
                          <span className={s.cellMeta}>{order.date}</span>
                        </td>
                        <td>
                          <span className={s.detailLink}>
                            <DetailLabel />
                          </span>
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
            <Truck size={16} />
            <span>
              Despacho confirmado · #ORD-849201 rumbo a San Salvador
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 1172,
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

