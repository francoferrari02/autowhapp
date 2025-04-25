/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // Escanea todos los archivos en src/
    ],
    theme: {
      extend: {
        fontFamily: {
          poppins: ['Poppins', 'sans-serif'], // Añadimos la fuente Poppins
        },
        colors: {
          'primary-blue': '#1E3A8A', // Azul oscuro para botones y header
          'secondary-blue': '#2B4B9B', // Para el degradado del header
          'primary-green': '#34C759', // Verde para botones de acción
          'secondary-green': '#2EA44F', // Verde más oscuro para hover
          'primary-red': '#EF4444', // Rojo para botones de eliminar
          'secondary-red': '#DC2626', // Rojo más oscuro para hover
          'light-gray': '#F7F9FC', // Fondo del sidebar
          'gray-600': '#4B5563', // Gris para texto secundario
          'gray-400': '#9CA3AF', // Gris para botones desactivados
          'yellow-500': '#F59E0B', // Amarillo para estado "Preparando"
        },
      },
    },
    plugins: [],
  };