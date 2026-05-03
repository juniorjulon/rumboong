/* Variación 2 · Niveles — Tabs interactivos con visual showcase
   Más dinámica: tabs en desktop, swipe horizontal en móvil.
   Hero visual con número gigante + content panel lateral. */

const V2NivelesTabs = () => {
  const niveles = [
    {
      n: '01',
      tag: 'Información',
      title: 'Decisiones con base, no con suerte.',
      desc: 'Antes de elegir, hay que conocer. Brindamos datos verificados sobre becas vigentes, panorama de carreras y tendencias del mercado laboral peruano.',
      stats: [
        { v: '+120', l: 'becas mapeadas' },
        { v: '40+', l: 'carreras analizadas' },
        { v: '2026', l: 'data actualizada' },
      ],
      icon: 'compass',
    },
    {
      n: '02',
      tag: 'Formación',
      title: 'Habilidades que el aula no enseña.',
      desc: 'Talleres prácticos donde los estudiantes desarrollan comunicación efectiva, pensamiento crítico, alfabetización digital y proyecto de vida personal.',
      stats: [
        { v: '8', l: 'talleres temáticos' },
        { v: '12h', l: 'de práctica' },
        { v: '100%', l: 'aplicado' },
      ],
      icon: 'spark',
    },
    {
      n: '03',
      tag: 'Acompañamiento',
      title: 'Nadie cruza solo el puente.',
      desc: 'Mentoría 1:1 con profesionales y comunidad activa de pares. Seguimiento durante toda la transición universitaria, no solo al inicio.',
      stats: [
        { v: '1:1', l: 'mentoría' },
        { v: '24/7', l: 'comunidad' },
        { v: '12m', l: 'seguimiento' },
      ],
      icon: 'route',
    },
  ];

  const [active, setActive] = React.useState(0);
  const [counted, setCounted] = React.useState(false);
  const sectionRef = React.useRef(null);

  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setCounted(true); });
    }, { threshold: 0.4 });
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  const Icon = ({ name }) => {
    const stroke = 'currentColor';
    if (name === 'compass') return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8L13.5 13.5L7.8 16.2L10.5 10.5L16.2 7.8Z"/></svg>
    );
    if (name === 'spark') return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.5"/></svg>
    );
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h6a3.5 3.5 0 010 7h-5a3.5 3.5 0 000 7h6"/></svg>
    );
  };

  const Counter = ({ value, animate }) => {
    const [n, setN] = React.useState(0);
    const numericMatch = String(value).match(/(\d+)/);
    const target = numericMatch ? parseInt(numericMatch[1]) : 0;
    const prefix = String(value).split(numericMatch?.[1] ?? '')[0] ?? '';
    const suffix = String(value).split(numericMatch?.[1] ?? '')[1] ?? '';
    React.useEffect(() => {
      if (!animate || !target) { setN(target); return; }
      let s = 0; const dur = 900; const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, [animate, target]);
    if (!numericMatch) return <span>{value}</span>;
    return <span>{prefix}{n}{suffix}</span>;
  };

  return (
    <section className="v2-section" ref={sectionRef}>
      <style>{`
        .v2-section {
          background: var(--rumbo-sky-mist);
          padding: clamp(60px, 8vw, 120px) clamp(20px, 5vw, 80px);
          font-family: var(--font-body);
        }
        .v2-inner { max-width: 1240px; margin: 0 auto; }
        .v2-head {
          text-align: left;
          margin-bottom: clamp(40px, 5vw, 64px);
          max-width: 720px;
        }
        .v2-title {
          font-family: var(--font-display);
          font-size: clamp(34px, 4.6vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 14px 0 16px;
          font-weight: 600;
          color: var(--ink);
        }
        .v2-lede {
          color: var(--ink-soft);
          font-size: clamp(15px, 1.3vw, 17px);
          line-height: 1.55;
          margin: 0;
        }

        .v2-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .v2-tabs::-webkit-scrollbar { display: none; }
        .v2-tab {
          flex-shrink: 0;
          background: transparent;
          border: 1px solid var(--line);
          padding: 12px 18px;
          border-radius: 999px;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--ink-soft);
          font-weight: 500;
          transition: all .25s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .v2-tab .num {
          font-family: var(--font-mono);
          font-size: 11px;
          opacity: 0.6;
        }
        .v2-tab:hover { border-color: var(--rumbo-sky); color: var(--rumbo-navy); }
        .v2-tab.active {
          background: var(--rumbo-navy);
          color: white;
          border-color: var(--rumbo-navy);
        }
        .v2-tab.active .num { opacity: 0.85; }

        .v2-stage {
          background: var(--surface);
          border-radius: var(--r-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          display: grid;
          grid-template-columns: 1fr;
          min-height: 460px;
          border: 1px solid var(--line-soft);
        }
        @media (min-width: 860px) {
          .v2-stage {
            grid-template-columns: 0.95fr 1.1fr;
            min-height: 520px;
          }
        }

        .v2-visual {
          background: linear-gradient(135deg, var(--rumbo-navy) 0%, var(--rumbo-blue) 100%);
          color: white;
          padding: clamp(28px, 4vw, 56px);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 280px;
        }
        .v2-visual::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 100% 0%, rgba(232, 130, 91, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 0% 100%, rgba(59, 130, 196, 0.4) 0%, transparent 50%);
          pointer-events: none;
        }
        .v2-bignum {
          font-family: var(--font-display);
          font-size: clamp(140px, 18vw, 240px);
          font-weight: 200;
          line-height: 0.85;
          letter-spacing: -0.06em;
          color: rgba(255,255,255,0.95);
          position: relative;
          margin-top: -8px;
          font-variant-numeric: tabular-nums;
          transition: transform .5s cubic-bezier(.2,.8,.2,1);
        }
        .v2-icon-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          color: white;
          font-family: var(--font-mono);
          font-size: 11.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          width: max-content;
          position: relative;
        }
        .v2-icon-chip svg { color: var(--rumbo-amber); width: 16px; height: 16px; }
        .v2-tag-foot {
          position: relative;
          font-family: var(--font-display);
          font-size: clamp(28px, 3vw, 38px);
          font-weight: 500;
          letter-spacing: -0.01em;
          color: white;
        }

        .v2-content {
          padding: clamp(28px, 4vw, 48px);
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: space-between;
        }
        .v2-content h3 {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.5vw, 30px);
          line-height: 1.2;
          margin: 0;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.01em;
        }
        .v2-content p {
          color: var(--ink-soft);
          font-size: 15.5px;
          line-height: 1.6;
          margin: 0;
        }
        .v2-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid var(--line-soft);
        }
        .v2-stat-v {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.4vw, 30px);
          font-weight: 600;
          color: var(--rumbo-navy);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .v2-stat-l {
          font-size: 11.5px;
          color: var(--ink-mute);
          margin-top: 6px;
          line-height: 1.3;
          font-family: var(--font-mono);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .v2-fade {
          animation: v2fade .45s ease;
        }
        @keyframes v2fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="v2-inner">
        <header className="v2-head">
          <span className="eyebrow">Nuestra propuesta</span>
          <h2 className="v2-title">Tres niveles que construyen un puente real.</h2>
          <p className="v2-lede">Información, formación y acompañamiento. No los entendemos como pasos sueltos, sino como un único trayecto que cada joven recorre con nosotros.</p>
        </header>

        <div className="v2-tabs" role="tablist">
          {niveles.map((n, i) => (
            <button
              key={n.n}
              role="tab"
              aria-selected={active === i}
              className={`v2-tab ${active === i ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className="num">{n.n}</span>
              {n.tag}
            </button>
          ))}
        </div>

        <div className="v2-stage" key={active}>
          <div className="v2-visual">
            <span className="v2-icon-chip">
              <Icon name={niveles[active].icon} />
              Nivel {niveles[active].n}
            </span>
            <div className="v2-bignum v2-fade">{niveles[active].n}</div>
            <div className="v2-tag-foot v2-fade">{niveles[active].tag}</div>
          </div>
          <div className="v2-content v2-fade">
            <div>
              <h3>{niveles[active].title}</h3>
              <p style={{ marginTop: 14 }}>{niveles[active].desc}</p>
            </div>
            <div className="v2-stats">
              {niveles[active].stats.map((s) => (
                <div key={s.l}>
                  <div className="v2-stat-v"><Counter value={s.v} animate={counted} /></div>
                  <div className="v2-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

window.V2NivelesTabs = V2NivelesTabs;
