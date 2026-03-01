import { motion } from "framer-motion";
import heroImage from "@/assets/hero-rumbo.jpg";

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden">
    {/* Background image with overlay */}
    <div className="absolute inset-0">
      <img src={heroImage} alt="Estudiantes peruanos en taller de orientación vocacional" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-hero-gradient opacity-85" />
    </div>

    <div className="container mx-auto px-4 relative z-10 py-32">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <span className="inline-block font-heading text-sm font-semibold tracking-widest uppercase text-accent mb-6">
          Organización Social · Perú
        </span>

        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight mb-6">
          El talento no debería perderse por falta de información.
        </h1>

        <p className="text-lg md:text-xl text-primary-foreground/90 font-body leading-relaxed mb-4 max-w-2xl">
          Acompañamos a jóvenes en su transición del colegio a la universidad para que tomen
          decisiones informadas y construyan un proyecto de vida sólido.
        </p>

        <p className="text-base text-accent font-heading font-semibold mb-10">
          Somos el puente entre el colegio y el futuro profesional.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#propuesta" className="inline-flex items-center justify-center rounded-lg bg-accent text-accent-foreground font-heading font-semibold px-8 py-4 text-sm hover:brightness-110 transition">
            Conoce cómo ayudamos
          </a>
          <a href="#unete" className="inline-flex items-center justify-center rounded-lg border-2 border-primary-foreground/40 text-primary-foreground font-heading font-semibold px-8 py-4 text-sm hover:bg-primary-foreground/10 transition">
            Lleva Rumbo a tu colegio
          </a>
          <a href="#unete" className="inline-flex items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground font-heading font-semibold px-8 py-4 text-sm hover:bg-primary-foreground/25 transition">
            Únete a la comunidad
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
