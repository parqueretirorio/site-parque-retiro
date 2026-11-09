import asyncio, subprocess, time, os, json
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8766","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
csvtxt="""Nome;Categoria;Quantidade;Unidade;Localização;Conservação;Status;Responsável;Projeto/Campanha;Marca;Modelo;Número de série;Descrição;Observações
Mesa A;Móveis, Utensílios e Equipamentos;2;un;Sala 1;Bom;Disponível;Ana;;;;;;
Furadeira;Ferramentas e Máquinas;1;un;Oficina;Regular;Disponível;Ana;;Bosch;X1;SN123;;
Furadeira cópia;Ferramentas e Máquinas;1;un;Depósito;Bom;Disponível;Ana;;Bosch;X1;SN123;;
Mesa A;Móveis, Utensílios e Equipamentos;1;un;Sala 1;Bom;Disponível;Ana;;;;;;
Item ruim;Categoria X;abc;un;;Péssimo;Disponível;;;;;;;
=cmd|' /C calc'!A0;Limpeza e Consumo;5;un;Almoxarifado;Novo;Disponível;Ana;;;;;;
"""
open('imp.csv','w',encoding='utf-8').write(csvtxt)
async def aba(pg,t,**k):
    # CONecta Retiro: as ferramentas ficam numa caixa flutuante; abre a caixa da área e clica na ferramenta
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto("http://localhost:8766/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # item pré-existente: Mesa A / Sala 1 (para testar duplicidade com o existente)
        await pg.evaluate("PR_DADOS.db.set('inv_itens',[{id:'x1',codigo:'INV-0001',nome:'Mesa A',local:'Sala 1',cat:'mov',quantidade:1,status:'Disponível',conserv:'Bom',foto:'data:image/png;base64,AAAA'}]);PR_DADOS.db.set('inv_cod',[{codigo:'INV-0001',item:'x1'}]);PR_DADOS.db.set('inv_seq',{INV:1})")
        await pg.reload(); await aba(pg,'inventario'); await pg.click('[data-s="imp"]')
        await pg.set_input_files('#im-f','imp.csv'); await pg.wait_for_selector('#im-ok')
        print(await pg.inner_text('#inv-sub p:nth-of-type(3)'))
        rows=await pg.eval_on_selector_all('#inv-sub tbody tr','r=>r.map(x=>x.innerText.replace(/\\s+/g," "))'); print("\n".join(rows))
        async with pg.expect_download() as dl: await pg.click('#im-rel')
        print("RELATORIO:",open(await (await dl.value).path(),encoding='utf-8-sig').read()[:400])
        await pg.click('#im-ok'); await pg.wait_for_selector("text=importado(s)")
        its=await pg.evaluate("PR_DADOS.db.get('inv_itens',[]).map(i=>[i.codigo,i.nome,i.quantidade,i.local,i.origem||''])"); print(its)
        cods=[i[0] for i in its]; assert len(set(cods))==len(cods)
        assert any(i[1]=='Mesa A' and i[0]=='INV-0001' for i in its) and sum(1 for i in its if i[1]=='Mesa A')==1
        assert sum(1 for i in its if 'Furadeira' in i[1])==1
        assert not any(i[1]=='Item ruim' for i in its)
        # foto do item existente preservada
        assert await pg.evaluate("PR_DADOS.db.get('inv_itens',[]).find(i=>i.id==='x1').foto")=='data:image/png;base64,AAAA'
        # inj. de fórmula: nome salvo com '=' deve sair neutralizado no CSV exportado
        n=[i for i in its if i[1].startswith("=")]; print("FORMULA item:",n)
        # guarda de restauração sem flag
        r=await pg.evaluate("PR_DADOS.restaurarBackup({formato:'parque-retiro-backup'},{}).then(()=>'permitiu',e=>e.message)"); print("SEM FLAG:",r); assert 'Baixe o backup' in r
        # reimportar o mesmo arquivo: tudo vira duplicado
        await pg.click('[data-s="imp"]'); await pg.set_input_files('#im-f','imp.csv'); await pg.wait_for_selector('#im-rel')
        print("REIMPORT:",await pg.inner_text('#inv-sub p:nth-of-type(3)'))
        print("ERROS JS:",errs); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
