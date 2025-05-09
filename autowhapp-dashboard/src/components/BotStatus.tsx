import React from 'react';
import { Card, CardContent, Typography, Switch } from '@mui/material';

const BotStatus: React.FC<{
  active: boolean;
  onToggle: (newState: boolean) => void;
  negocioId: number;
}> = ({ active, onToggle }) => {
  const handleToggle = () => {
    onToggle(!active);
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
      <CardContent sx={{ p: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <Typography
            variant="h6"
            sx={{ fontFamily: 'Poppins', fontWeight: 'bold', minWidth: 130, pr: 3 }}
          >
            Estado del Bot
          </Typography>
          <Switch 
            checked={active ?? false} 
            onChange={handleToggle} 
            color="primary" 
          />
          <Typography sx={{ fontFamily: 'Poppins', ml: 1 }}>
            {active ? 'Encendido' : 'Apagado'}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
};

export default BotStatus;