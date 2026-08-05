import ScrollReveal from '@/components/crm/scroll-reveal'

export const metadata = {
  title: 'Coqueros — Bebidas de Coco | Próximamente',
  description: 'Coqueros — Bebidas premium de coco, Caracas, Venezuela. Distribución mayorista y alianzas comerciales B2B.',
}

const WA_LINK = 'https://wa.me/584123966330?text=Hola%20Coqueros%2C%20me%20interesa%20hablar%20sobre%20negocios.'

export default function LandingPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream: #f5f0df; --green: #1e5c1e; --green-m: #2d7a2d; --green-l: #4aaa4a;
          --brown: #5c3010; --brown-l: #8b5226; --gold: #c8a020; --white: #ffffff; --text: #1a1a1a;
        }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-inter, 'Inter', sans-serif); background-color: var(--green); color: var(--white); overflow-x: hidden; }
        .pattern-strip { width: 100%; height: 6px; background: var(--gold); }
        nav { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2.5rem; background: rgba(0,0,0,0.25); backdrop-filter: blur(6px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .nav-logo { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: 2rem; letter-spacing: 4px; color: var(--cream); text-shadow: 2px 2px 0 var(--green); -webkit-text-stroke: 1px var(--green); }
        .nav-badge { background: var(--gold); color: var(--green); font-weight: 700; font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; padding: 0.3rem 0.85rem; border-radius: 2px; }
        .hero { position: relative; min-height: 92vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 1.5rem 4rem; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background-image: url('/patron.jpeg'); background-size: 480px; background-repeat: repeat; opacity: 0.07; filter: saturate(0.5); }
        .hero-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 30%, rgba(20,60,20,0.7) 100%); }
        .hero-content { position: relative; z-index: 2; max-width: 860px; }
        .hero-label { display: inline-block; border: 1px solid var(--gold); color: var(--gold); font-size: 0.7rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; padding: 0.4rem 1.2rem; border-radius: 2px; margin-bottom: 2rem; }
        .hero-soon { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: clamp(3.5rem,10vw,9rem); line-height: 0.92; letter-spacing: 6px; color: var(--cream); text-shadow: 0 0 60px rgba(200,160,32,0.3); margin-bottom: 1rem; }
        .hero-soon span { color: var(--gold); }
        .hero-brand { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: clamp(4rem,14vw,13rem); line-height: 0.88; letter-spacing: 10px; color: var(--white); text-shadow: 4px 4px 0 var(--green), 8px 8px 0 rgba(0,0,0,0.2); -webkit-text-stroke: 2px rgba(200,160,32,0.5); margin-bottom: 2rem; }
        .hero-sub { font-size: 1.05rem; font-weight: 400; color: rgba(255,255,255,0.75); line-height: 1.7; max-width: 540px; margin: 0 auto 3rem; }
        .hero-cta { display: inline-block; background: var(--gold); color: var(--green); font-weight: 700; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 1rem 2.5rem; border-radius: 3px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 24px rgba(200,160,32,0.35); }
        .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(200,160,32,0.55); }
        .hero-location { margin-top: 2.5rem; font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.4); }
        .hero-location span { color: rgba(200,160,32,0.7); }
        .divider { width: 100%; height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); opacity: 0.4; }
        .props { background: var(--cream); color: var(--green); padding: 5rem 2rem; }
        .props-inner { max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--brown-l); margin-bottom: 0.75rem; }
        .section-title { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: clamp(2.2rem,5vw,4rem); letter-spacing: 3px; color: var(--green); line-height: 1; margin-bottom: 3.5rem; }
        .props-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 2rem; }
        .prop-card { background: var(--white); border: 1px solid rgba(30,92,30,0.1); border-radius: 6px; padding: 2.2rem 1.8rem; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
        .prop-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--gold); }
        .prop-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(30,92,30,0.12); }
        .prop-icon { font-size: 2.2rem; margin-bottom: 1rem; display: block; }
        .prop-card h3 { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: 1.5rem; letter-spacing: 2px; color: var(--green); margin-bottom: 0.6rem; }
        .prop-card p { font-size: 0.9rem; color: var(--brown); line-height: 1.65; }
        .products { background: var(--brown); padding: 5rem 2rem; position: relative; overflow: hidden; }
        .products::before { content: ''; position: absolute; inset: 0; background-image: url('/patron.jpeg'); background-size: 400px; background-repeat: repeat; opacity: 0.04; }
        .products-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
        .products .section-label { color: var(--gold); opacity: 0.8; }
        .products .section-title { color: var(--cream); }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 1.5rem; margin-top: 3rem; }
        .prod-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2rem 1.5rem; text-align: center; backdrop-filter: blur(4px); transition: background 0.2s; }
        .prod-card:hover { background: rgba(255,255,255,0.11); }
        .prod-icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .prod-card h3 { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: 1.3rem; letter-spacing: 2px; color: var(--cream); margin-bottom: 0.4rem; }
        .prod-card p { font-size: 0.82rem; color: rgba(245,240,223,0.6); }
        .prod-tag { display: inline-block; margin-top: 1rem; background: rgba(200,160,32,0.2); border: 1px solid rgba(200,160,32,0.4); color: var(--gold); font-size: 0.65rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 0.25rem 0.7rem; border-radius: 2px; }
        .contact { background: var(--green); padding: 5rem 2rem; position: relative; overflow: hidden; }
        .contact::after { content: ''; position: absolute; inset: 0; background-image: url('/patron.jpeg'); background-size: 380px; background-repeat: repeat; opacity: 0.05; pointer-events: none; }
        .contact-inner { max-width: 700px; margin: 0 auto; position: relative; z-index: 1; text-align: center; }
        .contact .section-label { color: var(--gold); opacity: 0.8; }
        .contact .section-title { color: var(--cream); margin-bottom: 0.75rem; }
        .contact-desc { font-size: 0.95rem; color: rgba(255,255,255,0.65); margin-bottom: 2.5rem; line-height: 1.7; }
        form { display: grid; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        input, select, textarea { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 4px; color: var(--white); font-family: var(--font-inter, 'Inter', sans-serif); font-size: 0.9rem; padding: 0.85rem 1.1rem; outline: none; transition: border-color 0.2s, background 0.2s; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.35); }
        select option { background: var(--green); color: var(--white); }
        input:focus, select:focus, textarea:focus { border-color: var(--gold); background: rgba(255,255,255,0.12); }
        textarea { resize: vertical; min-height: 120px; }
        .form-submit { background: var(--gold); color: var(--green); border: none; border-radius: 4px; font-family: var(--font-inter, 'Inter', sans-serif); font-weight: 700; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase; padding: 1rem; cursor: pointer; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 20px rgba(200,160,32,0.3); }
        .form-submit:hover { opacity: 0.88; transform: translateY(-1px); }
        .form-note { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 0.5rem; }
        footer { background: #0d1f0d; padding: 2.5rem 2rem; text-align: center; border-top: 1px solid rgba(200,160,32,0.2); }
        .footer-logo { font-family: var(--font-bebas, 'Bebas Neue', sans-serif); font-size: 2.5rem; letter-spacing: 6px; color: var(--cream); margin-bottom: 0.5rem; }
        .footer-tagline { font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 1.5rem; }
        .footer-contact { display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .footer-contact a { color: var(--gold); font-size: 0.82rem; text-decoration: none; letter-spacing: 0.5px; }
        .footer-contact a:hover { text-decoration: underline; }
        .footer-copy { font-size: 0.7rem; color: rgba(255,255,255,0.18); letter-spacing: 1px; }
        .wa-float { position: fixed; bottom: 1.75rem; right: 1.75rem; z-index: 999; display: flex; align-items: center; gap: 0.65rem; background: #25d366; color: #fff; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.5px; text-decoration: none; padding: 0.75rem 1.2rem 0.75rem 0.9rem; border-radius: 50px; box-shadow: 0 4px 20px rgba(37,211,102,0.5); transition: transform 0.2s, box-shadow 0.2s; }
        .wa-float:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(37,211,102,0.65); }
        .direct-contact { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 2.5rem; }
        .dc-btn { display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.82rem; letter-spacing: 0.5px; padding: 0.7rem 1.3rem; border-radius: 4px; border: 1.5px solid transparent; transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s; }
        .dc-btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .dc-btn--wa { background: #25d366; color: #fff; border-color: #25d366; box-shadow: 0 3px 14px rgba(37,211,102,0.35); }
        .dc-btn--mail { background: rgba(255,255,255,0.1); color: var(--cream); border-color: rgba(255,255,255,0.22); }
        .dc-btn--mail:hover { background: rgba(255,255,255,0.16); }
        .dc-btn--ig { background: linear-gradient(135deg,#f58529,#dd2a7b,#8134af); color: #fff; border-color: transparent; box-shadow: 0 3px 14px rgba(221,42,123,0.35); }
        .hero-mascot { position: relative; width: 300px; height: 300px; margin: 0 auto 2.5rem; flex-shrink: 0; }
        .hero-mascot::before { content: ''; position: absolute; inset: -8px; border-radius: 50%; background: var(--cream); border: 3px solid rgba(200,160,32,0.5); box-shadow: 0 0 0 8px rgba(200,160,32,0.08), 0 0 80px rgba(200,160,32,0.25), 0 0 40px rgba(30,92,30,0.4); }
        .hero-mascot img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: contain; border-radius: 50%; animation: mascot-float 3.2s ease-in-out infinite; }
        @keyframes mascot-float { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-14px) rotate(1deg); } }
        .nav-mascot { width: 38px; height: 38px; border-radius: 50%; background: var(--cream); object-fit: contain; border: 2px solid rgba(200,160,32,0.5); flex-shrink: 0; }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        @media (max-width: 1024px) { .props-grid { grid-template-columns: repeat(2,1fr); } .products-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 768px) {
          nav { padding: 1rem 1.25rem; } .nav-badge { font-size: 0.62rem; padding: 0.28rem 0.65rem; }
          .hero { padding: 4rem 1.25rem 3rem; min-height: 85vh; } .hero-mascot { width: 240px; height: 240px; margin-bottom: 2rem; }
          .hero-label { font-size: 0.62rem; letter-spacing: 2px; padding: 0.35rem 0.9rem; margin-bottom: 1.25rem; }
          .hero-soon { letter-spacing: 3px; margin-bottom: 0.75rem; } .hero-brand { letter-spacing: 5px; -webkit-text-stroke: 1px rgba(200,160,32,0.5); margin-bottom: 1.5rem; }
          .hero-sub { font-size: 0.95rem; margin-bottom: 2rem; } .hero-cta { padding: 0.9rem 2rem; font-size: 0.8rem; }
          .hero-location { margin-top: 1.75rem; font-size: 0.7rem; letter-spacing: 1.5px; }
          .props, .products, .contact { padding: 3.5rem 1.25rem; } .section-title { margin-bottom: 2.25rem; }
          .props-grid { grid-template-columns: 1fr 1fr; gap: 1.25rem; } .prop-card { padding: 1.6rem 1.3rem; }
          .products-grid { grid-template-columns: 1fr 1fr; gap: 1.25rem; } .form-row { grid-template-columns: 1fr; }
          .direct-contact { gap: 0.75rem; } .dc-btn { font-size: 0.78rem; padding: 0.65rem 1rem; }
          footer { padding: 2rem 1.25rem; } .footer-contact { gap: 1.25rem; flex-direction: column; align-items: center; }
          .wa-float { padding: 0.85rem; border-radius: 50%; bottom: 1.25rem; right: 1.25rem; } .wa-float span { display: none; }
        }
        @media (max-width: 480px) {
          .nav-logo { font-size: 1.6rem; letter-spacing: 3px; } .nav-badge { display: none; }
          .hero { padding: 3.5rem 1rem 2.5rem; } .hero-mascot { width: 190px; height: 190px; margin-bottom: 1.5rem; }
          .hero-soon { letter-spacing: 2px; } .hero-brand { letter-spacing: 3px; -webkit-text-stroke: 1px rgba(200,160,32,0.4); } .hero-sub { font-size: 0.9rem; }
          .hero-cta { display: block; text-align: center; padding: 1rem; }
          .props, .products, .contact { padding: 3rem 1rem; }
          .props-grid { grid-template-columns: 1fr; } .products-grid { grid-template-columns: 1fr; }
          .prop-card { padding: 1.4rem 1.2rem; } .direct-contact { flex-direction: column; align-items: stretch; }
          .dc-btn { justify-content: center; } input, select, textarea { font-size: 1rem; }
          .footer-logo { font-size: 2rem; letter-spacing: 4px; }
        }
      `}</style>

      <div className="pattern-strip" />

      <a className="wa-float" href={WA_LINK} target="_blank" rel="noopener">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>WhatsApp</span>
      </a>

      <nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coquito.jpeg" alt="Coquito" className="nav-mascot" />
          <div className="nav-logo">COQUEROS</div>
        </div>
        <div className="nav-badge">B2B &amp; Mayoreo</div>
      </nav>

      <ScrollReveal>
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-label">Caracas, Venezuela · Próximamente</div>
            <div className="hero-mascot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/coquito.jpeg" alt="Coquito, mascota de Coqueros" />
            </div>
            <div className="hero-soon">PRÓXIMAMENTE<br /><span>ONLINE</span></div>
            <div className="hero-brand">COQUEROS</div>
            <p className="hero-sub">Bebidas premium de coco para distribuidores, cadenas de retail, restaurantes y operadores de food service. La frescura del trópico, la seriedad del negocio.</p>
            <a href="#contacto" className="hero-cta">Hablar de Negocios</a>
            <p className="hero-location">Producción &amp; Distribución · <span>Caracas, Venezuela</span></p>
          </div>
        </section>

        <div className="divider" />

        <section className="props">
          <div className="props-inner">
            <p className="section-label reveal">Por qué Coqueros</p>
            <h2 className="section-title reveal">VENTAJAS PARA<br />TU NEGOCIO</h2>
            <div className="props-grid">
              <div className="prop-card reveal"><span className="prop-icon">🥥</span><h3>Producto Fresco</h3><p>Coco 100% natural, sin conservantes artificiales. Calidad trazable desde el origen hasta tu operación.</p></div>
              <div className="prop-card reveal"><span className="prop-icon">🚛</span><h3>Distribución B2B</h3><p>Logística directa para mayoristas, supermercados, cadenas de restaurantes y puntos de venta en Caracas y el interior.</p></div>
              <div className="prop-card reveal"><span className="prop-icon">📦</span><h3>Volumen &amp; Flexibilidad</h3><p>Pedidos por volumen adaptados a tu ciclo de inventario. Condiciones comerciales pensadas para distribuidores.</p></div>
              <div className="prop-card reveal"><span className="prop-icon">🤝</span><h3>Alianzas Estratégicas</h3><p>Buscamos socios de largo plazo: exclusividades regionales, private label y programas de co-branding disponibles.</p></div>
            </div>
          </div>
        </section>

        <section className="products">
          <div className="products-inner">
            <p className="section-label reveal">Portafolio</p>
            <h2 className="section-title reveal">LÍNEA DE PRODUCTOS</h2>
            <div className="products-grid">
              <div className="prod-card reveal"><span className="prod-icon">🥤</span><h3>Agua de Coco</h3><p>Natural, isotónica, sin azúcar añadida.</p><span className="prod-tag">Disponible</span></div>
              <div className="prod-card reveal"><span className="prod-icon">🧃</span><h3>Bebida de Coco</h3><p>Con pulpa, en diferentes presentaciones.</p><span className="prod-tag">Disponible</span></div>
              <div className="prod-card reveal"><span className="prod-icon">🍹</span><h3>Cocteles Ready-to-Drink</h3><p>Formatos listos para food service y retail.</p><span className="prod-tag">Próximamente</span></div>
              <div className="prod-card reveal"><span className="prod-icon">🏷️</span><h3>Private Label</h3><p>Tu marca, nuestra producción. Mínimos a convenir.</p><span className="prod-tag">A solicitud</span></div>
            </div>
          </div>
        </section>

        <section className="contact" id="contacto">
          <div className="contact-inner">
            <p className="section-label reveal">Empecemos</p>
            <h2 className="section-title reveal">HAGAMOS NEGOCIOS</h2>
            <p className="contact-desc reveal">¿Distribuidora, cadena de supermercados, restaurante o importador?<br />Cuéntanos tu operación y te respondemos en menos de 24 horas.</p>
            <div className="direct-contact reveal">
              <a className="dc-btn dc-btn--wa" href={WA_LINK} target="_blank" rel="noopener">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                +58 412 396 6330
              </a>
              <a className="dc-btn dc-btn--mail" href="mailto:coqueros.ve@gmail.com">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                coqueros.ve@gmail.com
              </a>
              <a className="dc-btn dc-btn--ig" href="https://www.instagram.com/coqueros.ve/" target="_blank" rel="noopener">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                @coqueros.ve
              </a>
            </div>
            <form action="https://formsubmit.co/coqueros.ve@gmail.com" method="POST" className="reveal">
              <input type="hidden" name="_subject" value="[Coqueros B2B] Nueva consulta de negocios" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />
              <div className="form-row">
                <input type="text" name="nombre" placeholder="Nombre y Apellido" required />
                <input type="text" name="empresa" placeholder="Empresa / Razón Social" required />
              </div>
              <div className="form-row">
                <input type="email" name="email" placeholder="Correo Electrónico" required />
                <input type="tel" name="telefono" placeholder="Teléfono / WhatsApp" />
              </div>
              <select name="tipo_negocio" required defaultValue="">
                <option value="" disabled>Tipo de negocio</option>
                <option>Distribuidora / Mayorista</option>
                <option>Cadena de Supermercados / Retail</option>
                <option>Restaurante / Food Service</option>
                <option>Importador / Exportador</option>
                <option>Hotel / Turismo</option>
                <option>Otro</option>
              </select>
              <textarea name="mensaje" placeholder="Cuéntanos sobre tu operación..." />
              <button type="submit" className="form-submit">Enviar Consulta →</button>
              <p className="form-note">Solo negocios. Respondemos en &lt; 24 h hábiles.</p>
            </form>
          </div>
        </section>

        <footer>
          <div className="footer-logo">COQUEROS</div>
          <p className="footer-tagline">Bebidas de Coco · Caracas, Venezuela</p>
          <div className="footer-contact">
            <a href="https://wa.me/584123966330" target="_blank" rel="noopener">WhatsApp +58 412 396 6330</a>
            <a href="mailto:coqueros.ve@gmail.com">coqueros.ve@gmail.com</a>
            <a href="https://www.instagram.com/coqueros.ve/" target="_blank" rel="noopener">@coqueros.ve</a>
          </div>
          <p className="footer-copy">© 2026 Coqueros · Todos los derechos reservados</p>
        </footer>
      </ScrollReveal>
    </>
  )
}
