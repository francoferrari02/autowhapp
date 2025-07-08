export interface FAQ {
  question: string;
  answer: string;
}

export interface Business {
  id: number;
  name: string;
  type: string;
  location: string;
  address: string;
  hours: { [day: string]: { open: string; close: string } };
  isActive: boolean;
}

export interface Product {
  name: string;
  description: string;
  price: string;
  image?: string;
  id?: number; // Para la edición
}

export interface Order {
  id: number;
  time: string;
  status: 'Recibido' | 'Preparando' | 'Enviado';
  client: string;
  phone: string;
  items: { nombre: string; cantidad: number }[];
  total: number;
  cantidad: string; // Este campo ya no se usa, pero lo dejamos por compatibilidad
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: {
    Recibido: number;
    Preparando: number;
    Enviado: number;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  cliente?: string;
  telefono?: string;
  descripcion?: string;
  backgroundColor?: string;
}

export interface Reservation {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cliente: string;
  telefono: string;
  descripcion: string;
  ocupado: number;
  mesa?: string; // Para restaurantes
  personas?: number; // Número de personas
}

export interface TimeSlot {
  time: string;
  reservations: Reservation[];
  capacity: number;
  available: number;
}