/* Variación 3 · Niveles — Cards horizontales tipo journey
   Visual con flecha/conexión entre niveles, cards que se levantan al hover.
   En móvil: carrusel snap horizontal con indicadores. */

const V3NivelesJourney = () => {
  const niveles = [
    {
      n: '01',
      title: 'Información',
      sub: 'Empezamos por entender el terreno.',
      desc: 'Datos claros sobre becas, carreras y oportunidades reales en Perú.',
      tags: ['Becas', 'Carreras', 'Mercado'],
    },
    {
      n: '02',
      title: 'Formación',
      sub: 'Construimos las herramientas.',
      desc: 'Talleres prácticos en habilidades blandas y técnicas del siglo XXI.',
      tags: ['Soft skills', 'Hard skills', 'Vocación'],
    },
    {
      n: '03',
      title: 'Acompañamiento',
      sub: 'Caminamos junto a cada joven.',
      desc: 'Mentoría personalizada durante toda la transición universitaria.',
      tags: ['Mentoría 1:1', 'Comunidad', 'Seguimiento'],
    },
  ];

  const [hovered, setHovered] = React.useState(null);
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const io = new IntersectionObserver((e) => {
      e.forEach((x) => x.isIntersecting && setVisible(true));
    }, { threshold: 0.2 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className={`v3-section ${visible ? 'in' : ''}`} ref={ref}>
      <style>{`
        .v3-section {
          background: var(--bg);
          padding: clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px);
          font-family: var(--font-body);
          overflow: hidden;
        }
        .v3-inner { max-width: 1320px; margin: 0 auto; }
        .v3-head {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: clamp(40px, 5vw, 64px);
          max-width: 760px;
        }
        .v3-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 4.5vw, 54px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0;
          font-weight: 600;
          color: var(--ink);
        }
        .v3-title .accent { color: var(--rumbo-blue); }
        .v3-lede {
          color: var(--ink-soft);
          font-size: clamp(15px, 1.3vw, 17px);
          line-height: 1.55;
          margin: 0;
        }

        .v3-track {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          position: relative;
        }
        @media (min-width: 760px) {
          .v3-track { grid-template-columns: repeat(3, 1fr); gap: 24px; }
        }

        .v3-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-lg);
          padding: clamp(24px, 3vw, 36px);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
          transition: transform .4s cubic-bezier(.2,.8,.2,1), border-color .3s, box-shadow .4s;
          opacity: 0;
          transform: translateY(28px);
          overflow: hidden;
          min-height: 360px;
        }
        .v3-section.in .v3-card {
          opacity: 1;
          transform: none;
        }
        .v3-card:nth-child(1) { transition-delay: 0ms, .3s, .4s, 0ms; }
        .v3-card:nth-child(2) { transition-delay: 120ms, .3s, .4s, 120ms; }
        .v3-card:nth-child(3) { transition-delay: 240ms, .3s, .4s, 240ms; }

        .v3-card:hover {
          transform: translateY(-6px);
          border-color: var(--rumbo-sky);
          box-shadow: var(--shadow-md);
        }
        .v3-card::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 3px;
          background: linear-gradient(90deg, var(--rumbo-blue), var(--rumbo-sky));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .5s cubic-bezier(.2,.8,.2,1);
        }
        .v3-card:hover::after { transform: scaleX(1); }

        .v3-card.featured {
          background: var(--rumbo-navy);
          color: white;
          border-color: var(--rumbo-navy);
        }
        .v3-card.featured .v3-num { color: rgba(255,255,255,0.9); }
        .v3-card.featured .v3-card-title { color: white; }
        .v3-card.featured .v3-sub { color: rgba(255,255,255,0.85); }
        .v3-card.featured .v3-desc { color: rgba(255,255,255,0.7); }
        .v3-card.featured .v3-tag {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          color: white;
        }
        .v3-card.featured::before {
          content: '';
          position: absolute;
          top: -40%;
          right: -30%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(232, 130, 91, 0.3) 0%, transparent 60%);
          pointer-events: none;
        }

        .v3-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .v3-num {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.18em;
          color: var(--rumbo-blue);
          font-weight: 500;
        }
        .v3-arrow {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--rumbo-sky-soft);
          color: var(--rumbo-navy);
          flex-shrink: 0;
          transition: transform .3s, background .3s;
        }
        .v3-card.featured .v3-arrow { background: rgba(255,255,255,0.15); color: white; }
        .v3-card:hover .v3-arrow { transform: rotate(-45deg); }

        .v3-glyph {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: var(--rumbo-sky-mist);
          color: var(--rumbo-navy);
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 500;
          letter-spacing: -0.02em;
        }
        .v3-card.featured .v3-glyph {
          background: rgba(255,255,255,0.12);
          color: white;
        }

        .v3-card-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 2.6vw, 30px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0;
          color: var(--ink);
        }
        .v3-sub {
          font-family: var(--font-display);
          font-size: 15px;
          color: var(--ink-soft);
          line-height: 1.4;
          margin: 0;
          font-weight: 500;
        }
        .v3-desc {
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--ink-mute);
          margin: 0;
          flex: 1;
        }
        .v3-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: auto;
          padding-top: 8px;
        }
        .v3-tag {
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 999px;
          background: var(--bg-cream);
          border: 1px solid var(--line);
          color: var(--ink-soft);
          font-weight: 500;
        }

        @media (max-width: 759px) {
          .v3-track {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            margin: 0 calc(-1 * clamp(20px, 5vw, 80px));
            padding: 8px clamp(20px, 5vw, 80px);
            gap: 14px;
            scrollbar-width: none;
          }
          .v3-track::-webkit-scrollbar { display: none; }
          .v3-card {
            flex: 0 0 85%;
            scroll-snap-align: start;
          }
        }
      `}</style>

      <div className={`v3-section-content ${visible ? 'in' : ''}`} style={{ display: 'contents' }}></div>

      <div className="v3-inner">
        <header className="v3-head">
          <span className="eyebrow">Nuestra propuesta</span>
          <h2 className="v3-title">Un trayecto en <span className="accent">tres movimientos</span>.</h2>
          <p className="v3-lede">Informar, formar, acompañar. Cada nivel se construye sobre el anterior, asegurando que ningún joven dé un paso sin la base que necesita.</p>
        </header>

        <div className={`v3-track ${visible ? 'in' : ''}`}>
          {niveles.map((n, i) => (
            <article key={n.n} className={`v3-card ${i === 1 ? 'featured' : ''}`}>
              <div className="v3-card-head">
                <span className="v3-num">NIVEL {n.n}</span>
                <span className="v3-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </span>
              </div>
              <div className="v3-glyph">{n.n}</div>
              <h3 className="v3-card-title">{n.title}</h3>
              <p className="v3-sub">{n.sub}</p>
              <p className="v3-desc">{n.desc}</p>
              <div className="v3-tags">
                {n.tags.map((t) => <span key={t} className="v3-tag">{t}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

// Add 'in' state via small wrapper effect — tracking via data attr
window.V3NivelesJourney = V3NivelesJourney;
