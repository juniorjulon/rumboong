import { motion } from "framer-motion";
import { BookOpen, Users, Compass, Heart, Rocket, Key } from "lucide-react";

const levels = [
  { icon: BookOpen, title: "Información", desc: "Brindamos datos clave sobre becas, carreras y oportunidades." },
  { icon: Users, title: "Formación", desc: "Talleres prácticos en habilidades blandas y técnicas." },
  { icon: Compass, title: "Acompañamiento", desc: "Mentoría personalizada durante la transición." },
];

const pillars = [
  { icon: Heart, title: "Identidad y Propósito", desc: "Ayudamos a cada joven a conocerse y definir su camino." },
  { icon: Compass, title: "Bienestar y Equilibrio", desc: "Herramientas emocionales para una transición saludable." },
  { icon: Rocket, title: "Habilidades para el Futuro", desc: "Preparación en competencias del siglo XXI." },
  { icon: Key, title: "Acceso a Oportunidades", desc: "Conexión con becas, programas y redes de apoyo." },
];

const ValueSection = () => (
  <section id="propuesta" className="py-24 bg-white">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="inline-block font-heading text-xs font-semibold tracking-widest uppercase text-secondary mb-4">
          Nuestra propuesta
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          Tres niveles de impacto
        </h2>
      </motion.div>

      {/* Levels */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {levels.map((level, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="text-center p-8 rounded-xl bg-white border-2 border-light-blue text-foreground"
          >
            <level.icon className="mx-auto mb-4 text-light-blue" size={40} />
            <h3 className="font-heading text-xl font-bold mb-2 text-foreground">{level.title}</h3>
            <p className="font-body text-muted-foreground text-sm">{level.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h3 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
          Nuestros pilares
        </h3>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-xl bg-muted border-l-4 border-l-teal border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
              <pillar.icon className="text-accent-foreground" size={24} />
            </div>
            <h4 className="font-heading text-base font-bold text-foreground mb-2">{pillar.title}</h4>
            <p className="font-body text-sm text-muted-foreground">{pillar.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ValueSection;
