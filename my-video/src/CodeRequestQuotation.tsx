import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  MousePointer2,
  Plus,
  Share,
  X,
} from 'lucide-react';
import {GeneratedNavbar} from './GeneratedNavbar';
import {GeneratedProductDetail} from './GeneratedProductDetail';
import catalog from './catalog-data.json';
import {commerceStyles as c} from '@/components/dashboard/commerce-ui';
import s from '@/components/quotations/quotation.module.css';
import './control-center/control-center.css';

export const CodeRequestQuotation: React.FC = () => {
  const product = {
    ...catalog.product,
    image: staticFile(catalog.product.images[0]),
    image2: catalog.product.images[1]
      ? staticFile(catalog.product.images[1])
      : '',
    image3: catalog.product.images[2]
      ? staticFile(catalog.product.images[2])
      : '',
  };

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
            {'agrilpa.com/producto/' + catalog.product.id}
          </div>
          <span style={{fontSize: 11, color: '#6b7177', marginRight: 14}}>
            Demostración
          </span>
          <Share size={19} />
          <Plus size={21} style={{marginLeft: 10}} />
        </div>

        <div
          className="catalog-video"
          style={{position: 'relative', height: 896, overflow: 'hidden'}}
        >
          <GeneratedNavbar />
          <div style={{filter: 'blur(1.5px)', opacity: 0.55}}>
            <GeneratedProductDetail
              product={product}
              contentOffset={-80}
              selectedImage={null}
            />
          </div>

          {/* Modal Backdrop + Real QuotationRequestDialog markup */}
          <div
            style={{
              position: 'absolute',
              top: 64,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.36)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 32px',
            }}
          >
            <div
              className={s.dialog}
              style={{
                width: '100%',
                maxWidth: 940,
                maxHeight: 'none',
                background: 'var(--background)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.26)',
                overflow: 'hidden',
                transform: 'scale(0.88)',
                transformOrigin: 'center center',
              }}
            >
              <header className={s.header} style={{padding: '18px 26px 14px'}}>
                <span className={s.eyebrow}>
                  Una nueva oportunidad de negocio
                </span>
                <h2 className={s.title}>Solicitar cotización</h2>
                <p className={s.description}>
                  Cuéntale al vendedor qué necesitas para recibir una propuesta
                  a tu medida.
                </p>
                <button type="button" className={s.close} aria-label="Cerrar">
                  <X size={20} />
                </button>
              </header>

              <div className={s.form}>
                <div
                  className={s.body}
                  style={{maxHeight: 'none', padding: '18px 26px'}}
                >
                  <div className={s.fields} style={{gap: 16}}>
                    <section className={s.section}>
                      <h3>1. Tu pedido</h3>
                      <div className={s.grid}>
                        <div className={s.field}>
                          <label>Cantidad (kg) *</label>
                          <div className={s.unitInput}>
                            <input readOnly value="1,000" />
                            <span>kg</span>
                          </div>
                          <small>Pedido mínimo: 200 kg.</small>
                        </div>
                        <div className={s.field}>
                          <label>Frecuencia de compra</label>
                          <select defaultValue="monthly">
                            <option value="monthly">Compra mensual</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className={s.section}>
                      <h3>2. Entrega</h3>
                      <div className={s.choices}>
                        <label className={s.choice}>
                          <input type="radio" checked readOnly />
                          Necesito envío
                        </label>
                        <label className={s.choice}>
                          <input type="radio" checked={false} readOnly />
                          Coordinaré la recogida
                        </label>
                      </div>
                      <div className={s.grid}>
                        <div className={s.field}>
                          <label>País de destino *</label>
                          <input readOnly value="El Salvador" />
                        </div>
                        <div className={s.field}>
                          <label>Ciudad o puerto *</label>
                          <input
                            readOnly
                            value="San Salvador, Bodega Central"
                          />
                        </div>
                        <div className={s.field}>
                          <label>Fecha deseada de entrega *</label>
                          <input readOnly value="15 de noviembre de 2026" />
                        </div>
                        <div className={s.field}>
                          <label>Presupuesto objetivo (USD / kg)</label>
                          <input readOnly value="$6.50 USD / kg" />
                        </div>
                      </div>
                    </section>

                    <section className={s.section}>
                      <h3>3. Requisitos del pedido</h3>
                      <div className={`${s.field} ${s.full}`}>
                        <label>Notas para el vendedor</label>
                        <textarea
                          readOnly
                          rows={2}
                          value="Buscamos café de especialidad en sacos de 25 kg con bolsa GrainPro, humedad 11.5% y certificado de origen."
                        />
                      </div>
                    </section>
                  </div>

                  <aside className={s.aside}>
                    <span className={s.eyebrow}>Producto a cotizar</span>
                    <Img
                      className={s.productImage}
                      src={staticFile('cafe-premium-salvadoreno.jpg')}
                    />
                    <h3>Café de especialidad Oro-Verde</h3>
                    <p className={s.seller}>Finca El Roble · El Salvador</p>
                    <dl className={s.facts}>
                      <div>
                        <dt>Pedido mínimo</dt>
                        <dd>200 kg</dd>
                      </div>
                      <div>
                        <dt>Origen</dt>
                        <dd>El Salvador</dd>
                      </div>
                      <div>
                        <dt>Presentación</dt>
                        <dd>Sacos de 25 kg</dd>
                      </div>
                    </dl>
                    <div className={s.platformNote}>
                      <MessageCircle size={22} />
                      <p>
                        <strong>Todo en Agrilpa</strong>
                        <br />
                        Recibe la respuesta y acuerda los detalles en Mensajes
                        B2B.
                      </p>
                    </div>
                  </aside>
                </div>

                <footer className={s.footer} style={{padding: '14px 26px'}}>
                  <p>Solicitar una cotización no confirma una compra.</p>
                  <div className={s.actions}>
                    <button type="button" className={c.secondaryButton}>
                      Cancelar
                    </button>
                    <button type="button" className={c.primaryButton}>
                      <ArrowRight size={18} /> Enviar solicitud
                    </button>
                  </div>
                </footer>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: 964,
              top: 794,
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
