import React from 'react';
import { Link } from 'react-router-dom';

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link to={to} className="text-white font-poppins text-lg underline decoration-2">
    {label}
  </Link>
);

export default NavLink;