import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNegocio } from '../NegocioContext';
import { getModuleName } from '../utils/planPermissions';

interface RestrictedAccessProps {
  module: string;
  currentPlan?: string;
}

const RestrictedAccess: React.FC<RestrictedAccessProps> = ({ module, currentPlan }) => {
  const navigate = useNavigate();
  const { negocio } = useNegocio();
  
  const moduleName = getModuleName(module);
  
  const getRequiredPlans = (module: string): string[] => {
    const requiredPlans: string[] = [];
    
    switch (module) {
      case 'orders':
        requiredPlans.push('Plan Tienda', 'Plan Tienda Plus', 'Plan Premium');
        break;
      case 'analytics':
        requiredPlans.push('Plan Servicios Plus', 'Plan Tienda', 'Plan Tienda Plus', 'Plan Premium');
        break;
      case 'reservations':
        requiredPlans.push('Plan Servicios', 'Plan Servicios Plus', 'Plan Premium');
        break;
      case 'reminders':
        requiredPlans.push('Plan Servicios', 'Plan Servicios Plus', 'Plan Premium');
        break;
      case 'payments':
        requiredPlans.push('Plan Tienda Plus', 'Plan Premium');
        break;
      default:
        requiredPlans.push('Plan Premium');
    }
    
    return requiredPlans;
  };
  
  const requiredPlans = getRequiredPlans(module);
  
  return (
    <div className="flex-grow bg-blue-600 p-6 min-h-screen">
      <div className="max-w-[600px] mx-auto">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 6, 
            backgroundColor: 'white', 
            borderRadius: 4,
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <LockClosedIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <Typography 
              variant="h4" 
              sx={{ 
                fontFamily: 'Poppins', 
                fontWeight: 'bold', 
                color: '#1E3A8A',
                mb: 2
              }}
            >
              Acceso Restringido
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Poppins', 
                color: '#666',
                mb: 3
              }}
            >
              El módulo <strong>{moduleName}</strong> no está disponible en tu plan actual
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: 'Poppins', 
                color: '#333',
                mb: 2
              }}
            >
              <strong>Plan actual:</strong> {currentPlan || 'No definido'}
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: 'Poppins', 
                color: '#333',
                mb: 2
              }}
            >
              <strong>Planes que incluyen {moduleName}:</strong>
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
              {requiredPlans.map((plan) => (
                <Box
                  key={plan}
                  sx={{
                    backgroundColor: '#E3F2FD',
                    color: '#1976D2',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontFamily: 'Poppins',
                    fontWeight: 'medium',
                    fontSize: '0.875rem'
                  }}
                >
                  {plan}
                </Box>
              ))}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="contained"
              startIcon={<ArrowLeftIcon className="w-5 h-5" />}
              sx={{
                backgroundColor: '#1E3A8A',
                '&:hover': { backgroundColor: '#1E40AF' },
                fontFamily: 'Poppins',
                px: 3,
                py: 1.5,
                borderRadius: 2
              }}
            >
              Volver al Dashboard
            </Button>
            
            <Button
              onClick={() => {
                // Aquí podrías agregar lógica para contactar ventas o cambiar plan
                alert('Funcionalidad de cambio de plan próximamente disponible');
              }}
              variant="contained"
              sx={{
                backgroundColor: '#10B981',
                '&:hover': { backgroundColor: '#059669' },
                fontFamily: 'Poppins',
                px: 3,
                py: 1.5,
                borderRadius: 2
              }}
            >
              Actualizar Plan
            </Button>
          </Box>
        </Paper>
      </div>
    </div>
  );
};

export default RestrictedAccess;
