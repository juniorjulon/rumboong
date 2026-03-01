import { Instagram, Facebook, Mail } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="font-heading text-2xl font-extrabold mb-2">RUMBO</h3>
            <p className="font-body text-sm text-background/70">
              Transformando decisiones en oportunidades.
            </p>
          </div>

          {/* Redes sociales placeholder — reemplazar con enlaces reales */}
          <div className="flex items-center gap-6">
            <a href="#" aria-label="Instagram" className="text-background/60 hover:text-accent transition-colors">
              <Instagram size={22} />
            </a>
            <a href="#" aria-label="Facebook" className="text-background/60 hover:text-accent transition-colors">
              <Facebook size={22} />
            </a>
            <a href="mailto:contacto@rumbo.org.pe" aria-label="Email" className="text-background/60 hover:text-accent transition-colors">
              <Mail size={22} />
            </a>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 text-center">
          <p className="font-body text-xs text-background/50">
            © {year} RUMBO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
