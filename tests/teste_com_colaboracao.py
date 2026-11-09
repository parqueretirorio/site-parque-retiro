# Teste de tela da Colaboração da Comunicação (Prompt 07): detalhes, equipe, comentários, tarefas, versões,
# aprovação registrada, arquivos, indicadores e Conectores (nenhuma conta conectada). Dados fictícios, no navegador.
# Rodar a partir da pasta do site:  python3 tests/teste_com_colaboracao.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8772","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith("http://localhost:8772") and not r.url.startswith("data:") else None)
        await pg.goto("http://localhost:8772/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'comunicacao'); await pg.click('[data-s="pub"]'); await pg.click('[data-pv="lista"]'); await pg.click('#p-novo')
        await pg.fill('#p-t','Convite fictício da Sala'); await pg.fill('#p-x','Texto original fictício.'); await pg.click('#fp button.btn-visit.btn-large >> nth=0'); await pg.wait_for_selector('.doc-table')
        ps=await pg.evaluate("PR_DADOS.db.get('com_posts',[])"); ok(len(ps)==1,"publicação de teste criada"); pid=ps[0]['id']
        ok(len(ps[0].get('versoes',[]))>=1,"primeira gravação cria a versão 1")
        # sub-abas novas só para quem gere
        subs=await pg.eval_on_selector_all('[data-s]','e=>e.map(x=>x.dataset.s)')
        ok(all(x in subs for x in ['equipe','arq','ind','conect']),"sub-abas Equipe, Arquivos, Indicadores e Conectores aparecem")
        # detalhes: equipe, comentário, tarefa
        await pg.click(f'[data-pdet="{pid}"]'); await pg.wait_for_selector('#dt-box')
        await pg.fill('#dt-autores','autor@teste.com'); await pg.fill('#dt-revisores','rev@teste.com'); await pg.fill('#dt-aprovadores','apr@teste.com'); await pg.fill('#dt-publicadores','pub@teste.com')
        await pg.click('#dt-eq'); eq=(await pg.evaluate("PR_DADOS.db.get('com_posts',[])"))[0].get('equipe',{})
        ok(eq.get('aprovadores')==['apr@teste.com'] and eq.get('revisores')==['rev@teste.com'],"equipe da publicação salva")
        await pg.fill('#dt-ct','Comentário fictício'); await pg.click('#dt-ca')
        ok(len(await pg.evaluate("PR_DADOS.db.get('com_comentarios',[])"))==1,"comentário registrado")
        await pg.fill('#dt-tt','Tarefa fictícia'); await pg.fill('#dt-tp','2026-12-01'); await pg.click('#dt-ta')
        ok(len(await pg.evaluate("PR_DADOS.db.get('com_tarefas',[])"))==1,"tarefa registrada")
        await pg.click('#dt-fechar')
        # aprovação registra quem aprovou; mudar o texto depois devolve à aprovação e cria a versão 2
        for st in ['Aguardando aprovação','Aprovada']:
            await pg.select_option(f'[data-st="{pid}"]',label=st)
        q=(await pg.evaluate("PR_DADOS.db.get('com_posts',[])"))[0]
        ok(q['status']=='Aprovada' and q.get('aprovadoPor')=='Admin Teste' and q.get('aprovadoVersao'),f"aprovação registra quem e a versão (status={q['status']})")
        await pg.click(f'[data-pe="{pid}"]'); await pg.fill('#p-x','Texto alterado depois de aprovado.'); await pg.click('#fp button.btn-visit.btn-large >> nth=0'); await pg.wait_for_selector('.doc-table')
        q=(await pg.evaluate("PR_DADOS.db.get('com_posts',[])"))[0]
        ok(q['status']=='Aguardando aprovação',f"texto mudou depois de aprovado: volta para aprovação ({q['status']})")
        ok(len(q.get('versoes',[]))>=2 and len(q.get('hist',[]))>=3,"versão 2 criada e histórico registrado (versões=%d, hist=%d)"%(len(q.get('versoes',[])),len(q.get('hist',[]))))
        # reaprovar e publicar
        for st in ['Aprovada','Publicada']:
            await pg.select_option(f'[data-st="{pid}"]',label=st)
        q=(await pg.evaluate("PR_DADOS.db.get('com_posts',[])"))[0]; ok(q['status']=='Publicada' and q.get('publicadoPor'),"publicada com registro de quem publicou")
        # arquivos
        await pg.click('[data-s="arq"]'); await pg.fill('#ar-n','Arte fictícia'); await pg.fill('#ar-l','https://exemplo.test/arte'); await pg.fill('#ar-o','Equipe de teste'); await pg.select_option('#ar-i','sim'); await pg.select_option('#ar-p',[pid]); await pg.click('#ar-f button.btn-large')
        ar=await pg.evaluate("PR_DADOS.db.get('com_arquivos',[])"); ok(len(ar)==1 and ar[0]['versoes'][0]['n']==1 and ar[0]['posts']==[pid],"arquivo cadastrado com versão 1 e ligado à publicação")
        ok('Arte fictícia' in await pg.inner_text('#com-sub'),"arquivo aparece no catálogo")
        # indicadores
        await pg.click('[data-s="ind"]'); await pg.select_option('#in-i','alcance'); await pg.fill('#in-v','123'); await pg.click('#in-f button.btn-large')
        m=await pg.evaluate("PR_DADOS.db.get('com_metricas',[])"); ok(len(m)==1 and m[0]['valor']==123 and m[0]['fonte']=='manual',"número registrado como manual")
        # conectores
        await pg.click('[data-s="conect"]'); txt=await pg.inner_text('#com-sub')
        ok('Nenhuma conta está conectada' in txt,"painel diz que nenhuma conta está conectada")
        ok(all(x in txt for x in ['Facebook','Instagram','YouTube','WhatsApp','TikTok','LinkedIn']),"canais listados com o que a API permite")
        cs=await pg.evaluate("JSON.stringify(PR_DADOS.db.get('com_conectores',[]))"); ok(not any(k in cs.lower() for k in ['token','secret','senha','chave']),"conectores não guardam segredo")
        # o site já carrega o Font Awesome do cdnjs (ícones); isso não conta. Nenhuma chamada a redes sociais ou APIs.
        ext=[u for u in net if "cdnjs.cloudflare.com" not in u and "fonts.g" not in u]
        ok(not ext,f"nenhuma chamada a redes sociais ou APIs ({ext})")
        print("ERROS JS:",errs); ok(not errs,"sem erros de JavaScript")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
