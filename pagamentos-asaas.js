// Integração com o Asaas (lado do site). A chave da API NUNCA está aqui: ela mora na função de servidor
// (supabase/functions/asaas). Este arquivo faz três coisas:
//   1) TIPOS: o que a pessoa pode pagar no site e como cada tipo cai na Prestação de Contas;
//   2) importar(): transforma recebimentos do Asaas em lançamentos (Entrada + tarifa como Saída), sem duplicar;
//   3) painel(): botão do Administrador, na Prestação de Contas, para buscar os recebimentos.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PR_ASAAS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const TIPOS = {
    doacao:     { rotulo: 'Doação', origem: 'Doação', centro: 'Manutenção', ref: null },
    manutencao: { rotulo: 'Contribuição mensal de manutenção', origem: 'Manutenção Mensal', centro: 'Manutenção', ref: null },
    livraria:   { rotulo: 'Compra na Livraria', origem: 'Livraria', centro: 'Livraria e Lojinha', ref: 'O que você está comprando (livro, quantidade)' },
    lojinha:    { rotulo: 'Compra na Lojinha', origem: 'Lojinha', centro: 'Livraria e Lojinha', ref: 'O que você está comprando (produto, quantidade)' },
    rifa:       { rotulo: 'Rifa Solidária', origem: 'Rifa Solidária', centro: 'Campanhas', ref: 'Nome da rifa e quantidade de números' },
    vaquinha:   { rotulo: 'Vaquinha Coletiva', origem: 'Vaquinha Coletiva', centro: 'Campanhas', ref: 'Nome da vaquinha' },
    alojamento: { rotulo: 'Reserva de alojamento', origem: 'Reservas de Alojamentos', centro: 'Alojamento', ref: 'Período da estadia' },
    atividade:  { rotulo: 'Atividade ou retiro', origem: 'Atividades e Retiros', centro: 'Eventos', ref: 'Nome da atividade' },
    outro:      { rotulo: 'Outro pagamento ao Parque', origem: 'Outras entradas', centro: 'Manutenção', ref: 'Descreva o motivo do pagamento' }
  };
  const FORMAS_VALIDAS = ['PIX', 'BOLETO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'MAQUININHA'];
  const TARIFA = 'Tarifas Bancárias e Taxas Asaas';
  const r2 = v => Math.round(Number(v) * 100) / 100;

  // recebimentos: [{ id, valor, liquido, data (AAAA-MM-DD), forma, tipo, referencia, nome, descricao }]
  // contas: lista atual de lançamentos. Devolve só o que é novo (o id do Asaas é a chave: importar de novo não duplica).
  function importar(recebimentos, contas, opc) {
    opc = opc || {};
    const uid = opc.uid || (() => Math.random().toString(36).slice(2) + Date.now().toString(36));
    const ja = new Set(contas.map(c => c.asaas).filter(Boolean));
    const novas = []; let repetidas = 0;
    (recebimentos || []).forEach(r => {
      if (!r || !r.id || !(Number(r.valor) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(r.data || '')) return;
      if (ja.has(r.id)) { repetidas++; return; }
      const t = TIPOS[r.tipo] || TIPOS.outro, forma = FORMAS_VALIDAS.includes(r.forma) ? r.forma : '';
      const desc = (t.rotulo + (r.referencia ? ': ' + r.referencia : '') + ' (Asaas)').slice(0, 120);
      novas.push({ id: uid(), data: r.data, desc, centro: t.centro, tipo: 'Entrada', origem: t.origem, vaquinha: r.tipo === 'vaquinha' ? (r.referencia || '') : '',
        pessoa: r.nome || '', ref: t.origem === 'Manutenção Mensal' ? r.data.slice(0, 7) : '', forma, valor: r2(r.valor), moeda: 'ASAAS', comp: '', asaas: r.id });
      const taxa = r2(Number(r.valor) - Number(r.liquido == null ? r.valor : r.liquido));
      if (opc.tarifa !== false && taxa > 0) novas.push({ id: uid(), data: r.data, desc: 'Tarifa do Asaas sobre o recebimento ' + r.id, centro: 'Manutenção', tipo: 'Saída', origem: TARIFA, vaquinha: '',
        pessoa: '', ref: '', forma, valor: taxa, moeda: 'ASAAS', comp: '', asaas: r.id + ':tarifa' });
    });
    return { novas, repetidas };
  }

  let msg = '', erro = false, buscando = false;
  function painel(el, H, redraw) {
    if (!el) return;
    const { db, uid, hoje, esc, $, money, fmtData } = H;
    const cfg = (typeof window !== 'undefined' && window.PR_PAGAMENTOS) || {};
    const ativo = !!(cfg.ativo && cfg.url);
    const ult = db.get('asaas_sync', null);
    let tk = ''; try { tk = sessionStorage.getItem('pr_asaas_tk') || ''; } catch (e) { /* sem sessionStorage */ }
    el.innerHTML = `<h4><i class="fas fa-credit-card"></i> Pagamentos online e maquininha (Asaas)</h4>` + (ativo ? `
      <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Qualquer pessoa paga em <strong>Ajude o Parque &gt; Pagar online</strong> com PIX, cartão de crédito, cartão de débito ou boleto. Aqui você traz os valores já recebidos para a Prestação de Contas (a mesma cobrança nunca entra duas vezes). A tarifa cobrada pelo Asaas vira uma Saída automaticamente.</p>
      <div class="form-reserva">
        <div class="form-row"><label for="as-t">Senha de conferência (definida no servidor)</label><input id="as-t" type="password" autocomplete="off" value="${esc(tk)}"></div>
        <div class="form-row"><label for="as-d">Buscar recebimentos desde</label><input id="as-d" type="date" value="${esc((ult && ult.ate) || hoje().slice(0, 8) + '01')}"></div>
        <div class="form-row"><label><input type="checkbox" id="as-f" checked> Lançar a tarifa do Asaas como Saída (${esc(TARIFA)})</label></div>
        <button class="btn-visit" id="as-b" ${buscando ? 'disabled' : ''}><i class="fas fa-sync"></i> ${buscando ? 'Buscando...' : 'Buscar recebimentos no Asaas'}</button>
        ${ult ? `<p class="aviso-local">Última busca: ${esc(fmtData(ult.quando))} (${ult.novas} lançamento(s) novo(s)).</p>` : ''}
      </div>` : `
      <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> A ligação com o Asaas ainda <strong>não está ativada</strong> (falta publicar a função de servidor e preencher <code>config-pagamentos.js</code>; passo a passo em <code>docs/PAGAMENTOS_ASAAS.md</code>). Enquanto isso, lance os valores à mão no formulário acima escolhendo a moeda <strong>Asaas</strong> e a forma usada (PIX, boleto, cartão de crédito, cartão de débito ou <strong>Maquininha</strong> presencial).</p>`) +
      (msg ? `<p class="${erro ? 'form-erro' : 'tip-box'}" role="alert">${esc(msg)}</p>` : '') +
      `<p class="aviso-local">Vendas na maquininha física: o Asaas deposita na mesma conta. Registre cada venda presencial no formulário (moeda Asaas, forma Maquininha) ou confira pelo extrato do Asaas.</p>`;
    const b = $('#as-b', el);
    if (!b) return;
    b.onclick = async () => {
      const token = $('#as-t', el).value.trim(), desde = $('#as-d', el).value, tarifa = $('#as-f', el).checked;
      if (!token) { msg = 'Informe a senha de conferência.'; erro = true; return painel(el, H, redraw); }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) { msg = 'Informe a data inicial.'; erro = true; return painel(el, H, redraw); }
      try { sessionStorage.setItem('pr_asaas_tk', token); } catch (e) { /* ignora */ }
      buscando = true; msg = ''; painel(el, H, redraw);
      try {
        const r = await fetch(cfg.url.replace(/\/+$/, '') + '/recebimentos?desde=' + encodeURIComponent(desde), { headers: { 'x-admin-token': token, Accept: 'application/json' } });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.erro || ('O servidor respondeu ' + r.status + '.'));
        const l = db.get('contas', []), res = importar(j.recebimentos || [], l, { uid, tarifa });
        if (res.novas.length && !db.set('contas', l.concat(res.novas))) throw new Error('Sem espaço no navegador para salvar os lançamentos.');
        db.set('asaas_sync', { quando: hoje(), ate: hoje(), novas: res.novas.filter(c => c.tipo === 'Entrada').length });
        const ent = res.novas.filter(c => c.tipo === 'Entrada');
        msg = ent.length ? `${ent.length} recebimento(s) novo(s) lançado(s), total ${money(ent.reduce((t, c) => t + c.valor, 0), 'ASAAS')}.` + (res.repetidas ? ` ${res.repetidas} já estavam lançados.` : '') : 'Nenhum recebimento novo' + (res.repetidas ? ` (${res.repetidas} já estavam lançados).` : '.');
        erro = false;
      } catch (e) { msg = 'Não foi possível buscar no Asaas: ' + e.message; erro = true; }
      buscando = false; redraw();
    };
  }
  return { TIPOS, FORMAS_VALIDAS, TARIFA, importar, painel };
});
