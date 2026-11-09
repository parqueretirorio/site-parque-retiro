import asyncio, json, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8765","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
async def aba(pg,t,**k):
    # CONecta Retiro: as ferramentas ficam numa caixa flutuante; abre a caixa da área e clica na ferramenta
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium') if os.path.exists('/opt/pw-browsers/chromium') else await p.chromium.launch()
        ctx=await b.new_context(accept_downloads=True); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("http://localhost:8765/login.html")
        await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok')
        await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # cria dados de teste via camada de dados (itens fictícios)
        await pg.evaluate("""()=>{const d=PR_DADOS.db; d.set('inv_itens',[{id:'a1',codigo:'INV-0001',nome:'Mesa'},{id:'a2',codigo:'INV-0002',nome:'Cadeira'}]);}""")
        await pg.evaluate("""()=>{const d=PR_DADOS.db; d.set('inv_itens',[{id:'a1',codigo:'INV-0001',nome:'Mesa v2'}]);}""")
        r=await pg.evaluate("({aud:PR_DADOS.auditoria().filter(a=>a.colecao==='inv_itens'),lix:PR_DADOS.lixeira().map(x=>x.registro.id)})")
        print("AUDIT",r)
        assert r['lix']==['a2'] and len(r['aud'])==2
        # aba backup
        await pg.reload(); await aba(pg,'backup')
        assert 'Nenhum backup' in await pg.inner_text('#tab')
        async with pg.expect_download() as dl: await pg.click('#bk-baixar')
        f=await dl.value; path=await f.path(); bk=json.load(open(path)); print("BACKUP chaves",list(bk['contagem'].items())[:6])
        assert bk['contagem']['inv_itens']==1
        # altera dados depois do backup
        await pg.evaluate("PR_DADOS.db.set('inv_itens',[])")
        # restaurar sem baixar -> botão desabilitado numa página nova
        await pg.reload(); await aba(pg,'backup')
        await pg.set_input_files('#bk-arq',path)
        await pg.wait_for_selector('#bk-rest')
        assert await pg.is_disabled('#bk-rest')
        # tentativa direta sem flag
        e=await pg.evaluate("PR_DADOS.restaurarBackup({formato:'parque-retiro-backup'},{}).then(()=>'permitiu',e=>e.message)")
        assert 'Baixe o backup' in e
        print("SEM FLAG:",e)
        # backup adulterado
        bad=json.loads(json.dumps(bk)); bad['dados']['inv_itens'][0]['nome']='HACK'
        v=await pg.evaluate("(o)=>PR_DADOS.validarBackup(o)",bad); print("ADULTERADO:",v['erros'])
        assert not v['ok']
        # baixa estado atual e restaura
        async with pg.expect_download() as dl2: await pg.click('#bk-baixar')
        await dl2.value
        await pg.set_input_files('#bk-arq',path); await pg.wait_for_selector('#bk-rest')
        pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.click('#bk-rest'); await pg.wait_for_selector("text=restaurado com sucesso")
        n=await pg.evaluate("PR_DADOS.db.get('inv_itens',[]).map(i=>i.nome)"); print("RESTAURADO",n)
        assert n==['Mesa v2']
        u=await pg.evaluate("PR_DADOS.db.get('users',[]).length"); assert u==1
        # todas as abas abrem sem erro
        for t in ['acervo','inventario','documentos','comunicacao','contas','users','mapa','docip','relatorios']:
            try:
                await aba(pg,t,timeout=2000)
            except Exception as ex: print("aba ausente",t)
        print("ERROS JS:",errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
