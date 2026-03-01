import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const problems = [
  "No conocen opciones de becas.",
  "Eligen carreras por presión social.",
  "No entienden el mercado laboral.",
  "No desarrollan habilidades prácticas tempranas.",
  "La transición universitaria es desordenada.",
];

const ProblemSection = () => (
  <section id="problema" className="py-24 bg-section-alt">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="inline-block font-heading text-xs font-semibold tracking-widest uppercase text-secondary mb-4">
          La realidad
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
          Muchos jóvenes toman decisiones a ciegas.
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {problems.map((problem, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex items-start gap-4 bg-card p-6 rounded-lg shadow-sm border border-border"
          >
            <AlertTriangle className="text-accent shrink-0 mt-1" size={22} />
            <p className="text-foreground font-body">{problem}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
