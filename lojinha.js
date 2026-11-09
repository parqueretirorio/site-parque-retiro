// Lojinha do Parque (área restrita > Comissões Parque Retiro > Lojinha).
// Produtos, estoque, publicação no site (Ajude o Parque > Lojinha), custos de produção e formação de preço, vendas e relatório.
// Dados: 'loja_itens' (produtos) e 'loja_vendas' (vendas). Toda venda é lançada automaticamente na Prestação de Contas
// (centro "Livraria e Lojinha", origem "Lojinha"), e por isso aparece na planilha consolidada (Orçamento e Fluxo Financeiro),
// no grupo "Ajude o Parque". A página pública lojinha.html lê os produtos marcados como publicados (lojinhaPag em area.js).
(function () {
const CATEG = ['Camisetas', 'Broches', 'Cadernos', 'Artesanato', 'Outros'];
const TCUSTO = ['Material', 'Mão de obra', 'Embalagem', 'Outros'];
const r2 = v => Math.round(v * 100) / 100;

window.PR_LOJINHA = {
  abrir(me, root, H) {
    const { esc, $, db, uid, hoje, fmtData, csv, reduz, MOEDA, money } = H;
    const itens = () => db.get('loja_itens', []), vendas = () => db.get('loja_vendas', []);
    const brl = v => money(v, 'PIX');
    const SUB = [['prod', 'Produtos e estoque'], ['custo', 'Custos e preço'], ['venda', 'Registrar venda'], ['rel', 'Vendas e relatório']];
    let sub = 'prod', editId = null, custoId = '', msg = '';
    const aviso = () => msg ? `<p class="tip-box" role="status">${esc(msg)}</p>` : '';
    const custoTotal = i => (i.custos || []).reduce((t, c) => t + c.valor, 0);
    const custoUnit = i => (i.custos || []).length && i.lote > 0 ? r2(custoTotal(i) / i.lote) : null;
    const vendidos = id => vendas().filter(s => s.item === id).reduce((t, s) => t + s.qtd, 0);
    const lancaConta = v => {
      const cs = db.get('contas', []), id = uid();
      cs.push({ id, data: v.data, desc: `Venda na Lojinha: ${v.nome} (${v.qtd}x)`, centro: 'Livraria e Lojinha', tipo: 'Entrada', origem: 'Lojinha', vaquinha: '', valor: v.total, moeda: v.moeda, comp: '' });
      return db.set('contas', cs) ? id : '';
    };
    const miniatura = i => i.foto && /^data:image\//.test(i.foto) ? `<img class="loja-thumb" src="${esc(i.foto)}" alt="Foto de ${esc(i.nome)}">` : '<span class="loja-thumb loja-thumb-ph" aria-hidden="true"><i class="fas fa-gift"></i></span>';

    /* ---------- Produtos e estoque ---------- */
    const prod = el => {
      const ed = editId ? itens().find(i => i.id === editId) : null;
      const v = ed || { nome: '', descricao: '', categoria: 'Camisetas', preco: '', estoque: 0, origem: 'pronto', publicado: false, foto: '' };
      const lista = itens().slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      el.innerHTML = `<h3><i class="fas fa-store"></i> ${ed ? 'Editar produto' : 'Cadastrar produto'}</h3>
      <p>Produtos da Lojinha do Parque. Os marcados como <strong>publicados</strong> aparecem na página pública "Ajude o Parque &gt; Lojinha"; os demais ficam só aqui.</p>${aviso()}
      <form id="fj" class="form-reserva" novalidate>
        <div class="form-row"><label for="j-n">Nome do produto *</label><input id="j-n" required maxlength="100" value="${esc(v.nome)}" placeholder="Ex.: Camiseta Parque Retiro (M)"></div>
        <div class="form-row"><label for="j-d">Descrição</label><textarea id="j-d" rows="3" maxlength="500" placeholder="Material, tamanho, cor, para que serve...">${esc(v.descricao)}</textarea></div>
        <div class="form-row"><label for="j-c">Categoria</label><select id="j-c">${CATEG.map(c => `<option${c === v.categoria ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="form-row"><label for="j-o">Como o produto chega à Lojinha</label><select id="j-o"><option value="pronto"${v.origem === 'pronto' ? ' selected' : ''}>Pronto para venda (comprado ou doado)</option><option value="produzido"${v.origem === 'produzido' ? ' selected' : ''}>Produzido pelo Parque (tem custo de produção; veja a aba Custos e preço)</option></select></div>
        <div class="form-row"><label for="j-p">Preço de venda (R$) *</label><input id="j-p" type="number" min="0" step="0.01" required value="${v.preco === '' ? '' : esc(v.preco)}" placeholder="0,00"></div>
        <div class="form-row"><label for="j-e">${ed ? 'Estoque atual (unidades)' : 'Unidades em estoque'} *</label><input id="j-e" type="number" min="0" max="99999" step="1" required value="${esc(v.estoque)}"></div>
        <div class="form-row"><label for="j-f">Foto do produto (opcional)</label><input id="j-f" type="file" accept="image/*">${v.foto ? `<label><input type="checkbox" id="j-xf"> Remover a foto atual</label>` : ''}</div>
        <div class="form-row"><label><input type="checkbox" id="j-pub"${v.publicado ? ' checked' : ''}> Publicar no site (Ajude o Parque &gt; Lojinha)</label></div>
        <p class="form-erro" id="j-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas ${ed ? 'fa-save' : 'fa-plus-circle'}"></i> ${ed ? 'Salvar alterações' : 'Cadastrar produto'}</button>
        ${ed ? '<button type="button" class="btn-visit btn-large" id="j-x" style="background:#6c7a7b;margin-left:8px">Cancelar edição</button>' : ''}
      </form>
      <h4>Produtos cadastrados (${lista.length})</h4>${lista.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th></th><th>Produto</th><th>Preço</th><th>Estoque</th><th>Vendidos</th><th>No site</th><th>Ações</th></tr></thead><tbody>${lista.map(i => `<tr>
        <td>${miniatura(i)}</td><td>${esc(i.nome)}<br><small>${esc(i.categoria || '')}${i.origem === 'produzido' ? ' · produzido pelo Parque' : ''}</small></td><td>${brl(i.preco)}</td>
        <td>${i.estoque > 0 ? i.estoque : '<span class="badge-emprestado">Esgotado</span>'}</td><td>${vendidos(i.id)}</td>
        <td>${i.publicado ? '<span class="badge-disponivel">Publicado</span>' : '<span class="vazio">Oculto</span>'}</td>
        <td style="white-space:nowrap"><button class="btn-visit" data-pub="${i.id}" style="padding:5px 9px;font-size:.78rem">${i.publicado ? 'Ocultar' : 'Publicar'}</button>
        <button class="btn-visit" data-rep="${i.id}" style="padding:5px 9px;font-size:.78rem">+ Repor</button>
        <button class="icon-btn edit" data-ed="${i.id}" title="Editar" aria-label="Editar ${esc(i.nome)}"><i class="fas fa-edit"></i></button>
        <button class="icon-btn" data-del="${i.id}" title="Excluir" aria-label="Excluir ${esc(i.nome)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhum produto cadastrado ainda.</p>'}`;
      msg = '';
      el.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; draw(); window.scrollTo(0, 0); });
      el.querySelectorAll('[data-pub]').forEach(b => b.onclick = () => { const l = itens(), i = l.find(x => x.id === b.dataset.pub); i.publicado = !i.publicado; db.set('loja_itens', l); msg = i.nome + (i.publicado ? ' foi publicado no site.' : ' foi ocultado do site.'); draw(); });
      el.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => {
        const l = itens(), i = l.find(x => x.id === b.dataset.rep), n = parseInt(prompt(`Quantas unidades de "${i.nome}" chegaram ao estoque?`, '1'), 10);
        if (!(n >= 1)) return; i.estoque += n; db.set('loja_itens', l); msg = `Estoque de ${i.nome} reposto: +${n} (agora ${i.estoque}).`; draw();
      });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const i = itens().find(x => x.id === b.dataset.del);
        if (vendas().some(s => s.item === i.id)) { msg = 'Este produto já tem vendas registradas. Para manter o histórico, oculte-o do site e zere o estoque em vez de excluir.'; draw(); return; }
        if (!confirm('Excluir este produto da Lojinha?')) return;
        db.set('loja_itens', itens().filter(x => x.id !== i.id)); draw();
      });
      const x = $('#j-x', el); if (x) x.onclick = () => { editId = null; draw(); };
      $('#fj', el).onsubmit = async e => {
        e.preventDefault();
        const er = $('#j-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const nome = $('#j-n', el).value.trim(), p = parseFloat($('#j-p', el).value), q = parseInt($('#j-e', el).value, 10), arq = $('#j-f', el).files[0];
        if (!nome) return falha('Informe o nome do produto.');
        if (!(p >= 0)) return falha('Informe o preço de venda.');
        if (!(q >= 0)) return falha('Informe o estoque (0 ou mais).');
        let foto = ed ? ed.foto || '' : '';
        if ($('#j-xf', el) && $('#j-xf', el).checked) foto = '';
        if (arq) { if (!/^image\//.test(arq.type)) return falha('A foto precisa ser uma imagem (JPG, PNG ou WEBP).'); try { foto = await reduz(arq, 700, 0.78); } catch (x2) { return falha('Não foi possível ler a imagem.'); } }
        const dados = { nome, descricao: $('#j-d', el).value.trim(), categoria: $('#j-c', el).value, origem: $('#j-o', el).value, preco: r2(p), estoque: q, foto, publicado: $('#j-pub', el).checked };
        const l = itens(); if (ed) Object.assign(l.find(i => i.id === ed.id), dados); else l.push({ id: uid(), ...dados, custos: [], lote: 0, margem: 100, por: me.nome, data: hoje() });
        if (!db.set('loja_itens', l)) return falha('Não foi possível salvar neste navegador (espaço cheio?). Tente uma foto menor ou sem foto.');
        msg = ed ? 'Produto atualizado.' : 'Produto cadastrado.' + (dados.publicado ? ' Ele já aparece no site.' : ''); editId = null; draw();
      };
    };

    /* ---------- Custos de produção e formação de preço ---------- */
    const custo = el => {
      const lista = itens().slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      if (!lista.length) { el.innerHTML = '<h3><i class="fas fa-calculator"></i> Custos e formação de preço</h3><p class="vazio">Cadastre um produto na aba Produtos e estoque para calcular o custo e o preço.</p>'; return; }
      if (!lista.some(i => i.id === custoId)) custoId = lista[0].id;
      const i = lista.find(x => x.id === custoId), cs = i.custos || [], total = custoTotal(i);
      el.innerHTML = `<h3><i class="fas fa-calculator"></i> Custos de produção e formação de preço</h3>
      <p>Use quando o produto <strong>não vem pronto</strong> para venda (por exemplo, camisetas estampadas, cadernos, artesanato). Some os custos do lote, informe quantas unidades saíram e a margem desejada: a Lojinha sugere o preço. Estes custos servem de apoio para o preço e para o lucro estimado; as <em>vendas</em> é que vão para a Prestação de Contas.</p>${aviso()}
      <div class="form-row"><label for="cu-i">Produto</label><select id="cu-i">${lista.map(x => `<option value="${x.id}"${x.id === i.id ? ' selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></div>
      <h4>Custos do lote</h4>
      ${cs.length ? `<table class="doc-table"><thead><tr><th>Descrição</th><th>Tipo</th><th>Valor (R$)</th><th></th></tr></thead><tbody>${cs.map(c => `<tr><td>${esc(c.desc)}</td><td>${esc(c.tipo)}</td><td>${brl(c.valor)}</td><td><button class="icon-btn" data-xc="${c.id}" title="Remover custo" aria-label="Remover custo ${esc(c.desc)}"><i class="fas fa-trash"></i></button></td></tr>`).join('')}<tr><th colspan="2">Custo total do lote</th><th colspan="2">${brl(total)}</th></tr></tbody></table>` : '<p class="vazio">Nenhum custo lançado para este produto.</p>'}
      <form id="fcu" class="form-reserva" novalidate>
        <div class="form-row"><label for="cu-d">Descrição do custo *</label><input id="cu-d" maxlength="100" placeholder="Ex.: Tecido, estampa, linha, embalagem, horas de oficina"></div>
        <div class="form-row"><label for="cu-t">Tipo</label><select id="cu-t">${TCUSTO.map(t => `<option>${t}</option>`).join('')}</select></div>
        <div class="form-row"><label for="cu-v">Valor total no lote (R$) *</label><input id="cu-v" type="number" min="0.01" step="0.01" placeholder="0,00"></div>
        <p class="form-erro" id="cu-er" role="alert" hidden></p>
        <button class="btn-visit"><i class="fas fa-plus-circle"></i> Adicionar custo</button>
      </form>
      <h4>Formação do preço</h4>
      <div class="form-row"><label for="cu-l">Unidades produzidas neste lote</label><input id="cu-l" type="number" min="1" step="1" value="${i.lote > 0 ? i.lote : ''}" placeholder="Ex.: 20"></div>
      <div class="form-row"><label for="cu-m">Margem sobre o custo (%)</label><input id="cu-m" type="number" min="0" step="1" value="${i.margem == null ? 100 : i.margem}"></div>
      <div class="totais" id="cu-res" aria-live="polite"></div>
      <p><button class="btn-visit" id="cu-s"><i class="fas fa-save"></i> Salvar lote e margem</button> <button class="btn-visit" id="cu-a" disabled><i class="fas fa-tag"></i> Aplicar preço sugerido</button></p>`;
      msg = '';
      const calc = () => {
        const lote = parseInt($('#cu-l', el).value, 10), m = parseFloat($('#cu-m', el).value);
        const ok = total > 0 && lote > 0 && m >= 0, unit = ok ? total / lote : 0, sug = ok ? unit * (1 + m / 100) : 0, arr = ok ? Math.ceil(sug * 2) / 2 : 0;
        const lucro = i.preco - unit;
        $('#cu-res', el).innerHTML = ok ? `<div><span>Custo por unidade</span><strong>${brl(unit)}</strong></div><div><span>Preço sugerido</span><strong>${brl(r2(sug))}</strong></div><div><span>Sugerido arredondado (R$ 0,50)</span><strong>${brl(arr)}</strong></div><div><span>Preço atual de venda</span><strong>${brl(i.preco)}</strong></div><div><span>Lucro por unidade (preço atual)</span><strong style="${lucro < 0 ? 'color:#b3261e' : ''}">${brl(r2(lucro))}</strong></div>` : '<p class="vazio">Lance os custos, a quantidade do lote e a margem para ver o preço sugerido.</p>';
        const a = $('#cu-a', el); a.disabled = !ok; a.dataset.p = arr;
      };
      calc(); $('#cu-l', el).oninput = $('#cu-m', el).oninput = calc;
      $('#cu-i', el).onchange = e => { custoId = e.target.value; draw(); };
      const salvaParams = () => { const l = itens(), x = l.find(y => y.id === i.id); x.lote = Math.max(0, parseInt($('#cu-l', el).value, 10) || 0); x.margem = Math.max(0, parseFloat($('#cu-m', el).value) || 0); return [l, x]; };
      $('#cu-s', el).onclick = () => { const [l] = salvaParams(); db.set('loja_itens', l); msg = 'Lote e margem salvos.'; draw(); };
      $('#cu-a', el).onclick = e => { const [l, x] = salvaParams(); x.preco = r2(parseFloat(e.currentTarget.dataset.p)); x.origem = 'produzido'; db.set('loja_itens', l); msg = `Preço de venda de ${x.nome} atualizado para ${brl(x.preco)}.`; draw(); };
      el.querySelectorAll('[data-xc]').forEach(b => b.onclick = () => { const l = itens(), x = l.find(y => y.id === i.id); x.custos = (x.custos || []).filter(c => c.id !== b.dataset.xc); db.set('loja_itens', l); draw(); });
      $('#fcu', el).onsubmit = e => {
        e.preventDefault();
        const er = $('#cu-er', el), d = $('#cu-d', el).value.trim(), v = parseFloat($('#cu-v', el).value);
        if (!d || !(v > 0)) { er.textContent = 'Informe a descrição e um valor maior que zero.'; er.hidden = false; return; }
        const [l, x] = salvaParams(); x.custos = (x.custos || []).concat({ id: uid(), desc: d, tipo: $('#cu-t', el).value, valor: r2(v) }); x.origem = 'produzido'; db.set('loja_itens', l); draw();
      };
    };

    /* ---------- Registrar venda ---------- */
    const venda = el => {
      const disp = itens().filter(i => i.estoque > 0).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      el.innerHTML = `<h3><i class="fas fa-cash-register"></i> Registrar venda</h3>${aviso()}` + (disp.length ? `<form id="fv" class="form-reserva" novalidate>
        <div class="form-row"><label for="v-i">Produto *</label><select id="v-i">${disp.map(i => `<option value="${i.id}">${esc(i.nome)} (${brl(i.preco)} - ${i.estoque} em estoque)</option>`).join('')}</select></div>
        <div class="form-row"><label for="v-q">Quantidade *</label><input id="v-q" type="number" min="1" step="1" value="1" required></div>
        <div class="form-row"><label for="v-p">Preço unitário (R$) *</label><input id="v-p" type="number" min="0" step="0.01" required></div>
        <div class="form-row"><label for="v-m">Forma de pagamento *</label><select id="v-m">${Object.entries(MOEDA).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
        <div class="form-row"><label for="v-d">Data *</label><input id="v-d" type="date" value="${hoje()}" required></div>
        <div class="form-row"><label for="v-c">Comprador (opcional)</label><input id="v-c" maxlength="80"></div>
        <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> O valor da venda é lançado <strong>automaticamente</strong> na Prestação de Contas (origem Lojinha) e entra na planilha consolidada em "Ajude o Parque". Não lance a mesma venda de novo à mão.</p>
        <p id="v-tot" aria-live="polite"><strong></strong></p>
        <p class="form-erro" id="v-er" role="alert" hidden></p>
        <button class="btn-visit btn-large"><i class="fas fa-check"></i> Registrar venda</button></form>` : '<p class="vazio">Nenhum produto com estoque. Cadastre ou reponha o estoque na aba Produtos e estoque.</p>');
      const f = $('#fv', el); if (!f) return;
      msg = '';
      const item = () => itens().find(i => i.id === $('#v-i', el).value);
      const tot = () => { const q = parseInt($('#v-q', el).value, 10), p = parseFloat($('#v-p', el).value); $('#v-tot strong', el).textContent = q > 0 && p >= 0 ? 'Total: ' + brl(r2(q * p)) : ''; };
      $('#v-i', el).onchange = () => { $('#v-p', el).value = item().preco; tot(); };
      $('#v-q', el).oninput = $('#v-p', el).oninput = tot;
      $('#v-p', el).value = item().preco; tot();
      f.onsubmit = e => {
        e.preventDefault();
        const er = $('#v-er', el), falha = m => { er.textContent = m; er.hidden = false; }; er.hidden = true;
        const it = item(), q = parseInt($('#v-q', el).value, 10), p = parseFloat($('#v-p', el).value), d = $('#v-d', el).value;
        if (!it) return falha('Selecione o produto.');
        if (!(q >= 1)) return falha('Informe a quantidade.');
        if (q > it.estoque) return falha('Só há ' + it.estoque + ' unidade(s) em estoque.');
        if (!(p >= 0) || !d) return falha('Informe o preço e a data.');
        const v = { id: uid(), item: it.id, nome: it.nome, qtd: q, unit: r2(p), total: r2(q * p), custoUnit: custoUnit(it), moeda: $('#v-m', el).value, data: d, comprador: $('#v-c', el).value.trim(), por: me.nome, conta: '' };
        v.conta = lancaConta(v);
        const l = itens(); l.find(i => i.id === it.id).estoque -= q;
        const vs = vendas(); vs.push(v);
        if (!db.set('loja_vendas', vs) || !db.set('loja_itens', l)) return falha('Não foi possível salvar a venda neste navegador.');
        msg = `Venda registrada: ${q}x ${it.nome} (${money(v.total, v.moeda)}).` + (v.conta ? ' Lançada na Prestação de Contas.' : ' Atenção: o lançamento em Prestação de Contas falhou; avise o Administrador.');
        draw();
      };
    };

    /* ---------- Vendas e relatório ---------- */
    const rel = el => {
      const vs = vendas().slice().sort((a, b) => b.data.localeCompare(a.data)), its = itens();
      const porMoeda = {}; vs.forEach(s => porMoeda[s.moeda] = (porMoeda[s.moeda] || 0) + s.total);
      const qtdTot = vs.reduce((t, s) => t + s.qtd, 0), estTot = its.reduce((t, i) => t + i.estoque, 0);
      const lucro = vs.filter(s => s.custoUnit != null).reduce((t, s) => t + s.total - s.qtd * s.custoUnit, 0);
      el.innerHTML = `<h3><i class="fas fa-chart-bar"></i> Vendas e relatório da Lojinha</h3>${aviso()}
      <div class="totais"><div><span>Vendas registradas</span><strong>${vs.length}</strong></div><div><span>Unidades vendidas</span><strong>${qtdTot}</strong></div><div><span>Unidades em estoque</span><strong>${estTot}</strong></div>${Object.keys(MOEDA).filter(m => porMoeda[m]).map(m => `<div><span>Arrecadado: ${MOEDA[m]}</span><strong>${money(porMoeda[m], m)}</strong></div>`).join('')}<div><span>Lucro estimado (produtos com custo)</span><strong>${brl(r2(lucro))}</strong></div></div>
      <p class="tip-box" role="note"><i class="fas fa-info-circle"></i> Todas as vendas abaixo já estão na Prestação de Contas e na planilha consolidada (Relatórios Consolidados &gt; Orçamento e Fluxo Financeiro, linha Lojinha em "Ajude o Parque").</p>
      <p><button class="btn-visit" id="lr-p"><i class="fas fa-print"></i> Imprimir relatório</button> <button class="btn-visit" id="lr-c"><i class="fas fa-file-csv"></i> Baixar vendas (CSV)</button></p>
      <h4>Situação por produto</h4>${its.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Produto</th><th>Preço</th><th>Custo unitário</th><th>Estoque</th><th>Vendidos</th><th>Arrecadado (R$)</th></tr></thead><tbody>${its.map(i => { const cu = custoUnit(i); return `<tr><td>${esc(i.nome)}</td><td>${brl(i.preco)}</td><td>${cu == null ? '-' : brl(cu)}</td><td>${i.estoque}</td><td>${vendidos(i.id)}</td><td>${brl(vendas().filter(s => s.item === i.id).reduce((t, s) => t + s.total, 0))}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Sem produtos.</p>'}
      <h4>Vendas</h4>${vs.length ? `<div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Total</th><th>Comprador</th><th>Contas</th><th></th></tr></thead><tbody>${vs.map(s => `<tr><td>${fmtData(s.data)}</td><td>${esc(s.nome)}</td><td>${s.qtd}</td><td>${money(s.total, s.moeda)}<br><small>${esc(MOEDA[s.moeda])}</small></td><td>${esc(s.comprador || '-')}</td><td>${s.conta ? 'Lançada' : '<span class="form-erro">Não lançada</span> <button class="btn-visit" data-lc="' + s.id + '" style="padding:4px 8px;font-size:.75rem">Lançar</button>'}</td><td><button class="icon-btn" data-es="${s.id}" title="Estornar venda" aria-label="Estornar venda de ${esc(s.nome)}"><i class="fas fa-undo"></i></button></td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma venda registrada.</p>'}`;
      msg = '';
      $('#lr-p', el).onclick = () => window.print();
      $('#lr-c', el).onclick = () => {
        const rows = [['Data', 'Produto', 'Quantidade', 'Preço unitário', 'Total', 'Forma de pagamento', 'Comprador', 'Registrada por', 'Lançada em Prestação de Contas']].concat(vs.map(s => [s.data, s.nome, s.qtd, s.unit, s.total, MOEDA[s.moeda], s.comprador, s.por, s.conta ? 'Sim' : 'Não']));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(rows)], { type: 'text/csv;charset=utf-8' })); a.download = 'vendas-lojinha.csv'; a.click();
      };
      el.querySelectorAll('[data-lc]').forEach(b => b.onclick = () => { const l = vendas(), s = l.find(x => x.id === b.dataset.lc), id = lancaConta(s); if (!id) { msg = 'Não foi possível lançar em Prestação de Contas.'; draw(); return; } s.conta = id; db.set('loja_vendas', l); draw(); });
      el.querySelectorAll('[data-es]').forEach(b => b.onclick = () => {
        const s = vendas().find(x => x.id === b.dataset.es);
        if (!confirm('Estornar esta venda? O estoque será devolvido' + (s.conta ? ' e o lançamento em Prestação de Contas será removido.' : '.'))) return;
        if (s.conta) db.set('contas', db.get('contas', []).filter(c => c.id !== s.conta));
        const l = itens(), it = l.find(i => i.id === s.item); if (it) { it.estoque += s.qtd; db.set('loja_itens', l); }
        db.set('loja_vendas', vendas().filter(x => x.id !== s.id)); msg = 'Venda estornada.'; draw();
      });
    };

    const draw = () => {
      root.innerHTML = `<div class="tabs sub" role="tablist" aria-label="Lojinha">${SUB.map(t => `<button class="tab-btn${t[0] === sub ? ' active' : ''}" data-lj="${t[0]}">${t[1]}</button>`).join('')}</div><div id="lj-sub"></div>`;
      root.querySelectorAll('[data-lj]').forEach(b => b.onclick = () => { sub = b.dataset.lj; editId = null; msg = ''; draw(); });
      ({ prod, custo, venda, rel })[sub]($('#lj-sub', root));
    };
    draw();
  }
};
})();
