import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext';
import {
  ChatBubbleBottomCenterTextIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CalendarIcon,
  BellIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  selected: 'config' | 'orders' | 'analytics' | 'reservations' | 'reminders';
}

const NAV_ITEMS = [
  { id: 'config' as const, label: 'Chatbot', icon: ChatBubbleBottomCenterTextIcon, path: '/dashboard' },
  { id: 'orders' as const, label: 'Pedidos', icon: ShoppingCartIcon, path: '/orders' },
  { id: 'analytics' as const, label: 'Analíticas', icon: ChartBarIcon, path: '/analytics' },
  { id: 'reservations' as const, label: 'Reservas', icon: CalendarIcon, path: '/reservations' },
  { id: 'reminders' as const, label: 'Recordatorios', icon: BellIcon, path: '/reminders' },
  { id: 'payments' as const, label: 'Pagos', icon: CreditCardIcon, path: '/payments' },
];

const Sidebar: React.FC<SidebarProps> = ({ selected }) => {
  const navigate = useNavigate();
  const { negocio } = useNegocio();

  // If no businesses exist, don't show the sidebar
  if (!negocio) {
    return null;
  }

  return (
    <aside
  className="bg-[#000000] min-h-screen transition-all duration-300 ease-in-out w-52"
  style={{
    paddingLeft: '0.5rem',
    paddingRight: '0',
    boxShadow: 'inset -10px 0 15px -5px rgba(0, 0, 0, 0.8), inset -3px 0 7px -3px rgba(0ヴィ, 0, 0, 0.9)'
  }}
>
      <nav className="flex flex-col gap-4 pl-2 pr-0 py-2"> 
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const isActive = selected === id;
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`relative flex items-center gap-3 px-4 py-5 font-poppins group w-full
                ${isActive
                  ? 'bg-blue-600 text-white font-semibold rounded-l-xl rounded-r-none'
                  : 'bg-[#273168] hover:bg-[#3b4484] text-blue-100 rounded-l-xl rounded-r-none'
                }`}
              style={{
                boxShadow: isActive 
                  ? 'none' 
                  : 'inset -4px 0 8px -2px rgba(0, 0, 0, 0.6)',
                transition: 'background-color 0.3s, box-shadow 0.3s'
              }}
            >
              <Icon className="h-6 w-6 text-inherit" />
              <span className="text-lg ${isActive ? 'text-white' : 'text-blue-100'} transition-opacity duration-300 opacity-100">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;