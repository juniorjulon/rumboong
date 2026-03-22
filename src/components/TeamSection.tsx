import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";
import CardCarousel from "./CardCarousel";

import sheylaCampos from "@/assets/team/sheyla-campos.jpg";
import juniorJulon from "@/assets/team/junior-julon.jpg";
import luceritoMalpartida from "@/assets/team/lucerito-malpartida.jpg";
import marianaMartinez from "@/assets/team/mariana-martinez.jpg";
import nicolContreras from "@/assets/team/nicol-contreras.jpg";
import mariaArias from "@/assets/team/maria-arias.jpg";
import breinnerRamos from "@/assets/team/breinner-ramos.jpg";
import gabrielaContreras from "@/assets/team/gabriela-contreras.jpg";

const team = [
  {
    name: "Sheyla Campos",
    role: "Coordinadora General",
    line: "Ingeniera Empresarial de la Universidad del Pacífico | Strategy Analyst en Rappi",
    linkedin: "https://linkedin.com/in/sheyla-campos-gonzales",
    photo: sheylaCampos,
  },
  {
    name: "Junior Julón",
    role: "Coordinador General & Líder de Finanzas",
    line: "Financista de la Universidad del Pacífico | Analista de Estrategia de Inversiones en Rimac Seguros",
    linkedin: "https://www.linkedin.com/in/juniorjulon/",
    photo: juniorJulon,
  },
  {
    name: "Mariana Martinez",
    role: "Líder de Comunicaciones y Marketing",
    line: "Ingeniera Empresarial de la Universidad del Pacífico | Business & Strategy Consultant en Minsait",
    linkedin: "https://www.linkedin.com/in/marianamartinezd/",
    photo: marianaMartinez,
  },
  {
    name: "Lucerito Malpartida",
    role: "Líder de Comunicaciones y Marketing",
    line: "Ingeniera de la Información de la Universidad del Pacífico | B2B Process & Transformation Lead en Pepsico",
    linkedin: "https://www.linkedin.com/in/luceritomj/",
    photo: luceritoMalpartida,
  },
  {
    name: "Breinner Ramos",
    role: "Líder de Operaciones y Proyectos",
    line: "Ingeniero Empresarial de la Universidad del Pacífico | Consultor & Account Executive en Tuxpas",
    linkedin: "https://www.linkedin.com/in/breinner-ramos-rodriguez/",
    photo: breinnerRamos,
  },
  {
    name: "Maria Arias",
    role: "Líder de Operaciones y Proyectos",
    line: "Ingeniera de la Información de la Universidad del Pacífico | Consultora de Analítica en Pacífico Seguros",
    linkedin: "https://www.linkedin.com/in/maria-emilia-arias-condori/",
    photo: mariaArias,
  },
  {
    name: "Nicol Contreras",
    role: "Líder de Gestión del Aprendizaje",
    line: "Ingeniera Empresarial de la Universidad del Pacífico | BSc Management & Digital Innovation de la Universidad de Londres",
    linkedin: "https://www.linkedin.com/in/nicol-guadalupe-contreras-mendoza-20351921a",
    photo: nicolContreras,
  },
  {
    name: "Gabriela Contreras",
    role: "Coordinadora de Comunicaciones y Marketing",
    line: "Estudiante de Marketing de la Universidad de Lima",
    linkedin: "https://www.linkedin.com/in/nicol-guadalupe-contreras-mendoza-20351921a",
    photo: gabrielaContreras,
  },
];

const MemberCard = ({ member }: { member: typeof team[number] }) => (
  <div className="text-center group">
    <div className="w-32 h-32 mx-auto rounded-full bg-muted mb-4 overflow-hidden border-4 border-accent/30 group-hover:border-accent transition-colors">
      <img
        src={member.photo}
        alt={member.name}
        className="w-full h-full object-cover"
      />
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
  </div>
);

const TeamSection = () => (
  <section id="equipo" className="py-24 bg-background">
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

      {/* Desktop: grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {team.map((member, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <MemberCard member={member} />
          </motion.div>
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="sm:hidden">
        <CardCarousel>
          {team.map((member, i) => (
            <MemberCard key={i} member={member} />
          ))}
        </CardCarousel>
      </div>
    </div>
  </section>
);

export default TeamSection;
