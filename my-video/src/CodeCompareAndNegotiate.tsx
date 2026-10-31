import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Globe,
  Headphones,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  Package,
  Paperclip,
  Plus,
  Search,
  Share,
  X,
} from 'lucide-react';
import {GeneratedDashboardShell} from './GeneratedDashboardShell';
import {
  CommercePage,
  FilterTabs,
  Metrics,
  SearchField,
  StatusBadge,
  commerceStyles as cs,
} from '@/components/dashboard/commerce-ui';
import {QuotationView} from './control-center/QuotationView';
import chatStyles from '@/components/chat/chat-workspace.module.css';
import './control-center/control-center.css';

const smooth = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

const typing = (text: string, frame: number, start: number, end: number) =>
  text.slice(
    0,
    Math.floor(
      interpolate(frame, [start, end], [0, text.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );

const QUOTATIONS_ROWS = [
  {
    id: 'COT-849201',
    product: 'Café de especialidad Oro-Verde',
    quantity: '1,000 kg · $6.20 USD / kg',
    received: 'Recibida hoy',
    supplier: 'Finca El Roble',
    country: 'El Salvador · Chalatenango',
    delivery: '10 oct. 2026 · Envío a destino',
    status: 'Por responder',
    tone: 'amber' as const,
    image: 'cafe-premium-salvadoreno.jpg',
    avatar: 'finca-el-roble-logo.jpg',
  },
  {
    id: 'COT-849198',
    product: 'Café Arábica Estricta Altura',
    quantity: '1,000 kg · $6.55 USD / kg',
    received: 'Recibida hoy',
    supplier: 'Cooperativa Los Andes',
    country: 'Guatemala · Antigua',
    delivery: '14 oct. 2026 · FOB Frontera',
    status: 'Por responder',
    tone: 'amber' as const,
    image: 'cafe-arabica-grano-tostado.jpg',
    avatar: 'cooperativa-los-andes-logo.jpg',
  },
  {
    id: 'COT-849190',
    product: 'Café Lavado Exportación',
    quantity: '1,000 kg · $6.45 USD / kg',
    received: 'Recibida ayer',
    supplier: 'Tropical Exports',
    country: 'Honduras · Marcala',
    delivery: '12 oct. 2026 · Ex-Planta',
    status: 'Aceptada',
    tone: 'green' as const,
    image: 'cacao-grano-fermentado-chocolate.jpg',
    avatar: 'tropical-exports-logo.jpg',
  },
];

export const CodeCompareAndNegotiate: React.FC = () => {
  const frame = useCurrentFrame();

  // Timeline (600 frames @ 30fps = 20s):
  // 0..59:   Tab 0 — Old-school Classifieds Forum (agroanuncios-latam.net)
  // 60..119: Tab 1 — Institutional Static Directory (directorio-exportadores.org)
  // 120..179: Tab 2 — Corporate Commodity Broker Portal (americas-commodity-desk.com)
  // 180..309: Tab 3 (Agrilpa) — Real /dashboard/cotizaciones (CommercePage + Table)
  // 310..409: Tab 3 (Agrilpa) — Real /dashboard/cotizaciones/[id] (QuotationView)
  // 410..600: Tab 3 (Agrilpa) — Real /dashboard/mensajes (ChatWorkspace)
  const activeTab =
    frame < 60 ? 0 : frame < 120 ? 1 : frame < 180 ? 2 : 3;
  const inAgrilpaList = frame >= 180 && frame < 310;
  const inAgrilpaDetail = frame >= 310 && frame < 410;
  const inAgrilpaChat = frame >= 410;

  const currentUrl =
    activeTab === 0
      ? 'forosagro-anuncios.net/hilo/91204-venta-cafe-grano'
      : activeTab === 1
        ? 'directorio-exportadores.org/archivo-2023/granos-y-cafe'
        : activeTab === 2
          ? 'americas-commodity-desk.com/quote/lot-8841'
          : inAgrilpaList
            ? 'agrilpa.com/dashboard/cotizaciones'
            : inAgrilpaDetail
              ? 'agrilpa.com/dashboard/cotizaciones/cot-849201'
              : 'agrilpa.com/dashboard/mensajes';

  const points: Array<[number, number, number]> = [
    [0, 620, 420],
    [35, 540, 560],
    [52, 395, 22], // Click Tab 2
    [62, 395, 22],
    [92, 680, 470],
    [112, 635, 22], // Click Tab 3
    [122, 635, 22],
    [152, 860, 490],
    [172, 885, 22], // Click Agrilpa Tab 4
    [182, 885, 22],
    [220, 680, 545], // Inspect row 1 in /dashboard/cotizaciones
    [255, 680, 620], // Inspect row 2 in /dashboard/cotizaciones
    [292, 1188, 545], // Click action button on row 1 to open QuotationView
    [308, 1188, 545],
    [348, 1045, 420], // Review QuotationView summary on right
    [392, 1045, 638], // Click "Conversar con vendedor" button in QuotationView
    [408, 1045, 638],
    [432, 680, 815], // Focus chat composer in /dashboard/mensajes
    [498, 1196, 815], // Move to Send button
    [508, 1196, 815], // Click Send
    [560, 820, 600],
  ];

  let px = 620;
  let py = 420;
  for (let i = 0; i < points.length - 1; i++) {
    const [f1, x1, y1] = points[i];
    const [f2, x2, y2] = points[i + 1];
    if (frame >= f1 && frame <= f2) {
      const p = interpolate(frame, [f1, f2], [0, 1], smooth);
      px = x1 + (x2 - x1) * p;
      py = y1 + (y2 - y1) * p;
      break;
    } else if (frame > points[points.length - 1][0]) {
      px = points[points.length - 1][1];
      py = points[points.length - 1][2];
    }
  }

  const buyerMsg =
    'Hola, revisamos su propuesta por los 1,000 kg. ¿Podemos cerrar en US$6.00 / kg con entrega el viernes en San Salvador?';
  const typedBuyerMsg = typing(buyerMsg, frame, 434, 496);
  const buyerSent = frame >= 506;
  const sellerReplied = frame >= 534;

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
        {/* Standard macOS Browser Chrome with Tabs */}
        <div
          style={{
            height: 82,
            background: 'linear-gradient(#f2f3f4,#e5e7e9)',
            color: '#45484b',
            display: 'flex',
            flexDirection: 'column',
            borderBottom: '1px solid #cdd1d5',
          }}
        >
          {/* Browser Tabs Row */}
          <div
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              padding: '0 18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingBottom: 10,
                marginRight: 14,
              }}
            >
              {['#ff5f57', '#ffbd2e', '#28c840'].map((color) => (
                <span
                  key={color}
                  style={{
                    width: 12,
                    height: 12,
                    background: color,
                    borderRadius: '50%',
                  }}
                />
              ))}
            </div>

            {[
              {title: 'ForoAgro · Venta de café en grano'},
              {title: 'Directorio de Exportadores 2023'},
              {title: 'Americas Commodity Desk · Quote'},
              {title: 'Agrilpa · Panel de Control'},
            ].map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <div
                  key={tab.title}
                  style={{
                    height: 29,
                    padding: '0 13px',
                    borderRadius: '7px 7px 0 0',
                    background: isActive ? '#f5f6f7' : 'rgba(255,255,255,0.45)',
                    border: isActive
                      ? '1px solid #cdd1d5'
                      : '1px solid transparent',
                    borderBottom: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 11.5,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#202124' : '#5f6368',
                  }}
                >
                  <Globe size={11} style={{opacity: 0.65}} />
                  <span>{tab.title}</span>
                  <X size={11} style={{opacity: 0.45, marginLeft: 2}} />
                </div>
              );
            })}
          </div>

          {/* Standard Address Bar Row */}
          <div
            style={{
              height: 46,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 22px',
              background: '#f5f6f7',
              borderTop: '1px solid #d5d9dd',
            }}
          >
            <ArrowLeft size={19} style={{color: '#777'}} />
            <ChevronRight size={19} style={{color: '#aaa'}} />
            <div
              style={{
                margin: '0 auto',
                width: 620,
                height: 31,
                borderRadius: 8,
                background: '#d9dde1',
                color: '#45484b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 13.5,
              }}
            >
              <LockKeyhole size={12} />
              {currentUrl}
            </div>
            <span style={{fontSize: 11, color: '#6b7177', marginRight: 10}}>
              Demostración
            </span>
            <Share size={18} />
            <Plus size={20} />
          </div>
        </div>

        {/* Browser Viewport (1280 x 878) */}
        <div
          style={{
            position: 'relative',
            height: 878,
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          {/* =========================================================================
              EXTERNAL SITE 1 (Frames 0..59): Classic Web Forum (ForosAgro)
              Distinct old-school forum table design, navy bar, warm beige background
             ========================================================================= */}
          {activeTab === 0 && (
            <div
              style={{
                height: '100%',
                background: '#efefeb',
                fontFamily: 'Arial, Helvetica, sans-serif',
                color: '#222222',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Forum Header */}
              <div
                style={{
                  background: '#1f3a60',
                  color: '#ffffff',
                  padding: '14px 36px',
                  borderBottom: '3px solid #d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px'}}>
                    ForosAgro Latam — Tablón de Clasificados Rurales
                  </div>
                  <div style={{fontSize: 11.5, color: '#cbd5e1', marginTop: 2}}>
                    Comunidad abierta de anuncios libres · Sin verificación de usuarios
                  </div>
                </div>
                <div style={{display: 'flex', gap: 16, fontSize: 12, color: '#e2e8f0'}}>
                  <span>Índice del foro</span>
                  <span>Buscar temas</span>
                  <span>Reglas</span>
                  <span>Iniciar sesión</span>
                </div>
              </div>

              {/* Forum Breadcrumb */}
              <div
                style={{
                  padding: '10px 36px',
                  background: '#e2e2dc',
                  borderBottom: '1px solid #c8c8c0',
                  fontSize: 12,
                  color: '#444',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  Índice general &raquo; Clasificados de Granos &raquo;{' '}
                  <strong>Hilo #91204: Vendo lote de café oro (Precio por privado)</strong>
                </span>
                <span>Página 1 de 1 [ 3 mensajes ]</span>
              </div>

              {/* Forum Posts Table */}
              <div style={{padding: '20px 36px', display: 'flex', flexDirection: 'column', gap: 14}}>
                {/* Original Post */}
                <div
                  style={{
                    border: '1px solid #b8b8b0',
                    background: '#ffffff',
                    display: 'grid',
                    gridTemplateColumns: '210px 1fr',
                  }}
                >
                  <div
                    style={{
                      background: '#f7f7f4',
                      borderRight: '1px solid #d4d4cc',
                      padding: 16,
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{fontSize: 13.5, color: '#1f3a60', display: 'block'}}>
                      vendedor_campo88
                    </strong>
                    <span style={{color: '#666', display: 'block', marginBottom: 10}}>
                      Usuario invitado (Sin verificar)
                    </span>
                    <div style={{color: '#555'}}>
                      <div>Mensajes: 2</div>
                      <div>Registrado: Mar 2023</div>
                      <div>Ubicación: No indicada</div>
                      <div style={{marginTop: 8, color: '#888', fontSize: 11}}>
                        Última conexión: hace 7 meses
                      </div>
                    </div>
                  </div>
                  <div style={{padding: 18, display: 'flex', flexDirection: 'column', gap: 12}}>
                    <div
                      style={{
                        borderBottom: '1px solid #e5e5e0',
                        paddingBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11.5,
                        color: '#666',
                      }}
                    >
                      <strong>Asunto: VENDO LOTE DE CAFE ORO (SOLO INTERESADOS SERIOS)</strong>
                      <span>Publicado: hace 8 meses</span>
                    </div>
                    <p style={{fontSize: 13.5, lineHeight: 1.65, color: '#222', margin: 0}}>
                      Se vende lote de café en grano disponible en bodega. No publico precios por este
                      medio ni mando fotos por acá. Si le interesa comprar por tonelada deje su
                      comentario abajo o llame al número de oficina en horario laboral. No trabajamos
                      con contratos en línea.
                    </p>
                    <div
                      style={{
                        marginTop: 6,
                        padding: '10px 12px',
                        background: '#f7f7f4',
                        border: '1px dashed #c4c4bc',
                        fontSize: 12,
                        color: '#555',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 10,
                      }}
                    >
                      <div>
                        <span style={{color: '#777', display: 'block'}}>Precio unitario:</span>
                        <strong>No especificado</strong>
                      </div>
                      <div>
                        <span style={{color: '#777', display: 'block'}}>Certificaciones:</span>
                        <strong>Sin adjuntar</strong>
                      </div>
                      <div>
                        <span style={{color: '#777', display: 'block'}}>Humedad / Puntaje:</span>
                        <strong>Sin ficha técnica</strong>
                      </div>
                      <div>
                        <span style={{color: '#777', display: 'block'}}>Teléfono de contacto:</span>
                        <strong>[Número desconectado]</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unanswered Buyer Replies */}
                {[
                  {
                    user: 'importadora_san_miguel',
                    date: 'hace 4 meses',
                    text: 'Hola, te enviamos dos correos la semana pasada solicitando cotización formal por 1,000 kg puesto en San Salvador y aún no recibimos respuesta. ¿Sigue disponible el lote?',
                  },
                  {
                    user: 'comercial_del_pacifico',
                    date: 'hace 2 meses',
                    text: 'Intentamos llamar al teléfono del anuncio pero indica que el número no existe. ¿Alguien sabe dónde encontrar productores verificados que sí respondan con precios reales?',
                  },
                ].map((reply) => (
                  <div
                    key={reply.user}
                    style={{
                      border: '1px solid #b8b8b0',
                      background: '#fbfbf9',
                      display: 'grid',
                      gridTemplateColumns: '210px 1fr',
                    }}
                  >
                    <div
                      style={{
                        background: '#f2f2ee',
                        borderRight: '1px solid #d4d4cc',
                        padding: '12px 16px',
                        fontSize: 12,
                      }}
                    >
                      <strong style={{color: '#333', display: 'block'}}>{reply.user}</strong>
                      <span style={{color: '#777', fontSize: 11}}>Comprador mayorista</span>
                    </div>
                    <div style={{padding: '12px 18px', fontSize: 13, color: '#333', lineHeight: 1.55}}>
                      <div style={{fontSize: 11, color: '#777', marginBottom: 4}}>
                        Respuesta publicada {reply.date} · <strong>Sin respuesta del vendedor</strong>
                      </div>
                      {reply.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              EXTERNAL SITE 2 (Frames 60..119): Static Institutional Directory
              Editorial serif/stone layout, sidebar + dense HTML table of static text
             ========================================================================= */}
          {activeTab === 1 && (
            <div
              style={{
                height: '100%',
                background: '#faf9f5',
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#1c1917',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Institutional Top Bar */}
              <div
                style={{
                  background: '#ffffff',
                  borderBottom: '2px solid #292524',
                  padding: '16px 40px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'Arial, sans-serif',
                      fontSize: 10.5,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#78716c',
                      display: 'block',
                    }}
                  >
                    Registro Regional de Comercio Exterior · Edición de Archivo
                  </span>
                  <h1 style={{fontSize: 22, fontWeight: 700, margin: '3px 0 0'}}>
                    Directorio General de Exportadores Agrícolas (Listado Estático)
                  </h1>
                </div>
                <span style={{fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#57534e'}}>
                  Última actualización de datos: Noviembre 2023
                </span>
              </div>

              {/* 2-Column Directory Body */}
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: '240px 1fr',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {/* Left Sidebar */}
                <aside
                  style={{
                    borderRight: '1px solid #d6d3d1',
                    padding: '22px 24px',
                    background: '#f5f4ef',
                    fontSize: 12.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div>
                    <strong style={{display: 'block', marginBottom: 6, color: '#292524'}}>
                      Archivos por año
                    </strong>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 5, color: '#57534e'}}>
                      <span>• Padrón 2023 (Actual)</span>
                      <span>• Padrón 2022 (PDF)</span>
                      <span>• Padrón 2021 (PDF)</span>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid #d6d3d1', paddingTop: 12}}>
                    <strong style={{display: 'block', marginBottom: 6, color: '#292524'}}>
                      Nota del directorio
                    </strong>
                    <p style={{fontSize: 11.5, color: '#57534e', lineHeight: 1.55, margin: 0}}>
                      Este portal es únicamente un listado informativo. No cuenta con precios,
                      inventario en tiempo real ni mensajería directa.
                    </p>
                  </div>
                </aside>

                {/* Right Table */}
                <div style={{padding: '24px 32px'}}>
                  <div
                    style={{
                      marginBottom: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12.5,
                      color: '#44403c',
                    }}
                  >
                    <span>
                      Rubro seleccionado: <strong>0901 · Café sin tostar ni descafeinar</strong>
                    </span>
                    <span>Mostrando registros estáticos (Sin cotización en línea)</span>
                  </div>

                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      background: '#ffffff',
                      border: '1px solid #d6d3d1',
                      fontSize: 12.5,
                    }}
                  >
                    <thead>
                      <tr style={{background: '#e7e5e4', color: '#1c1917', textAlign: 'left'}}>
                        <th style={{padding: '10px 12px', border: '1px solid #d6d3d1'}}>Registro</th>
                        <th style={{padding: '10px 12px', border: '1px solid #d6d3d1'}}>Razón Social</th>
                        <th style={{padding: '10px 12px', border: '1px solid #d6d3d1'}}>Precio / Catálogo</th>
                        <th style={{padding: '10px 12px', border: '1px solid #d6d3d1'}}>Vía de contacto</th>
                        <th style={{padding: '10px 12px', border: '1px solid #d6d3d1'}}>Estado de respuesta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          code: 'REG-0104',
                          name: 'Comercializadora del Sur S.A.',
                          catalog: 'No publica precios',
                          contact: 'Formulario postal / Fax',
                          status: 'Correo enviado hace 5 días · Sin respuesta',
                        },
                        {
                          code: 'REG-0219',
                          name: 'Exportadora Agro-Centro Ltda.',
                          catalog: 'Sin catálogo digital',
                          contact: 'recepcion@agrocentro.org',
                          status: 'Buzón lleno / Correo devuelto',
                        },
                        {
                          code: 'REG-0308',
                          name: 'Distribuidora Mayorista de Granos',
                          catalog: 'Solo consulta telefónica',
                          contact: '(+502) 2210-0000',
                          status: 'No atiende pedidos menores a 5 contenedores',
                        },
                        {
                          code: 'REG-0412',
                          name: 'Beneficio San Pedro S.A.',
                          catalog: 'No publica precios',
                          contact: 'info@beneficiosanpedro.net',
                          status: 'Ficha desactualizada desde 2022',
                        },
                      ].map((row, idx) => (
                        <tr
                          key={row.code}
                          style={{
                            background: idx % 2 === 1 ? '#fafaf9' : '#ffffff',
                          }}
                        >
                          <td style={{padding: '12px', border: '1px solid #e7e5e4', fontFamily: 'monospace'}}>
                            {row.code}
                          </td>
                          <td style={{padding: '12px', border: '1px solid #e7e5e4', fontWeight: 600}}>
                            {row.name}
                          </td>
                          <td style={{padding: '12px', border: '1px solid #e7e5e4', color: '#78716c'}}>
                            {row.catalog}
                          </td>
                          <td style={{padding: '12px', border: '1px solid #e7e5e4', color: '#44403c'}}>
                            {row.contact}
                          </td>
                          <td style={{padding: '12px', border: '1px solid #e7e5e4', color: '#57534e'}}>
                            {row.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              EXTERNAL SITE 3 (Frames 120..179): Corporate Commodity Broker Portal
              Dark zinc corporate top bar, financial quote breakdown with high commission
             ========================================================================= */}
          {activeTab === 2 && (
            <div
              style={{
                height: '100%',
                background: '#f4f4f5',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#18181b',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Broker Portal Header */}
              <div
                style={{
                  background: '#18181b',
                  color: '#fafafa',
                  padding: '14px 40px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <span
                    style={{
                      padding: '4px 8px',
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                    }}
                  >
                    ACD BROKERS
                  </span>
                  <span style={{fontSize: 15, fontWeight: 600}}>
                    Americas Commodity Desk — Intermediación Mayorista
                  </span>
                </div>
                <span style={{fontSize: 12, color: '#a1a1aa'}}>
                  Cotización vía intermediario #LOT-8841
                </span>
              </div>

              {/* Broker Portal Content */}
              <div
                style={{
                  padding: '28px 40px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 390px',
                  gap: 24,
                }}
              >
                {/* Left Column: Lot details with hidden producer */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: 8,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{borderBottom: '1px solid #f4f4f5', paddingBottom: 14}}>
                    <span style={{fontSize: 11.5, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                      Orden de intermediación #LOT-8841
                    </span>
                    <h2 style={{fontSize: 20, fontWeight: 700, marginTop: 4}}>
                      Lote 1,000 kg — Café Oro Arábica (Origen Centroamérica)
                    </h2>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                      fontSize: 13,
                    }}
                  >
                    <div style={{padding: 14, background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 6}}>
                      <span style={{color: '#71717a', fontSize: 11.5, display: 'block'}}>
                        Productor / Finca de origen
                      </span>
                      <strong style={{display: 'block', marginTop: 4, color: '#27272a'}}>
                        Confidencial (Oculto por el broker)
                      </strong>
                      <span style={{fontSize: 11.5, color: '#71717a', display: 'block', marginTop: 3}}>
                        No se permite contacto directo con el productor.
                      </span>
                    </div>

                    <div style={{padding: 14, background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 6}}>
                      <span style={{color: '#71717a', fontSize: 11.5, display: 'block'}}>
                        Tiempo de gestión y entrega
                      </span>
                      <strong style={{display: 'block', marginTop: 4, color: '#27272a'}}>
                        21 a 30 días hábiles
                      </strong>
                      <span style={{fontSize: 11.5, color: '#71717a', display: 'block', marginTop: 3}}>
                        Sujeto a aprobación de mesa de corretaje.
                      </span>
                    </div>
                  </div>

                  <div style={{padding: 14, background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 6, fontSize: 12.5, color: '#52525b', lineHeight: 1.6}}>
                    <strong>Condiciones de intermediación:</strong> Cualquier ajuste en empaque, fecha
                    de despacho o muestras debe solicitarse por escrito al agente asignado (tiempo de
                    respuesta de 48 a 72 horas por consulta).
                  </div>
                </div>

                {/* Right Column: Price breakdown with high markups */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: 8,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h3 style={{fontSize: 15, fontWeight: 700, margin: '0 0 14px'}}>
                      Desglose de cotización con intermediario
                    </h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', color: '#52525b'}}>
                        <span>Precio base en finca (1,000 kg)</span>
                        <span>$6,200.00 USD</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', color: '#52525b'}}>
                        <span>Comisión de corretaje (+18%)</span>
                        <strong>+$1,116.00 USD</strong>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', color: '#52525b'}}>
                        <span>Cargo por gestión de cuenta</span>
                        <strong>+$634.00 USD</strong>
                      </div>
                      <div
                        style={{
                          borderTop: '1px solid #e4e4e7',
                          paddingTop: 12,
                          marginTop: 4,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                        }}
                      >
                        <span style={{fontWeight: 600}}>Total con intermediario</span>
                        <div style={{textAlign: 'right'}}>
                          <strong style={{fontSize: 22, display: 'block'}}>$7,950.00 USD</strong>
                          <span style={{fontSize: 12, color: '#71717a'}}>$7.95 USD / kg (No negociable)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ACT 2A (Frames 180..309): PURE AGRILPA CODE — /dashboard/cotizaciones
              Uses GeneratedDashboardShell + CommercePage + Metrics + SearchField + FilterTabs + cs.table
             ========================================================================= */}
          {inAgrilpaList && (
            <GeneratedDashboardShell activeHref="/dashboard/cotizaciones" cotizacionesCount={3}>
              <CommercePage
                title="Cotizaciones"
                description="Revisa las solicitudes y propuestas de tus proveedores y convierte el interés en negocios."
              >
                <Metrics
                  items={[
                    {
                      label: 'Solicitudes recibidas',
                      value: 3,
                      hint: 'Todas tus cotizaciones',
                      active: true,
                    },
                    {
                      label: 'Pendientes',
                      value: 2,
                      hint: 'Por revisar y responder',
                    },
                    {
                      label: 'Aceptadas',
                      value: 1,
                      hint: 'Solicitudes aprobadas',
                    },
                    {
                      label: 'Rechazadas',
                      value: 0,
                      hint: 'Solicitudes descartadas',
                    },
                  ]}
                />

                <div className={cs.section}>
                  <div className={cs.sectionHead}>
                    <div className={cs.sectionTitle}>
                      <h2>Propuestas para comparar</h2>
                      <span>3</span>
                    </div>
                    <div className={cs.toolbar}>
                      <SearchField
                        value=""
                        onChange={() => {}}
                        placeholder="Buscar producto, proveedor o destino"
                      />
                      <span className={cs.resultCount}>3 de 3 cotizaciones</span>
                    </div>
                    <FilterTabs
                      value="all"
                      onChange={() => {}}
                      options={[
                        {value: 'all', label: 'Todas', count: 3},
                        {value: 'pending', label: 'Pendientes', count: 2},
                        {value: 'accepted', label: 'Aceptadas', count: 1},
                        {value: 'rejected', label: 'Rechazadas', count: 0},
                      ]}
                    />
                  </div>

                  <table className={cs.table}>
                    <thead>
                      <tr>
                        <th>Producto / cantidad</th>
                        <th>Proveedor</th>
                        <th>Destino / entrega</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {QUOTATIONS_ROWS.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className={cs.productCell}>
                              <div className={cs.productThumb}>
                                <Img src={staticFile(row.image)} />
                              </div>
                              <div>
                                <span className={cs.cellTitle}>{row.product}</span>
                                <span className={cs.cellMeta}>{row.quantity}</span>
                                <span className={cs.cellMeta}>{row.received}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={cs.cellTitle}>{row.supplier}</span>
                            <span className={cs.cellIconLine}>
                              <MessageCircle size={13} />
                              Mensajería Agrilpa
                            </span>
                          </td>
                          <td>
                            <span className={cs.cellIconLine}>
                              <MapPin size={13} />
                              {row.country}
                            </span>
                            <span className={cs.cellMeta}>{row.delivery}</span>
                          </td>
                          <td>
                            <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                          </td>
                          <td>
                            <div className={cs.cellActions}>
                              <button type="button" className={cs.iconButton}>
                                <MessageCircle size={17} />
                              </button>
                              <button type="button" className={cs.iconButton}>
                                <ArrowUpRight size={16} />
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
          )}

          {/* =========================================================================
              ACT 2B (Frames 310..409): PURE AGRILPA CODE — /dashboard/cotizaciones/[id]
              Uses GeneratedDashboardShell + QuotationView (components/quotations/quotation.module.css)
             ========================================================================= */}
          {inAgrilpaDetail && (
            <GeneratedDashboardShell activeHref="/dashboard/cotizaciones" cotizacionesCount={3}>
              <QuotationView
                data={{
                  viewer: 'buyer',
                  counterpart: {
                    id: 'finca-el-roble',
                    company_name: 'Finca El Roble',
                    avatar_url: staticFile('finca-el-roble-logo.jpg'),
                    country: 'El Salvador · Chalatenango',
                  },
                  quotation: {
                    id: 'COT849201',
                    product_id: '56e3b8ee-e1c7-4d06-9b90-020e0a3371bc',
                    product_title: 'Café de especialidad Oro-Verde',
                    product_image: staticFile('cafe-premium-salvadoreno.jpg'),
                    buyer_id: 'demo-buyer',
                    buyer_name: 'Agroindustrias Pacífico',
                    quantity: 1000,
                    quantity_unit: 'kg',
                    status: 'pending',
                    created_at: '2026-10-31T10:30:00Z',
                    destination_country: 'El Salvador',
                    destination_location: 'San Salvador',
                    delivery_method: 'delivery',
                    estimated_date: '2026-11-06',
                    purchase_frequency: 'monthly',
                    incoterm: 'DDP · Entregado en bodega',
                    target_price: 6.2,
                    currency: 'USD',
                    notes:
                      'Café de estricta altura (86 pts SCA), empacado en sacos GrainPro de 25 kg. Certificado orgánico incluido.',
                  } as any,
                }}
              />
            </GeneratedDashboardShell>
          )}

          {/* =========================================================================
              ACT 3 (Frames 410..600): PURE AGRILPA CODE — /dashboard/mensajes
              Uses GeneratedDashboardShell + components/chat/chat-workspace.module.css
             ========================================================================= */}
          {inAgrilpaChat && (
            <GeneratedDashboardShell activeHref="/dashboard/mensajes">
              <section
                className={chatStyles.page}
                style={{height: 802, padding: '22px 26px 20px'}}
              >
                <header className={chatStyles.pageHeader}>
                  <div>
                    <h1>Mensajes</h1>
                    <p>Conecta con tus contactos y continúa tus negocios.</p>
                  </div>
                  <button type="button" className={chatStyles.supportButton}>
                    <Headphones size={17} />
                    <span>Contactar soporte</span>
                  </button>
                </header>

                <div className={chatStyles.workspace}>
                  <aside className={chatStyles.inbox} style={{width: 310}}>
                    <div className={chatStyles.inboxHeader}>
                      <div className={chatStyles.inboxTitle}>
                        <h2>Conversaciones</h2>
                        <span>3</span>
                      </div>
                      <div className={chatStyles.search}>
                        <Search size={17} />
                        <input readOnly placeholder="Buscar empresa o producto" />
                      </div>
                      <div className={chatStyles.filters}>
                        <button type="button" aria-pressed="true">
                          Todas
                        </button>
                        <button type="button" aria-pressed="false">
                          No leídas
                        </button>
                        <button type="button" aria-pressed="false">
                          Leídas
                        </button>
                      </div>
                    </div>

                    <div className={chatStyles.conversationList}>
                      <ul>
                        {QUOTATIONS_ROWS.map((item, idx) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              aria-pressed={idx === 0}
                              className={chatStyles.conversation}
                            >
                              <Img
                                src={staticFile(item.avatar)}
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                              />
                              <span className={chatStyles.conversationDetails}>
                                <span className={chatStyles.conversationTop}>
                                  <strong>{item.supplier}</strong>
                                  <time>10:42</time>
                                </span>
                                <span className={chatStyles.conversationPreview}>
                                  <span>
                                    {idx === 0
                                      ? sellerReplied
                                        ? 'De acuerdo, cerramos en US$6.00 / kg'
                                        : 'Tenemos los 1,000 kg listos a US$6.20/kg'
                                      : item.quantity}
                                  </span>
                                </span>
                                <span className={chatStyles.conversationProduct}>
                                  <Package size={12} />
                                  <span>{item.product}</span>
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={chatStyles.inboxFooter}>
                      <MessageSquare size={14} />
                      <span>Tu red de negocios, en un solo lugar.</span>
                    </div>
                  </aside>

                  <section className={chatStyles.chat}>
                    <header className={chatStyles.chatHeader}>
                      <Img
                        src={staticFile('finca-el-roble-logo.jpg')}
                        style={{
                          width: 39,
                          height: 39,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div className={chatStyles.contactIdentity}>
                        <h2>Finca El Roble</h2>
                        <p>
                          <span className={chatStyles.online} />
                          En línea
                        </p>
                      </div>
                      <div className={chatStyles.headerActions}>
                        <span className={chatStyles.profileLink}>
                          Ver perfil <ExternalLink size={14} />
                        </span>
                        <button type="button" className={chatStyles.iconButton}>
                          <MoreHorizontal size={21} />
                        </button>
                      </div>
                    </header>

                    <div className={chatStyles.productContext}>
                      <div className={chatStyles.productImage}>
                        <Img src={staticFile('cafe-premium-salvadoreno.jpg')} />
                      </div>
                      <div className={chatStyles.productIdentity}>
                        <span>Sobre este producto</span>
                        <strong>Café de especialidad Oro-Verde</strong>
                      </div>
                      <div className={chatStyles.productPrice}>
                        <strong>{sellerReplied ? 'US$ 6.00' : 'US$ 6.20'}</strong>
                        <span> / kg</span>
                      </div>
                      <ExternalLink size={15} />
                    </div>

                    <div className={chatStyles.messageScroll}>
                      <div className={chatStyles.messages}>
                        <div className={chatStyles.dateDivider}>
                          <span>Hoy</span>
                        </div>

                        <div className={chatStyles.messageRow}>
                          <div className={chatStyles.messageBubble}>
                            <p className={chatStyles.messageText}>
                              ¡Hola! Recibimos tu solicitud por 1,000 kg de Café Oro-Verde.
                              Tenemos disponibilidad inmediata en sacos GrainPro de 25 kg a
                              US$6.20 / kg.
                            </p>
                            <div className={chatStyles.messageMeta}>
                              <time>10:41</time>
                            </div>
                          </div>
                        </div>

                        {buyerSent && (
                          <div className={`${chatStyles.messageRow} ${chatStyles.mine}`}>
                            <div className={chatStyles.messageBubble}>
                              <p className={chatStyles.messageText}>{buyerMsg}</p>
                              <div className={chatStyles.messageMeta}>
                                <time>10:42</time>
                                <span data-status="read">
                                  <CheckCheck size={15} />
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {sellerReplied && (
                          <div className={chatStyles.messageRow}>
                            <div className={chatStyles.messageBubble}>
                              <p className={chatStyles.messageText}>
                                De acuerdo, cerramos en US$6.00 / kg (US$6,000.00 total) con
                                entrega incluida este viernes en San Salvador. Ya actualicé la
                                cotización para confirmar el pedido.
                              </p>
                              <div className={chatStyles.messageMeta}>
                                <time>10:43</time>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <footer className={chatStyles.composer}>
                      <div className={chatStyles.inputBox}>
                        <textarea
                          readOnly
                          rows={1}
                          placeholder="Escribe un mensaje…"
                          value={!buyerSent ? typedBuyerMsg : ''}
                        />
                        <div className={chatStyles.inputTools}>
                          <button type="button" className={chatStyles.iconButton}>
                            <Paperclip size={19} />
                          </button>
                          <button type="button" className={chatStyles.sendButton}>
                            <ArrowUp size={21} />
                          </button>
                        </div>
                      </div>
                      <div className={chatStyles.composerHint}>
                        <span>Adjunta imágenes o documentos de hasta 10 MB.</span>
                        <span>Enter para enviar · Shift + Enter para una nueva línea</span>
                      </div>
                    </footer>
                  </section>
                </div>
              </section>
            </GeneratedDashboardShell>
          )}

          {/* Animated Cursor */}
          <div
            style={{
              position: 'absolute',
              left: px,
              top: py - 82,
              pointerEvents: 'none',
              zIndex: 80,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
            }}
          >
            <MousePointer2 size={24} strokeWidth={1.5} fill="#151719" color="#ffffff" />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
