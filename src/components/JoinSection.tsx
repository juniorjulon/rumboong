import { motion } from "framer-motion";
import { Heart, Handshake, School } from "lucide-react";

const columns = [
  {
    icon: Heart,
    emoji: "💙",
    title: "Dona",
    desc: "Tu aporte permite que más jóvenes accedan a orientación vocacional de calidad.",
    cta: "Ver QR de donación",
    note: "QR placeholder — reemplazar con imagen real de Yape/Plin",
  },
  {
    icon: Handshake,
    emoji: "🤝",
    title: "Alianzas estratégicas",
    desc: "Empresas, universidades y ONGs que quieran sumarse a nuestra causa.",
    cta: "Escríbenos",
  },
  {
    icon: School,
    emoji: "🏫",
    title: "Lleva Rumbo a tu colegio",
    desc: "Organizamos talleres gratuitos de orientación vocacional en tu institución.",
    cta: "Solicitar taller",
  },
];

const JoinSection = () => (
  <section id="unete" className="py-24 bg-primary">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="inline-block font-heading text-xs font-semibold tracking-widest uppercase text-accent mb-4">
          Sé parte del cambio
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary-foreground">
          Únete a la causa
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {columns.map((col, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="bg-card rounded-xl p-8 text-center shadow-lg"
          >
            <span className="text-4xl mb-4 block">{col.emoji}</span>
            <h3 className="font-heading text-xl font-bold text-foreground mb-3">{col.title}</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">{col.desc}</p>

            {col.note && (
              <div className="w-32 h-32 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                QR Placeholder
              </div>
            )}

            <a
              href="mailto:contacto@rumbo.org.pe"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-semibold px-6 py-3 text-sm hover:bg-secondary transition"
            >
              {col.cta}
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default JoinSection;
