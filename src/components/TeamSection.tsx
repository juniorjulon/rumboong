import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";

const team = [
  { name: "Ana Rodríguez", role: "Directora General", line: "Educación y gestión social", linkedin: "#" },
  { name: "Carlos Mendoza", role: "Coordinador Académico", line: "Psicología educativa", linkedin: "#" },
  { name: "Lucía Flores", role: "Directora de Alianzas", line: "Relaciones institucionales", linkedin: "#" },
  { name: "Jorge Quispe", role: "Líder de Voluntarios", line: "Liderazgo juvenil", linkedin: "#" },
];

const TeamSection = () => (
  <section id="equipo" className="py-24">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="inline-block font-heading text-xs font-semibold tracking-widest uppercase text-secondary mb-4">
          Quiénes somos
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
          Nuestro equipo
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {team.map((member, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center group"
          >
            {/* Imagen placeholder — reemplazar con foto real del miembro */}
            <div className="w-32 h-32 mx-auto rounded-full bg-muted mb-4 overflow-hidden border-4 border-accent/30 group-hover:border-accent transition-colors">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-heading text-3xl font-bold">
                {member.name.charAt(0)}
              </div>
            </div>

            <h3 className="font-heading text-base font-bold text-foreground">{member.name}</h3>
            <p className="font-heading text-sm font-semibold text-secondary">{member.role}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{member.line}</p>

            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:text-secondary mt-3 text-sm font-semibold transition-colors"
              aria-label={`LinkedIn de ${member.name}`}
            >
              <Linkedin size={16} /> LinkedIn
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;
