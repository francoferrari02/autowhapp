import React from 'react';
import { useNegocio } from '../NegocioContext';
import { hasModuleAccess } from '../utils/planPermissions';
import RestrictedAccess from './RestrictedAccess';

interface ProtectedModuleProps {
  module: string;
  children: React.ReactNode;
}

const ProtectedModule: React.FC<ProtectedModuleProps> = ({ module, children }) => {
  const { negocio } = useNegocio();
  
  const hasAccess = hasModuleAccess(negocio?.plan, module);
  
  if (!hasAccess) {
    return <RestrictedAccess module={module} currentPlan={negocio?.plan} />;
  }
  
  return <>{children}</>;
};

export default ProtectedModule;
