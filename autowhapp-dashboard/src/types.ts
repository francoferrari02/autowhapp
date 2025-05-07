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
  items: string;
  total: string;
  cantidad: number;
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