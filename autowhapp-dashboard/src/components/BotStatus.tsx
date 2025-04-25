import React, { useState } from 'react';
import { Card, CardContent, Typography, Switch } from '@mui/material';

const BotStatus: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');

  const handleToggle = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    // Simular el guardado y la notificación a n8n
    setMessage(`Bot ${newStatus ? 'encendido' : 'apagado'} con éxito (simulado)`);
    console.log('Simulando envío a n8n:', { isActive: newStatus });
  };

  return (
    <Card sx={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', marginBottom: '8px' }}>
          Estado del Bot
        </Typography>
        <Switch
          checked={isActive}
          onChange={handleToggle}
          sx={{
            '& .MuiSwitch-thumb': { backgroundColor: isActive ? '#34C759' : '#D1D5DB' },
            '& .MuiSwitch-track': { backgroundColor: isActive ? '#34C759' : '#D1D5DB' },
          }}
        />
        <Typography sx={{ fontFamily: 'Poppins', display: 'inline', marginLeft: '8px' }}>
          {isActive ? 'Encendido' : 'Apagado'}
        </Typography>
        {message && (
          <Typography sx={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '8px' }}>
            {message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default BotStatus;