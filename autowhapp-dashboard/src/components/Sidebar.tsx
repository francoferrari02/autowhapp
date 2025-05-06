import { useNavigate } from 'react-router-dom';
import {
  ChatBubbleBottomCenterTextIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  selected: 'config' | 'orders' | 'analytics' | 'reservations' | 'reminders';
}

const NAV_ITEMS = [
  {
    id: 'config',
    label: 'Chatbot',
    icon: ChatBubbleBottomCenterTextIcon,
    path: '/',
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: ShoppingCartIcon,
    path: '/orders',
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    icon: ChartBarIcon,
    path: '/analytics',
  },
  {
    id: 'reservations',
    label: 'Reservas',
    icon: CalendarIcon,
    path: '/reservations',
  },
  {
    id: 'reminders',
    label: 'Recordatorios',
    icon: BellIcon,
    path: '/reminders',
  }
];

const Sidebar: React.FC<SidebarProps> = ({ selected }) => {
  const navigate = useNavigate();

  return (
    <aside className="w-52 bg-[#000000] min-h-screen p-4">
      <nav className="flex flex-col gap-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const isActive = selected === id;
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`relative flex items-center gap-3 px-4 py-5 font-poppins group
                w-[calc(100%+16px)] -mr-4
                ${isActive
                  ? 'bg-blue-600 text-white font-semibold rounded-l-xl rounded-r-none'
                  : 'bg-[#273168] hover:bg-[#3b4484] text-blue-100 rounded-l-xl rounded-r-none'
                }
              `}
              style={
                !isActive
                  ? { 
                      boxShadow: `
                        inset -11px 0 16px -6px rgba(10, 10, 16, 0.75), 
                        -2px 2px 8px 0 rgba(0,0,0,0.10)
                      `
                    }
                  : {}
              }
            >
              <Icon className="h-6 w-6 text-inherit" style={{ transition: 'none', transform: 'none' }} />
              <span className={`text-lg ${isActive ? 'text-white' : 'text-blue-100'}`}>
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