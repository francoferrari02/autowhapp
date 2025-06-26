import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'María González',
      role: 'Dueña de Restaurante',
      company: 'Sabores Tradicionales',
      content: 'Autowhapp ha transformado nuestra atención al cliente. Ahora podemos gestionar reservas automáticamente y nuestros clientes están más satisfechos. ¡Altamente recomendado!',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face',
    },
    {
      name: 'Carlos Mendoza',
      role: 'Gerente de Peluquería',
      company: 'Estilo & Corte',
      content: 'El sistema de reservas es un cambio radical para nuestra peluquería. Ya no perdemos clientes por teléfonos ocupados. El bot responde al instante y agenda las citas perfectamente.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face',
    },
    {
      name: 'Ana Rodríguez',
      role: 'Propietaria de Tienda',
      company: 'Moda Urbana',
      content: 'Desde que implementamos Autowhapp, nuestras ventas han aumentado un 40%. El módulo de pedidos funciona perfecto y los clientes pueden comprar fácilmente por WhatsApp.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-autowhapp-black mb-4">
            Lo que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre cómo Autowhapp está ayudando a negocios como el tuyo a 
            crecer y mejorar su atención al cliente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow relative"
            >
              <Quote className="h-8 w-8 text-autowhapp-blue mb-4" />
              
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 mb-6 italic leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center">
                <img 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-autowhapp-black">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}
                  </p>
                  <p className="text-sm text-autowhapp-blue font-medium">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;