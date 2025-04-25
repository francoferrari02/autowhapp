import React from 'react'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import BarChartIcon from '@mui/icons-material/BarChart'
import { useNavigate } from 'react-router-dom'

interface SidebarProps {
  selected: 'config' | 'orders' | 'analytics'
}

const Sidebar: React.FC<SidebarProps> = ({ selected }) => {
  const navigate = useNavigate()

  return (
    <List sx={{ width: 200, backgroundColor: '#F7F9FC', height: '100vh' }}>
      <ListItem disablePadding>
        <ListItemButton
          selected={selected === 'config'}
          sx={{ '&.Mui-selected': { backgroundColor: '#93C5FD' } }}
          onClick={() => navigate('/')}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Configuración"
            primaryTypographyProps={{ fontFamily: 'Poppins' }}
          />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton
          selected={selected === 'orders'}
          sx={{ '&.Mui-selected': { backgroundColor: '#93C5FD' } }}
          onClick={() => navigate('/orders')}
        >
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText
            primary="Pedidos"
            primaryTypographyProps={{ fontFamily: 'Poppins' }}
          />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton
          selected={selected === 'analytics'}
          sx={{ '&.Mui-selected': { backgroundColor: '#93C5FD' } }}
          onClick={() => navigate('/analytics')}
        >
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText
            primary="Analíticas"
            primaryTypographyProps={{ fontFamily: 'Poppins' }}
          />
        </ListItemButton>
      </ListItem>
    </List>
  )
}

export default Sidebar