/* Variación 1 · Niveles — Timeline editorial vertical
   Profesional, calmada, números grandes tipográficos.
   En móvil: stack vertical con timeline lateral. */

const V1NivelesTimeline = () => {
  const niveles = [
    {
      n: '01',
      kicker: 'Punto de partida',
      title: 'Información',
      desc: 'Brindamos datos clave sobre becas, carreras y oportunidades reales para que cada decisión esté respaldada por evidencia, no por intuición.',
      bullets: ['Mapeo de becas Pronabec', 'Catálogo de carreras', 'Mercado laboral actual'],
    },
    {
      n: '02',
      kicker: 'Construcción',
      title: 'Formación',
      desc: 'Talleres prácticos en habilidades blandas y técnicas del siglo XXI: comunicación, pensamiento crítico, herramientas digitales y proyecto de vida.',
      bullets: ['Habilidades blandas', 'Competencias técnicas', 'Proyecto de vida'],
    },
    {
      n: '03',
      kicker: 'Transición',
      title: 'Acompañamiento',
      desc: 'Mentoría personalizada durante toda la transición universitaria, para que ningún joven enfrente esta etapa sin guía.',
      bullets: ['Mentoría 1:1', 'Comunidad activa', 'Seguimiento continuo'],
    },
  ];

  const [visible, setVisible] = React.useState(new Set());
  const refs = React.useRef([]);

  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible((prev) => new Set([...prev, +e.target.dataset.idx]));
        }
      });
    }, { threshold: 0.3 });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section className="v1-section">
      <style>{`
        .v1-section {
          background: var(--bg);
          padding: clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px);
          font-family: var(--font-body);
        }
        .v1-inner { max-width: 1200px; margin: 0 auto; }
        .v1-head {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: clamp(48px, 6vw, 80px);
        }
        @media (min-width: 880px) {
          .v1-head { grid-template-columns: 1fr 1.4fr; gap: 60px; align-items: end; }
        }
        .v1-title {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 64px);
          line-height: 1.02;
          letter-spacing: -0.02em;
          margin: 16px 0 0;
          color: var(--ink);
          font-weight: 600;
        }
        .v1-title em {
          font-style: normal;
          color: var(--rumbo-blue);
          font-family: var(--font-display);
        }
        .v1-lede {
          font-size: clamp(16px, 1.4vw, 19px);
          line-height: 1.5;
          color: var(--ink-soft);
          max-width: 52ch;
        }
        .v1-timeline {
          position: relative;
        }
        .v1-row {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 20px;
          padding: 32px 0;
          border-top: 1px solid var(--line);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .v1-row.in { opacity: 1; transform: none; }
        .v1-row:last-child { border-bottom: 1px solid var(--line); }
        @media (min-width: 880px) {
          .v1-row {
            grid-template-columns: 140px 1fr 1fr;
            gap: 48px;
            padding: 56px 0;
            align-items: start;
          }
        }
        .v1-num {
          font-family: var(--font-display);
          font-size: clamp(48px, 6vw, 88px);
          font-weight: 300;
          line-height: 0.9;
          color: var(--rumbo-navy);
          letter-spacing: -0.04em;
          font-variant-numeric: tabular-nums;
        }
        .v1-row.in .v1-num {
          background: linear-gradient(180deg, var(--rumbo-blue) 0%, var(--rumbo-navy) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .v1-mid h3 {
          font-family: var(--font-display);
          font-size: clamp(24px, 3vw, 36px);
          margin: 0 0 6px;
          letter-spacing: -0.01em;
          font-weight: 600;
          color: var(--ink);
        }
        .v1-kicker {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--rumbo-sky);
          font-weight: 500;
        }
        .v1-mid p {
          color: var(--ink-soft);
          font-size: 15.5px;
          line-height: 1.55;
          margin: 12px 0 0;
          max-width: 38ch;
        }
        .v1-bullets {
          list-style: none;
          padding: 0;
          margin: 16px 0 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .v1-bullets li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14.5px;
          color: var(--ink);
          padding: 12px 16px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-sm);
          transition: border-color .25s, transform .25s;
        }
        .v1-bullets li:hover { border-color: var(--rumbo-sky); transform: translateX(4px); }
        .v1-bullets li::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--rumbo-blue);
          flex-shrink: 0;
        }
        @media (max-width: 879px) {
          .v1-row .v1-num { font-size: 56px; }
        }
      `}</style>
      <div className="v1-inner">
        <header className="v1-head">
          <div>
            <span className="eyebrow">Nuestra propuesta</span>
            <h2 className="v1-title">Cómo <em>trabajamos</em>, paso a paso.</h2>
          </div>
          <p className="v1-lede">
            Acompañamos a cada joven en tres niveles secuenciales. Cada uno construye sobre el anterior, formando un puente real entre el colegio y el futuro profesional.
          </p>
        </header>

        <div className="v1-timeline">
          {niveles.map((n, i) => (
            <article
              key={n.n}
              ref={(el) => (refs.current[i] = el)}
              data-idx={i}
              className={`v1-row ${visible.has(i) ? 'in' : ''}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="v1-num">{n.n}</div>
              <div className="v1-mid">
                <span className="v1-kicker">{n.kicker}</span>
                <h3>{n.title}</h3>
                <p>{n.desc}</p>
              </div>
              <ul className="v1-bullets">
                {n.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

window.V1NivelesTimeline = V1NivelesTimeline;
