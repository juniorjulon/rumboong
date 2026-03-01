import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "¿Tiene costo para el colegio?",
    a: "No, nuestras intervenciones son completamente gratuitas para las instituciones educativas. Nos financiamos a través de donaciones y alianzas estratégicas.",
  },
  {
    q: "¿Cuánto dura una intervención?",
    a: "Depende del formato. Un taller individual dura entre 2 y 3 horas. Nuestros programas completos pueden extenderse de 4 a 8 semanas con sesiones semanales.",
  },
  {
    q: "¿Está dirigido solo a 5to de secundaria?",
    a: "No. Trabajamos con estudiantes desde 3ro hasta 5to de secundaria, adaptando los contenidos a cada nivel y sus necesidades específicas.",
  },
  {
    q: "¿Entregan materiales?",
    a: "Sí, cada estudiante recibe un kit de trabajo que incluye guías de reflexión, hojas de ruta vocacional y acceso a recursos digitales.",
  },
  {
    q: "¿Cómo se financian?",
    a: "A través de donaciones individuales, patrocinios corporativos y alianzas con universidades e instituciones comprometidas con la educación.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-section-alt">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block font-heading text-xs font-semibold tracking-widest uppercase text-secondary mb-4">
            Resolvemos tus dudas
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
            Preguntas frecuentes
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="font-heading text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5">
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
