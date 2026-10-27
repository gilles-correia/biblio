export interface User {
  id?: number;
  name: string;
  email: string;
  adm: boolean;
  empresa: string;
  perfil?: 'ALUNO' | 'PROFESSOR' | 'FUNCIONARIO';
}

export interface AuthResponse {
  name: string;
  email: string;
  adm: boolean;
  empresa: string;
  token: string;
}