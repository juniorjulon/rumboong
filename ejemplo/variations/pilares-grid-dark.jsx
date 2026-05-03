/* Variación A · Pilares — Grid sobre fondo oscuro institucional
   Contraste fuerte vs sección de Niveles (que es clara).
   4 pilares en grid 2x2, con iconos line-art y hover lift. */

const PilaresGrid = () => {
  const pilares = [
    {
      n: '01',
      title: 'Identidad y Propósito',
      desc: 'Ayudamos a cada joven a conocerse y definir su camino con claridad, conectando intereses, talentos y vocación.',
      icon: 'compass',
    },
    {
      n: '02',
      title: 'Bienestar y Equilibrio',
      desc: 'Herramientas emocionales para una transición saludable y sostenible. La salud mental también es preparación.',
      icon: 'heart',
    },
    {
      n: '03',
      title: 'Habilidades para el Futuro',
      desc: 'Preparación en competencias críticas del mercado laboral actual: pensamiento crítico, comunicación, alfabetización digital.',
      icon: 'spark',
    },
    {
      n: '04',
      title: 'Acceso a Oportunidades',
      desc: 'Conexión directa con becas, programas y redes de apoyo. La meritocracia solo funciona si la información llega a todos.',
      icon: 'key',
    },
  ];

  const [visible, setVisible] = React.useState(new Set());
  const refs = React.useRef([]);
  React.useEffect(() => {
    const io = new IntersectionObserver((e) => {
      e.forEach((x) => x.isIntersecting && setVisible((p) => new Set([...p, +x.target.dataset.i])));
    }, { threshold: 0.25 });
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  const Icon = ({ name }) => {
    const props = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (name === 'compass') return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8L13.5 13.5L7.8 16.2L10.5 10.5L16.2 7.8Z"/></svg>;
    if (name === 'heart') return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
    if (name === 'spark') return <svg {...props}><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/></svg>;
    return <svg {...props}><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2"/></svg>;
  };

  return (
    <section className="pa-section">
      <style>{`
        .pa-section {
          background: var(--rumbo-navy-deep);
          color: white;
          padding: clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px);
          font-family: var(--font-body);
          position: relative;
          overflow: hidden;
        }
        .pa-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 85% 10%, rgba(232, 130, 91, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 10% 90%, rgba(59, 130, 196, 0.18) 0%, transparent 45%);
          pointer-events: none;
        }
        .pa-inner { max-width: 1240px; margin: 0 auto; position: relative; }
        .pa-head {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: clamp(48px, 6vw, 72px);
          align-items: end;
        }
        @media (min-width: 880px) {
          .pa-head { grid-template-columns: 1.2fr 1fr; gap: 60px; }
        }
        .pa-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--rumbo-amber);
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pa-eyebrow::before {
          content: '';
          width: 22px;
          height: 1px;
          background: currentColor;
        }
        .pa-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 4.6vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 14px 0 0;
          font-weight: 600;
          color: white;
        }
        .pa-title em {
          font-style: normal;
          color: var(--rumbo-sky);
        }
        .pa-lede {
          color: rgba(255,255,255,0.7);
          font-size: clamp(15px, 1.3vw, 17px);
          line-height: 1.55;
          margin: 0;
          max-width: 50ch;
        }

        .pa-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--r-lg);
          overflow: hidden;
        }
        @media (min-width: 720px) {
          .pa-grid { grid-template-columns: 1fr 1fr; }
        }

        .pa-card {
          background: var(--rumbo-navy-deep);
          padding: clamp(28px, 3.5vw, 44px);
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity .6s ease, transform .6s ease, background .35s ease;
          min-height: 240px;
        }
        .pa-card.in { opacity: 1; transform: none; }
        .pa-card:hover { background: #0a1f3d; }
        .pa-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--rumbo-sky), var(--rumbo-amber));
          transition: width .5s cubic-bezier(.2,.8,.2,1);
        }
        .pa-card:hover::after { width: 100%; }

        .pa-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .pa-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(59, 130, 196, 0.15);
          color: var(--rumbo-sky);
          display: grid;
          place-items: center;
          border: 1px solid rgba(59, 130, 196, 0.25);
          transition: transform .35s, background .35s;
        }
        .pa-card:hover .pa-icon {
          transform: rotate(-6deg) scale(1.05);
          background: rgba(232, 182, 91, 0.15);
          color: var(--rumbo-amber);
          border-color: rgba(232, 182, 91, 0.3);
        }
        .pa-num {
          font-family: var(--font-mono);
          font-size: 11.5px;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.4);
        }
        .pa-card h3 {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.2vw, 26px);
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0;
          color: white;
        }
        .pa-card p {
          color: rgba(255,255,255,0.65);
          font-size: 14.5px;
          line-height: 1.55;
          margin: 0;
        }
      `}</style>

      <div className="pa-inner">
        <header className="pa-head">
          <div>
            <span className="pa-eyebrow">Nuestros pilares</span>
            <h2 className="pa-title">En qué <em>nos enfocamos</em>.</h2>
          </div>
          <p className="pa-lede">Cuatro principios que atraviesan todo lo que hacemos. No son temas sueltos: son las dimensiones del joven que queremos acompañar.</p>
        </header>

        <div className="pa-grid">
          {pilares.map((p, i) => (
            <article
              key={p.n}
              ref={(el) => (refs.current[i] = el)}
              data-i={i}
              className={`pa-card ${visible.has(i) ? 'in' : ''}`}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="pa-card-head">
                <div className="pa-icon"><Icon name={p.icon} /></div>
                <span className="pa-num">{p.n}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

window.PilaresGrid = PilaresGrid;
