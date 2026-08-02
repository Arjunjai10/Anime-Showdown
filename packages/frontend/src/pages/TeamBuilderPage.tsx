import React from 'react';
import { TeamBuilder } from '../components/TeamBuilder';

interface TeamBuilderPageProps {
  token: string | null;
}

export const TeamBuilderPage: React.FC<TeamBuilderPageProps> = ({ token }) => {
  return (
    <div className="page">
      <TeamBuilder token={token} />
    </div>
  );
};
