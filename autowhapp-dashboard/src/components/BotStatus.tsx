import React, { useState } from 'react';
import { Card, CardContent, Typography, Switch } from '@mui/material';

const BotStatus: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');

  const handleToggle = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    
    console.log('Simulando envío a n8n:', { isActive: newStatus });
  };

  return (
    <Card 
    sx={{ 
      boxShadow: '0 0 5px 5px rgba(0,0,0,0.20)', 
      borderRadius: '40px', 
      px: 3, py: 0,
      minWidth: 400,
      width: "100%",
      maxWidth: "480px",
      marginTop: "-10px"
      
    }}
  >
    <CardContent sx={{ 
      p: 3, 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: 'Poppins', fontWeight: 'bold', minWidth: 130, pr: 3 }}
        >
          Estado del Bot
        </Typography>
        <Switch checked={isActive} onChange={handleToggle} />
        <Typography sx={{ fontFamily: 'Poppins', ml: 1 }}>
          {isActive ? 'Encendido' : 'Apagado'}
        </Typography>
      </div>
      
    </CardContent>
  </Card>
  );
};

export default BotStatus;