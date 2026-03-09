import { motion } from "framer-motion";
import { CalendarDays, Users, Quote } from "lucide-react";
import activity1 from "@/assets/activity-1.jpg";
import activity2 from "@/assets/activity-2.jpg";

const activities = [
  {
    school: "I.E. San Martín de Porres",
    date: "Marzo 2025",
    students: 120,
    workshop: "Descubre tu vocación",
    image: activity1,
    testimonial: "Nunca nadie nos había explicado las opciones que teníamos. Fue increíble.",
  },
  {
    school: "Colegio Nacional Juana Alarco",
    date: "Mayo 2025",
    students: 85,
    workshop: "Habilidades para el futuro",
    image: activity2,
    testimonial: "Me ayudó a entender que mi futuro depende de las decisiones que tomo hoy.",
  },
];

const ActivitiesSection = () => (
  <section id="actividades" className="py-24 bg-primary">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="inline-block font-heading text-xs font-semibold tracking-widest uppercase text-primary-foreground/70 mb-4">
          En acción
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-primary-foreground">
          Nuestras actividades
        </h2>
      </motion.div>

      <div className="space-y-12 max-w-4xl mx-auto">
        {activities.map((act, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl overflow-hidden shadow-md border border-border flex flex-col md:flex-row"
          >
            {/* Image placeholder — reemplazar con foto real del evento */}
            <div className="md:w-2/5 h-56 md:h-auto">
              <img src={act.image} alt={`Taller ${act.workshop} en ${act.school}`} className="w-full h-full object-cover" />
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">{act.school}</h3>
              <p className="font-heading text-sm font-semibold text-secondary mb-4">{act.workshop}</p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5"><CalendarDays size={16} /> {act.date}</span>
                <span className="flex items-center gap-1.5"><Users size={16} /> {act.students} estudiantes</span>
              </div>

              <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground text-sm">
                <Quote size={14} className="inline mr-1 text-accent" />
                {act.testimonial}
              </blockquote>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ActivitiesSection;
