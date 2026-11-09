// Importação das planilhas de novembro/2026 para a Prestação de Contas (aba só do administrador).
// Três planilhas: Fluxo de caixa da Manutenção, Gastos extras da celebração e Aportes do telhado.
// Regras (para não contar o mesmo dinheiro duas vezes):
//  - Fluxo de caixa: 6 lançamentos como na planilha (o saldo tem que fechar em R$ 520,20).
//  - Gastos da celebração: 12 saídas pagas por Ricardo M do próprio bolso. Entram como saída (aparecem nos relatórios e gráficos),
//    mas NÃO diminuem o saldo do caixa; ficam em "A reembolsar" (campo terceiro).
//  - Aportes do telhado: ficam numa tabela de conferência (pessoa x mês). Não geram lançamento, porque o dinheiro de setembro e
//    outubro já está dentro do "Saldo de outubro" e o de novembro já está nas linhas do Fluxo de caixa.
(function () {
const ID = 'imp2611-';
const r2 = v => Math.round(v * 100) / 100;
const MESES = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01'];
const ROT_MES = { '2026-09': 'Set/26', '2026-10': 'Out/26', '2026-11': 'Nov/26', '2026-12': 'Dez/26', '2027-01': 'Jan/27' };

const FLUXO = [
  { k: 'f1', data: '2026-11-01', tipo: 'Entrada', valor: 570.20, centro: 'Manutenção', origem: 'Outras entradas', desc: 'Saldo de outubro (transportado da planilha de Manutenção)' },
  { k: 'f2', data: '2026-11-02', tipo: 'Entrada', valor: 100, centro: 'Campanhas', origem: 'Vaquinha Coletiva', vaquinha: 'Telhado', pessoa: 'Marcos Suel', desc: 'Aporte do telhado - Marcos Suel (nov/2026)' },
  { k: 'f3', data: '2026-11-02', tipo: 'Entrada', valor: 100, centro: 'Campanhas', origem: 'Vaquinha Coletiva', vaquinha: 'Telhado', pessoa: 'Valdir', desc: 'Aporte do telhado - Valdir (nov/2026)' },
  { k: 'f4', data: '2026-11-02', tipo: 'Saída', valor: 250, centro: 'Campanhas', origem: 'Reparos e Manutenção Predial', vaquinha: 'Telhado', pessoa: 'Ricardo', desc: 'Telhado (Cris O.; Lincoln; Valdir) - pago a Ricardo' },
  { k: 'f5', data: '2026-11-02', tipo: 'Entrada', valor: 200, centro: 'Eventos', origem: 'Doação', pessoa: 'Ricardo M e Liana', desc: 'Diversos gastos celebração - Ricardo M e Liana' },
  { k: 'f6', data: '2026-11-02', tipo: 'Saída', valor: 200, centro: 'Eventos', origem: 'Atividades e Retiros', pessoa: 'Ricardo M. e Liana', desc: 'Diversos gastos celebração - Ricardo M. e Liana' }
];
const GASTOS = [
  ['g01', '2026-09-17', 51, 'Outras saídas', 'Rastreador e outros'],
  ['g02', '2026-09-24', 56, 'Reparos e Manutenção Predial', 'Chuveirinho para o quarto 2'],
  ['g03', '2026-09-18', 295, 'Reparos e Manutenção Predial', 'Fio PP 50 m (iluminar portal e placa)'],
  ['g04', '2026-09-18', 45, 'Reparos e Manutenção Predial', 'Conduíte 50 m (iluminar portal e placa)'],
  ['g05', '2026-09-18', 88, 'Reparos e Manutenção Predial', 'Fita de fusão, isolante e tomada'],
  ['g06', '2026-09-22', 130, 'Comunicação, Site e Domínio', 'Banners dos elementos'],
  ['g07', '2026-09-22', 100, 'Comunicação, Site e Domínio', 'Lona da placa (diferença após a vaquinha)'],
  ['g08', '2026-09-25', 250, 'Combustível e Transporte', 'Vaquinha para desatolar Kohanoff'],
  ['g09', '2026-09-19', 300, 'Materiais de Construção', '2º galão de tinta'],
  ['g10', '2026-10-02', 2000, 'Obras e Construção', '2ª parte do pedreiro João Carlos'],
  ['g11', '2026-09-26', 120, 'Gás', 'Gás (Almir)'],
  ['g12', '2026-09-28', 350, 'Atividades e Retiros', 'Mesas e cadeiras - aluguel (20 e 80)']
].map(g => ({ k: g[0], data: g[1], tipo: 'Saída', valor: g[2], centro: 'Eventos', origem: g[3], pessoa: 'Ricardo M', terceiro: 'Ricardo M', desc: g[4] + ' (celebração; pago por Ricardo M, a reembolsar)' }));
const TOTAL_GASTOS_PLANILHA = 3786; // total que está escrito na planilha (a soma das linhas dá 3.785,00)

// Aportes do telhado: nome, valor mensal, meses pagos (Set/26 a Jan/27), observação
const A = (n, v, p, o) => ({ nome: n, valor: v, pagos: p, obs: o || '' });
const APORTES = [
  A('Liana Moraes Bianchi', 100, ['2026-09', '2026-10', '2026-11']), A('Ricardo Edgar Marcianesi', 100, ['2026-09', '2026-10', '2026-11']),
  A('Cris Weber', 50, ['2026-09', '2026-10']), A('Vera Bender', 50, ['2026-09', '2026-10']), A('Valdir Silveira', 50, ['2026-09', '2026-10', '2026-11']),
  A('Marcos Suel (Marquinhos)', 100, ['2026-09', '2026-10', '2026-11']), A('Weberth', 100, ['2026-09', '2026-10']),
  A('Ricardo Jullian', 50, ['2026-09', '2026-10']), A('Hugo Moyano', 50, ['2026-09', '2026-10']),
  A('Rogerio Weber', 240, ['2026-09'], '40 € (cerca de R$ 240,00)'), A('Celina', 100, ['2026-09', '2026-10']), A('Rosemary', 38, ['2026-09']),
  A('Fabio', 50, ['2026-09']), A('Juan', 25, ['2026-09']), A('Sergio Mesquita', 50, ['2026-09']), A('Elio', 50, ['2026-09']),
  A('Ana Paula', 100, ['2026-10'], 'aporte avulso'), A('Contribuição extra Valdir', 100, ['2026-10'], 'aporte avulso'), A('Lincoln', 100, ['2026-10'], 'aporte avulso')
].map((x, i) => Object.assign({ id: 'a' + String(i + 1).padStart(2, '0') }, x));

const somaFluxo = () => { let e = 0, s = 0; FLUXO.forEach(f => f.tipo === 'Entrada' ? e += f.valor : s += f.valor); return { e: r2(e), s: r2(s), saldo: r2(e - s) }; };
const somaGastos = () => r2(GASTOS.reduce((t, g) => t + g.valor, 0));
const recebidoMes = (itens, m) => r2(itens.filter(i => (i.pagos || []).includes(m)).reduce((t, i) => t + i.valor, 0));

// Grava os lançamentos e a tabela de aportes (sem duplicar: os ids têm prefixo fixo e são substituídos).
function aplicar(db, me, hoje, moeda) {
  const novos = FLUXO.concat(GASTOS).map(x => ({ id: ID + x.k, data: x.data, desc: x.desc, centro: x.centro, tipo: x.tipo, origem: x.origem, vaquinha: x.vaquinha || '', pessoa: x.pessoa || '', ref: '', forma: '', valor: x.valor, moeda, comp: '', por: me.nome, em: hoje(), terceiro: x.terceiro || '', imp: 'nov2026' }));
  const l = db.get('contas', []).filter(c => !String(c.id).startsWith(ID)).concat(novos);
  if (!db.set('contas', l)) return false;
  const atual = db.get('aportes_telhado', null), pagos = {}; if (atual) atual.itens.forEach(i => { pagos[i.id] = i.pagos; });
  db.set('aportes_telhado', { titulo: 'Aportes do telhado', meses: MESES, itens: APORTES.map(i => Object.assign({}, i, pagos[i.id] ? { pagos: pagos[i.id] } : {})) });
  return true;
}

window.PR_IMP2611 = {
  MESES, ROT_MES,
  // Importação automática: na primeira vez que um administrador entra, os dados das planilhas já aparecem no site.
  // Só roda uma vez por navegador (marca 'imp2611_auto'); se o administrador clicar em "Desfazer", não volta sozinha.
  autoImportar(db, me, hoje) {
    try {
      if (!me || me.nivel !== 'administrador' || db.get('imp2611_auto', false)) return false;
      if (db.get('contas', []).some(c => String(c.id).startsWith(ID))) { db.set('imp2611_auto', true); return false; }
      if (!aplicar(db, me, hoje, 'PIX')) return false;
      db.set('imp2611_auto', true); return true;
    } catch (e) { return false; }
  },
  painel(el, H, redesenha) {
    if (!el) return;
    const { db, uid, hoje, esc, $, money, MOEDA, fmtData, me } = H;
    if (!me || me.nivel !== 'administrador') { el.innerHTML = ''; return; }
    const lanc = () => db.get('contas', []);
    const jaImp = lanc().filter(c => String(c.id).startsWith(ID));
    const fl = somaFluxo(), gs = somaGastos(), tem = db.get('aportes_telhado', null);
    const itens = tem ? tem.itens : APORTES;
    const rec = MESES.map(m => recebidoMes(itens, m));
    const dif = r2(TOTAL_GASTOS_PLANILHA - gs);
    el.innerHTML = `<div class="card" style="margin:18px 0;padding:14px 16px;border:2px solid #c9d2d8;border-radius:10px">
      <h4 style="margin-top:0"><i class="fas fa-file-import"></i> Importar planilhas de novembro/2026</h4>
      <p><small>Traz para a Prestação de Contas o Fluxo de caixa da Manutenção, os gastos extras da celebração e os aportes do telhado. Pode clicar mais de uma vez: nada é duplicado.</small></p>
      <table class="doc-table"><thead><tr><th>Planilha</th><th>O que entra</th><th>Conferência</th></tr></thead><tbody>
        <tr><td>Fluxo de caixa (Manutenção)</td><td>${FLUXO.length} lançamentos: entradas ${money(fl.e)}, saídas ${money(fl.s)}</td><td>Saldo ${money(fl.saldo)} (a planilha informa R$ 520,20: confere)</td></tr>
        <tr><td>Gastos extras da celebração</td><td>${GASTOS.length} saídas pagas por Ricardo M: ${money(gs)}</td><td>${dif ? `A planilha informa ${money(TOTAL_GASTOS_PLANILHA)}: diferença de ${money(dif)} a conferir` : 'Total confere com a planilha'}. Ficam em "A reembolsar" e não mexem no saldo do caixa.</td></tr>
        <tr><td>Aportes do telhado</td><td>${APORTES.length} linhas de pessoas; recebido ${money(rec.reduce((a, b) => a + b, 0))} (Set ${money(rec[0])}, Out ${money(rec[1])}, Nov ${money(rec[2])})</td><td>Tabela de conferência abaixo. Não vira lançamento: set/out já estão no saldo de outubro e nov já está no Fluxo de caixa.</td></tr>
      </tbody></table>
      <div class="form-row" style="max-width:420px;margin-top:10px"><label for="im-m">O dinheiro da planilha de Manutenção está em qual forma? (a importação automática usou PIX)</label><select id="im-m">${Object.entries(MOEDA).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
      <p class="form-erro" id="im-e" role="alert" hidden></p>
      <p><button class="btn-visit" id="im-ok"><i class="fas fa-file-import"></i> ${jaImp.length ? 'Importar de novo (atualiza)' : 'Importar agora'}</button>
      ${jaImp.length ? ' <button class="btn-visit" id="im-x" style="background:#a94442"><i class="fas fa-undo"></i> Desfazer importação</button>' : ''}</p>
      <p><small>${jaImp.length ? `Já importado: ${jaImp.length} lançamentos.` : 'Ainda não importado.'} Antes de importar, vale baixar um backup (Administração &rsaquo; Backup).</small></p>
    </div>`;
    $('#im-ok', el).onclick = () => {
      const er = $('#im-e', el), moeda = $('#im-m', el).value; er.hidden = true;
      if (!aplicar(db, me, hoje, moeda)) { er.textContent = 'Sem espaço no navegador para salvar.'; er.hidden = false; return; }
      redesenha();
    };
    const x = $('#im-x', el); if (x) x.onclick = () => {
      if (!confirm('Desfazer a importação? Os ' + jaImp.length + ' lançamentos importados saem da Prestação de Contas. A tabela de aportes do telhado também é apagada.')) return;
      db.set('contas', lanc().filter(c => !String(c.id).startsWith(ID))); db.set('aportes_telhado', null); db.set('imp2611_auto', true); redesenha();
    };
    // tabela de conferência dos aportes (pessoa x mês)
    const ap = db.get('aportes_telhado', null);
    if (ap && ap.itens) {
      const box = document.createElement('div');
      box.innerHTML = `<h4><i class="fas fa-home"></i> Aportes do telhado: conferência por pessoa e mês</h4>
      <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Tabela de conferência, como na planilha. Clique em uma célula para marcar ou desmarcar o pagamento. Ela <strong>não cria lançamento</strong>: o dinheiro entra no caixa pela Prestação de Contas.</p>
      <div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Pessoa</th><th>Valor</th>${ap.meses.map(m => `<th>${ROT_MES[m]}</th>`).join('')}<th>Recebido</th></tr></thead><tbody>
      ${ap.itens.map(i => `<tr><td>${esc(i.nome)}${i.obs ? `<br><small>${esc(i.obs)}</small>` : ''}</td><td>${money(i.valor)}</td>${ap.meses.map(m => `<td><button type="button" class="btn-visit" data-ap="${i.id}|${m}" style="padding:2px 8px;font-size:.75rem;${(i.pagos || []).includes(m) ? '' : 'background:#9aa7ab'}">${(i.pagos || []).includes(m) ? 'pago' : '-'}</button></td>`).join('')}<td><strong>${money(i.valor * (i.pagos || []).length)}</strong></td></tr>`).join('')}
      </tbody><tfoot><tr><th>Total recebido</th><th></th>${ap.meses.map(m => `<th>${money(recebidoMes(ap.itens, m))}</th>`).join('')}<th>${money(ap.itens.reduce((t, i) => t + i.valor * (i.pagos || []).length, 0))}</th></tr></tfoot></table></div>`;
      el.appendChild(box);
      box.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => {
        const [id, m] = b.dataset.ap.split('|'), cur = db.get('aportes_telhado', null), it = cur.itens.find(z => z.id === id), p = new Set(it.pagos || []);
        p.has(m) ? p.delete(m) : p.add(m); it.pagos = MESES.filter(x => p.has(x)); db.set('aportes_telhado', cur); redesenha();
      });
    }
  },
  _dados: { FLUXO, GASTOS, APORTES }
};
})();
