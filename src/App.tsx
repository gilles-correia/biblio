import React, { useEffect, useState } from 'react';
import { api, type Usuario, type Livro, type Emprestimo } from './services/api';
import { GerenciarLivros } from './components/GerenciarLivros';
import { Login } from './components/Login';

export default function App() {
  // ESTADO DE AUTENTICAÇÃO
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('@Biblioteca:token'));
  const [usuarioLogado, setUsuarioLogado] = useState<any>(() => {
    const userSalvo = localStorage.getItem('@Biblioteca:user');
    return userSalvo ? JSON.parse(userSalvo) : null;
  });

  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'cadastrar-usuario' | 'usuarios' | 'livros' | 'emprestimos'>('dashboard');

  // ESTADOS DO SISTEMA
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [livros, setLivros] = useState<Livro[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

  // Form Usuario
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<'ALUNO' | 'PROFESSOR'>('ALUNO');
  const [usuarioEditandoId, setUsuarioEditandoId] = useState<number | null>(null);

  // Form Emprestimo
  const [usuarioSel, setUsuarioSel] = useState<number | ''>('');
  const [livroSel, setLivroSel] = useState<number | ''>('');

  // Filtros
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'ALUNO' | 'PROFESSOR'>('Todos');

  // Toast
  const [toastMsg, setToastMsg] = useState<{ title: string; message: string; type: 'sucesso' | 'erro' } | null>(null);

  function mostrarToast(title: string, message: string, type: 'sucesso' | 'erro' = 'sucesso') {
    setToastMsg({ title, message, type });
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function carregarTudo() {
    const jwtToken = localStorage.getItem('@Biblioteca:token');
    if (!jwtToken) return;

    try {
      const [uRes, lRes, eRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/livros'),
        api.get('/emprestimos')
      ]);

      setUsuarios(Array.isArray(uRes.data) ? uRes.data : []);
      setLivros(Array.isArray(lRes.data) ? lRes.data : []);
      setEmprestimos(Array.isArray(eRes.data) ? eRes.data : []);
    } catch (err: any) {
      console.error('Erro ao buscar dados do servidor:', err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        mostrarToast('Atenção', 'Não foi possível buscar dados do servidor.', 'erro');
      }
    }
  }

  // Executa o carregamento assim que houver um token válido
  useEffect(() => {
    if (token) {
      carregarTudo();
    }
  }, [token]);

  function handleLoginSuccess(novoToken: string, dadosUsuario: any) {
    localStorage.setItem('@Biblioteca:token', novoToken);
    localStorage.setItem('@Biblioteca:user', JSON.stringify(dadosUsuario));
    setUsuarioLogado(dadosUsuario);
    setToken(novoToken); // Isso dispara o useEffect automaticamente
  }

  function handleLogout() {
    localStorage.removeItem('@Biblioteca:token');
    localStorage.removeItem('@Biblioteca:user');
    setToken(null);
    setUsuarioLogado(null);
  }

  async function handleSalvarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      return mostrarToast('Atenção', 'Preencha o nome e o e-mail.', 'erro');
    }

    try {
      if (usuarioEditandoId !== null) {
        await api.put(`/usuarios/${usuarioEditandoId}`, { nome: nome.trim(), email: email.trim(), tipo });
        mostrarToast('Sucesso!', `${nome} foi atualizado.`);
      } else {
        await api.post('/usuarios', { nome: nome.trim(), email: email.trim(), tipo });
        mostrarToast('Sucesso!', `${nome} foi cadastrado.`);
      }
      setNome('');
      setEmail('');
      setTipo('ALUNO');
      setUsuarioEditandoId(null);
      await carregarTudo();
      setAbaAtiva('usuarios');
    } catch (err: any) {
      mostrarToast('Erro', err.response?.data?.error || 'Não foi possível salvar no banco.', 'erro');
    }
  }

  function handleEditarUsuario(usuario: Usuario) {
    setUsuarioEditandoId(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setTipo(usuario.tipo);
    setAbaAtiva('cadastrar-usuario');
  }

  function handleCancelarEdicaoUsuario() {
    setUsuarioEditandoId(null);
    setNome('');
    setEmail('');
    setTipo('ALUNO');
  }

  async function handleInativarUsuario(id: number, nomeUser: string) {
    if (!confirm(`Deseja inativar ${nomeUser}?`)) return;
    try {
      await api.patch(`/usuarios/${id}/inativar`);
      carregarTudo();
      mostrarToast('Inativado', `${nomeUser} foi desativado.`);
    } catch {
      mostrarToast('Erro', 'Falha ao inativar.', 'erro');
    }
  }

  async function handleRealizarEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioSel || !livroSel) return mostrarToast('Atenção', 'Selecione o leitor e o livro.', 'erro');

    try {
      await api.post('/emprestimos', { usuario_id: usuarioSel, livro_id: livroSel, dias: 7 });
      setUsuarioSel(''); setLivroSel('');
      carregarTudo();
      mostrarToast('Empréstimo', 'Livro emprestado com sucesso!');
    } catch (err: any) {
      mostrarToast('Erro', err.response?.data?.error || 'Erro ao registrar.', 'erro');
    }
  }

  async function handleDevolver(id: number) {
    try {
      await api.put(`/emprestimos/${id}/devolver`);
      await carregarTudo();
      mostrarToast('Devolução', 'Livro devolvido ao acervo!');
    } catch (err: any) {
      mostrarToast('Erro', err.response?.data?.error || 'Falha na devolução.', 'erro');
    }
  }

  async function handleRenovarEmprestimo(id: number) {
    try {
      await api.put(`/emprestimos/${id}/renovar`);
      await carregarTudo();
      mostrarToast('Renovação', 'Empréstimo renovado com sucesso!');
    } catch (err: any) {
      mostrarToast('Erro', err.response?.data?.error || 'Não foi possível renovar o empréstimo.', 'erro');
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const bateTexto = u.nome?.toLowerCase().includes(buscaUsuario.toLowerCase()) || u.email?.toLowerCase().includes(buscaUsuario.toLowerCase());
    const bateTipo = filtroTipo === 'Todos' || u.tipo === filtroTipo;
    return bateTexto && bateTipo;
  });

  const totalAcervo = livros.reduce((acc, l) => acc + Number(l.quantidade_disponivel ?? (l as any).quantidade ?? 0), 0);
  const totalEmprestados = emprestimos.filter(e => e.status === 'EMPRESTADO').length;

  // SE NÃO TIVER TOKEN -> MOSTRA O LOGIN
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col">
      
      {/* HEADER */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-blue-200 text-2xl shadow-inner">
                <i className="fa-solid fa-book-bookmark"></i>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">BiblioEscolar</h1>
                <p className="text-xs text-blue-200 font-medium hidden sm:block">Gestão Inteligente da Biblioteca</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
                <div className="w-8 h-8 rounded-full bg-blue-400 text-slate-900 font-bold flex items-center justify-center text-sm shadow uppercase">
                  {usuarioLogado?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold leading-tight">{usuarioLogado?.name || 'Usuário Autenticado'}</p>
                  <p className="text-[10px] text-blue-200 leading-tight">{usuarioLogado?.email || 'Conectado'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* NAVEGAÇÃO DE ABAS */}
        <div className="border-b border-slate-200 mb-8 bg-white rounded-t-2xl px-4 pt-2 shadow-sm">
          <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setAbaAtiva('dashboard')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                abaAtiva === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-chart-pie text-base"></i>
              <span>Dashboard / Início</span>
            </button>

            <button
              onClick={() => setAbaAtiva('cadastrar-usuario')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                abaAtiva === 'cadastrar-usuario' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-user-plus text-base"></i>
              <span>Cadastrar Usuário</span>
            </button>

            <button
              onClick={() => setAbaAtiva('usuarios')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                abaAtiva === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-users text-base"></i>
              <span>Usuários Ativos</span>
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {usuarios.length}
              </span>
            </button>

            <button
              onClick={() => setAbaAtiva('livros')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                abaAtiva === 'livros' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-book text-base"></i>
              <span>Acervo de Livros</span>
            </button>

            <button
              onClick={() => setAbaAtiva('emprestimos')}
              className={`flex items-center gap-2.5 py-4 px-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
                abaAtiva === 'emprestimos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fa-solid fa-right-left text-base"></i>
              <span>Empréstimos</span>
            </button>
          </nav>
        </div>

        {/* DASHBOARD */}
        {abaAtiva === 'dashboard' && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total de Usuários</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{usuarios.length}</h3>
                  <p className="text-xs text-emerald-600 mt-1 font-medium"><i className="fa-solid fa-arrow-up text-[10px]"></i> Cadastrados no sistema</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-book-reader"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Empréstimos Ativos</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalEmprestados}</h3>
                  <p className="text-xs text-indigo-600 mt-1 font-medium"><i className="fa-solid fa-clock"></i> Circulação atual</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-book-bookmark"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Títulos Cadastrados</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{livros.length}</h3>
                  <p className="text-xs text-blue-600 mt-1 font-medium"><i className="fa-solid fa-book"></i> No banco de dados</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Exemplares Disponíveis</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalAcervo}</h3>
                  <p className="text-xs text-emerald-600 mt-1 font-medium"><i className="fa-solid fa-check"></i> Prontos para empréstimo</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-amber-500"></i> Acesso Rápido
                </h2>
                <div className="space-y-3">
                  <button onClick={() => setAbaAtiva('cadastrar-usuario')} className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <i className="fa-solid fa-user-plus"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Novo Usuário</h4>
                      <p className="text-xs text-slate-500">Cadastrar aluno ou professor</p>
                    </div>
                  </button>

                  <button onClick={() => setAbaAtiva('emprestimos')} className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <i className="fa-solid fa-right-left"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Novo Empréstimo</h4>
                      <p className="text-xs text-slate-500">Registrar e devolver acervo</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-bullhorn text-blue-500"></i> Informes da Biblioteca
                  </h2>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                      <span>Prazo padrão de empréstimo: <strong>7 dias</strong> para alunos e <strong>15 dias</strong> para professores.</span>
                    </li>
                    <li className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <i className="fa-solid fa-circle-check text-emerald-500 mt-0.5"></i>
                      <span>Interface reestruturada e conectada via API Node.js e PostgreSQL.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Conectado ao banco de dados</span>
                  <span>Sistema v2.4</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CADASTRO DE USUÁRIO */}
        {abaAtiva === 'cadastrar-usuario' && (
          <div className="animate-fadeIn max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-id-card text-blue-600"></i> {usuarioEditandoId !== null ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{usuarioEditandoId !== null ? 'Altere os dados do usuário e salve as mudanças.' : 'Insira os dados abaixo para cadastro na biblioteca.'}</p>
              </div>

              <form onSubmit={handleSalvarUsuario} className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lucas Gabriel Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">E-mail *</label>
                    <input
                      type="email"
                      required
                      placeholder="usuario@escola.edu.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Perfil / Tipo *</label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as 'ALUNO' | 'PROFESSOR')}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="ALUNO">Aluno</option>
                      <option value="PROFESSOR">Professor</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  {usuarioEditandoId !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCancelarEdicaoUsuario();
                        setAbaAtiva('usuarios');
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check"></i> {usuarioEditandoId !== null ? 'Salvar Alterações' : 'Salvar Cadastro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONSULTAR USUÁRIOS */}
        {abaAtiva === 'usuarios' && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={buscaUsuario}
                  onChange={(e) => setBuscaUsuario(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as any)}
                  className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-medium text-slate-700"
                >
                  <option value="Todos">Todos os Perfis</option>
                  <option value="ALUNO">Alunos</option>
                  <option value="PROFESSOR">Professores</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Nome / E-mail</th>
                      <th className="py-3.5 px-6">Tipo</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {usuariosFiltrados.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6 font-mono text-xs font-bold text-slate-600">#{u.id}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{u.nome}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            u.tipo === 'ALUNO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {u.tipo}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Ativo
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditarUsuario(u)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                              title="Editar Usuário"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleInativarUsuario(u.id, u.nome)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                              title="Inativar Usuário"
                            >
                              Inativar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usuariosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ACERVO DE LIVROS */}
        {abaAtiva === 'livros' && <GerenciarLivros />}

        {/* EMPRÉSTIMOS */}
        {abaAtiva === 'emprestimos' && (
          <div className="animate-fadeIn space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-right-left text-blue-600"></i> Registrar Empréstimo
              </h2>
              <form onSubmit={handleRealizarEmprestimo} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={usuarioSel}
                  onChange={(e) => setUsuarioSel(Number(e.target.value))}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">Selecione o Leitor...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>

                <select
                  value={livroSel}
                  onChange={(e) => setLivroSel(Number(e.target.value))}
                  className="px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">Selecione o Livro...</option>
                  {livros.filter(l => Number(l.quantidade_disponivel ?? (l as any).quantidade ?? 0) > 0).map(l => (
                    <option key={l.id} value={l.id}>{l.titulo} ({l.quantidade_disponivel ?? (l as any).quantidade} disp.)</option>
                  ))}
                </select>

                <button type="submit" className="bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-all py-2.5">
                  Confirmar Empréstimo
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Leitor</th>
                    <th className="py-3.5 px-6">Livro</th>
                    <th className="py-3.5 px-6">Devolução Prevista</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {emprestimos.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">#{emp.id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{emp.usuario_nome} ({emp.usuario_tipo})</td>
                      <td className="py-4 px-6 text-slate-600">{emp.livro_titulo}</td>
                      <td className="py-4 px-6 text-slate-500">{new Date(emp.data_prevista_devolucao).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          emp.status === 'EMPRESTADO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          {emp.status === 'EMPRESTADO' && (
                            <button
                              onClick={() => handleDevolver(emp.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                            >
                              Devolver
                            </button>
                          )}
                          {emp.status === 'EMPRESTADO' &&
                            !((emp as Emprestimo & { renovacoes?: number; renovado?: boolean }).renovado ||
                              Number((emp as Emprestimo & { renovacoes?: number }).renovacoes ?? 0) >= 1) && (
                              <button
                                onClick={() => handleRenovarEmprestimo(emp.id)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                                title="Renovar uma única vez"
                              >
                                Renovar
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {emprestimos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Nenhum empréstimo registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* TOAST NOTIFICAÇÃO */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-fadeIn">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            toastMsg.type === 'sucesso' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <i className={`fa-solid ${toastMsg.type === 'sucesso' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          </div>
          <div>
            <h4 className="text-sm font-semibold">{toastMsg.title}</h4>
            <p className="text-xs text-slate-300">{toastMsg.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}