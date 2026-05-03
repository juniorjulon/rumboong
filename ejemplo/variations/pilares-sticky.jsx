/* Variación B · Pilares — Sticky / scroll-narrative
   Lista vertical con un panel sticky que muestra el pilar activo.
   En móvil colapsa a stack con dividers elegantes. */

const PilaresSticky = () => {
  const pilares = [
    {
      n: '01',
      title: 'Identidad y Propósito',
      sub: 'Antes del qué, viene el quién.',
      desc: 'Ayudamos a cada joven a conocerse y definir su camino con claridad. Un proyecto de vida sólido empieza por entender talentos, valores y motivaciones propias.',
      keyword: 'Quién soy',
    },
    {
      n: '02',
      title: 'Bienestar y Equilibrio',
      sub: 'La salud mental también es preparación.',
      desc: 'Herramientas emocionales para una transición saludable y sostenible. Hablamos de manejo del estrés, autoestima y construcción de hábitos que perduran.',
      keyword: 'Cómo me cuido',
    },
    {
      n: '03',
      title: 'Habilidades para el Futuro',
      sub: 'Lo que el currículo escolar no cubre.',
      desc: 'Preparación en competencias críticas del mercado laboral actual: pensamiento crítico, comunicación efectiva, alfabetización digital y trabajo colaborativo.',
      keyword: 'Qué sé hacer',
    },
    {
      n: '04',
      title: 'Acceso a Oportunidades',
      sub: 'Información que abre puertas.',
      desc: 'Conexión directa con becas, programas y redes de apoyo. Porque el talento ya existe; lo que falta muchas veces es saber a qué puerta tocar.',
      keyword: 'Hasta dónde puedo llegar',
    },
  ];

  const [active, setActive] = React.useState(0);
  const refs = React.useRef([]);

  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(+e.target.dataset.i);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section className="pb-section">
      <style>{`
        .pb-section {
          background: var(--bg-cream);
          padding: clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px);
          font-family: var(--font-body);
        }
        .pb-inner { max-width: 1240px; margin: 0 auto; }
        .pb-head {
          margin-bottom: clamp(48px, 6vw, 72px);
          max-width: 720px;
        }
        .pb-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 4.5vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 14px 0 16px;
          font-weight: 600;
          color: var(--ink);
        }
        .pb-title em {
          font-style: italic;
          font-family: 'Source Serif Pro', 'Georgia', serif;
          color: var(--rumbo-blue);
          font-weight: 500;
        }
        .pb-lede {
          color: var(--ink-soft);
          font-size: clamp(15px, 1.3vw, 17px);
          line-height: 1.55;
          margin: 0;
        }

        .pb-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 880px) {
          .pb-layout {
            grid-template-columns: 0.9fr 1.1fr;
            gap: 80px;
            align-items: start;
          }
        }

        .pb-sticky-wrap {
          position: relative;
        }
        @media (min-width: 880px) {
          .pb-sticky-wrap {
            position: sticky;
            top: 80px;
            height: fit-content;
          }
        }

        .pb-display {
          background: var(--rumbo-navy);
          color: white;
          border-radius: var(--r-lg);
          padding: clamp(28px, 4vw, 48px);
          aspect-ratio: 1 / 1.05;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .pb-display::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 110% -10%, rgba(232, 130, 91, 0.25) 0%, transparent 50%);
          pointer-events: none;
        }
        .pb-display-num {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.2em;
          color: var(--rumbo-amber);
          font-weight: 500;
        }
        .pb-display-keyword {
          font-family: var(--font-display);
          font-size: clamp(38px, 5vw, 62px);
          font-weight: 500;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: white;
          position: relative;
        }
        .pb-display-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          position: relative;
        }
        .pb-display-tag {
          font-family: var(--font-display);
          font-size: 14px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          font-weight: 500;
        }
        .pb-progress {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .pb-progress span {
          width: 18px;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.2);
          transition: background .35s, width .35s;
        }
        .pb-progress span.on {
          background: var(--rumbo-amber);
          width: 28px;
        }

        .pb-fade {
          animation: pbf .5s ease;
        }
        @keyframes pbf {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }

        .pb-list {
          display: flex;
          flex-direction: column;
        }
        .pb-item {
          padding: clamp(22px, 3vw, 36px) 0;
          border-top: 1px solid rgba(15, 26, 43, 0.12);
          display: flex;
          gap: 24px;
          align-items: flex-start;
          transition: opacity .35s;
        }
        .pb-item:last-child { border-bottom: 1px solid rgba(15, 26, 43, 0.12); }
        .pb-item.dimmed { opacity: 0.4; }

        .pb-item-num {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.16em;
          color: var(--rumbo-blue);
          font-weight: 500;
          padding-top: 6px;
          flex-shrink: 0;
          min-width: 36px;
        }
        .pb-item-body {
          flex: 1;
        }
        .pb-item h3 {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.4vw, 30px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
          color: var(--ink);
        }
        .pb-item-sub {
          font-family: var(--font-display);
          font-size: 16px;
          color: var(--rumbo-blue);
          margin: 0 0 12px;
          font-weight: 500;
        }
        .pb-item p {
          color: var(--ink-soft);
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
          max-width: 50ch;
        }

        @media (max-width: 879px) {
          .pb-sticky-wrap { display: none; }
          .pb-mobile-display {
            display: block;
            background: var(--rumbo-navy);
            color: white;
            border-radius: var(--r-md);
            padding: 20px 22px;
            margin-bottom: 16px;
          }
          .pb-mobile-keyword {
            font-family: var(--font-display);
            font-size: 22px;
            font-weight: 500;
            margin-top: 4px;
          }
        }
        @media (min-width: 880px) { .pb-mobile-display { display: none; } }
      `}</style>

      <div className="pb-inner">
        <header className="pb-head">
          <span className="eyebrow">Nuestros pilares</span>
          <h2 className="pb-title">Cuatro dimensiones, <em>un mismo joven</em>.</h2>
          <p className="pb-lede">No trabajamos por temas sueltos. Cada pilar atraviesa todo lo que hacemos, porque un proyecto de vida sólido nace de la suma de todos.</p>
        </header>

        <div className="pb-layout">
          <div className="pb-sticky-wrap">
            <div className="pb-display" key={active}>
              <div className="pb-display-num pb-fade">PILAR {pilares[active].n}</div>
              <div className="pb-display-keyword pb-fade">{pilares[active].keyword}</div>
              <div className="pb-display-meta">
                <span className="pb-display-tag pb-fade">{pilares[active].title}</span>
                <div className="pb-progress">
                  {pilares.map((_, i) => <span key={i} className={i <= active ? 'on' : ''} />)}
                </div>
              </div>
            </div>
          </div>

          <div className="pb-list">
            {pilares.map((p, i) => (
              <div key={p.n} className="pb-mobile-display" style={{ display: active === i ? undefined : 'none' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--rumbo-amber)' }}>PILAR {p.n}</div>
                <div className="pb-mobile-keyword">{p.keyword}</div>
              </div>
            ))}
            {pilares.map((p, i) => (
              <article
                key={p.n}
                ref={(el) => (refs.current[i] = el)}
                data-i={i}
                className={`pb-item ${active !== i ? 'dimmed' : ''}`}
              >
                <span className="pb-item-num">{p.n}</span>
                <div className="pb-item-body">
                  <h3>{p.title}</h3>
                  <p className="pb-item-sub">{p.sub}</p>
                  <p>{p.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

window.PilaresSticky = PilaresSticky;
