            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Título</th>
                    <th className="py-3.5 px-6">Autor</th>
                    <th className="py-3.5 px-6">ISBN</th>
                    <th className="py-3.5 px-6 text-center">Disponível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {livros.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">#{l.id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{l.titulo}</td>
                      <td className="py-4 px-6 text-slate-600">{l.autor}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">{l.isbn}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          l.quantidade_disponivel > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {l.quantidade_disponivel} un.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                  {livros.filter(l => l.quantidade_disponivel > 0).map(l => (
                    <option key={l.id} value={l.id}>{l.titulo} ({l.quantidade_disponivel} disp.)</option>
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
                            <button onClick={() => handleDevolver(emp.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">Devolver</button>
                          )}
                          {emp.status === 'EMPRESTADO' && !((emp as Emprestimo & { renovacoes?: number; renovado?: boolean }).renovado || Number((emp as Emprestimo & { renovacoes?: number }).renovacoes ?? 0) >= 1) && (
                            <button onClick={() => handleRenovarEmprestimo(emp.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors" title="Renovar uma única vez">Renovar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
