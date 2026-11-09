// Página pública "Pagar online": coleta os dados, pede a cobrança à função de servidor e leva a pessoa à tela segura do Asaas.
// Nenhuma chave fica aqui. Se a integração não estiver ativa (config-pagamentos.js), a página só mostra o aviso.
(function () {
  const cfg = window.PR_PAGAMENTOS || {}, T = window.PR_ASAAS.TIPOS, $ = s => document.querySelector(s);
  const ativo = !!(cfg.ativo && cfg.url);
  const sel = $('#pg-t');
  sel.innerHTML = Object.entries(T).map(([k, t]) => `<option value="${k}">${t.rotulo}</option>`).join('');
  const params = new URLSearchParams(location.search);
  if (T[params.get('tipo')]) sel.value = params.get('tipo');
  const sinc = () => { const t = T[sel.value]; $('#pg-rr').hidden = !t.ref; if (t.ref) $('#pg-rl').textContent = t.ref + ' *'; };
  sel.onchange = sinc; sinc();
  if (!ativo) { $('#pg-aviso').hidden = false; $('#pg-form').querySelectorAll('input,select,button').forEach(e => { e.disabled = true; }); return; }
  const erro = m => { const e = $('#pg-er'); e.textContent = m; e.hidden = false; $('#pg-b').disabled = false; };
  $('#pg-form').onsubmit = async ev => {
    ev.preventDefault(); $('#pg-er').hidden = true;
    const t = T[sel.value], v = parseFloat($('#pg-v').value), nome = $('#pg-n').value.trim(), cpf = $('#pg-c').value.replace(/\D/g, ''), email = $('#pg-e').value.trim(), ref = $('#pg-r').value.trim();
    if (t.ref && !ref) return erro('Preencha: ' + t.ref + '.');
    if (!(v >= 5)) return erro('O valor mínimo é R$ 5,00.');
    if (nome.split(/\s+/).length < 2) return erro('Informe o nome completo.');
    if (cpf.length !== 11 && cpf.length !== 14) return erro('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return erro('Informe um e-mail válido.');
    if (!$('#pg-ok').checked) return erro('É preciso autorizar o uso dos dados para este pagamento.');
    $('#pg-b').disabled = true; $('#pg-b').textContent = 'Gerando pagamento...';
    try {
      const r = await fetch(cfg.url.replace(/\/+$/, '') + '/criar-cobranca', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: sel.value, valor: v, nome, cpfCnpj: cpf, email, celular: $('#pg-m').value.trim(), referencia: ref, consentimento: true, site: $('#pg-s').value }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.invoiceUrl) throw new Error(j.erro || 'Não foi possível gerar o pagamento agora.');
      if (!/^https:\/\/([a-z0-9-]+\.)*asaas\.com\//i.test(j.invoiceUrl)) throw new Error('Resposta inesperada do servidor de pagamento.');
      location.href = j.invoiceUrl;
    } catch (e) { erro(e.message); $('#pg-b').innerHTML = '<i class="fas fa-lock"></i> Ir para o pagamento seguro'; }
  };
})();
