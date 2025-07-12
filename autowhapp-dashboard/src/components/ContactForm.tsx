import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/lib/utils";
import { Send, Mail, Phone, MapPin } from "lucide-react";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const toast = useToast; // Use directly, no invocation

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate form submission
    toast({
      title: "¡Mensaje enviado!",
      description: "Nos pondremos en contacto contigo pronto para agendar tu demo gratuita.",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      company: "",
      message: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contacto" className="py-20 bg-autowhapp-blue">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿Listo para Transformar tu Negocio?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Solicita una demo personalizada y descubre cómo Autowhapp puede
              automatizar tu atención al cliente desde el primer día.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-autowhapp-black mb-6">
                Solicita tu Demo Gratuita
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre completo *
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ej: María González"
                    className="w-full bg-white text-gray-900 border-gray-300 focus:border-autowhapp-blue focus:ring-autowhapp-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Correo electrónico *
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="maria@miempresa.com"
                    className="w-full bg-white text-gray-900 border-gray-300 focus:border-autowhapp-blue focus:ring-autowhapp-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Empresa
                  </label>
                  <Input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Nombre de tu empresa"
                    className="w-full bg-white text-gray-900 border-gray-300 focus:border-autowhapp-blue focus:ring-autowhapp-blue"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cuéntanos sobre tu negocio
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tipo de negocio, número de clientes, necesidades específicas..."
                    className="w-full resize-none bg-white text-gray-900 border-gray-300 focus:border-autowhapp-blue focus:ring-autowhapp-blue"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-autowhapp-blue hover:bg-blue-700 text-white py-3 text-lg group"
                >
                  Solicitar Demo Gratuita
                  <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">
                  ¿Tienes preguntas?
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed mb-8">
                  Nuestro equipo está listo para ayudarte a encontrar la mejor
                  solución para tu negocio. Contáctanos por cualquiera de estos medios.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Email</p>
                    <p className="text-blue-100">autowhapp@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Teléfono</p>
                    <p className="text-blue-100">+54 (911) 1234-5678</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Oficina</p>
                    <p className="text-blue-100">Buenos Aires, Argentina</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6 mt-8">
                <h4 className="text-white font-semibold mb-3">
                  ⚡ Respuesta Garantizada
                </h4>
                <p className="text-blue-100 text-sm">
                  Te contactaremos en menos de 24 horas para agendar tu demo personalizada
                  y responder todas tus preguntas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </section>
  );
};

export default ContactForm;