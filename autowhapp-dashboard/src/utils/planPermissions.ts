// Definición de módulos permitidos por plan
export interface PlanPermissions {
  [key: string]: string[];
}

export const PLAN_PERMISSIONS: PlanPermissions = {
  'Plan Servicios': ['config', 'reservations', 'reminders'],
  'Plan Servicios Plus': ['config', 'reservations', 'reminders', 'analytics'],
  'Plan Tienda': ['config', 'orders', 'analytics'],
  'Plan Tienda Plus': ['config', 'orders', 'analytics', 'payments'],
  'Plan Premium': ['config', 'orders', 'analytics', 'reservations', 'reminders', 'payments'],
  'Plan Personalizado': ['config', 'orders', 'analytics', 'reservations', 'reminders', 'payments'],
};

// Función para verificar si un plan tiene acceso a un módulo
export const hasModuleAccess = (plan: string | undefined, module: string): boolean => {
  if (!plan) return false;
  
  const allowedModules = PLAN_PERMISSIONS[plan];
  if (!allowedModules) return false;
  
  return allowedModules.includes(module);
};

// Función para obtener módulos permitidos por plan
export const getAllowedModules = (plan: string | undefined): string[] => {
  if (!plan) return ['config']; // Solo chatbot por defecto
  
  return PLAN_PERMISSIONS[plan] || ['config'];
};

// Función para obtener el nombre del módulo en español
export const getModuleName = (moduleId: string): string => {
  const moduleNames: { [key: string]: string } = {
    'config': 'Chatbot',
    'orders': 'Pedidos',
    'analytics': 'Analíticas',
    'reservations': 'Reservas',
    'reminders': 'Recordatorios',
    'payments': 'Pagos',
  };
  
  return moduleNames[moduleId] || moduleId;
};
