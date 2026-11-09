# Monta i18n/<idioma>.js a partir de i18n/_trad_*.txt (linhas: id‖es‖it‖fr‖en‖de) e da lista de textos em i18n/_ordem.json.
# Rodar da pasta do site:  python3 tools/montar_traducoes.py
import json, glob, os, sys
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); I=os.path.join(SITE,'i18n')
ordem=json.load(open(os.path.join(I,'_ordem.json'),encoding='utf-8'))
LANGS=['es','it','fr','en','de']; SUF=' | Parque de Estudo e Reflexão Retiro'
tab={l:{} for l in LANGS}; vistos=set(); erros=[]
for f in sorted(glob.glob(os.path.join(I,'_trad_*.txt'))):
    for n,linha in enumerate(open(f,encoding='utf-8').read().split('\n'),1):
        if not linha.strip(): continue
        p=linha.split('‖')
        if len(p)!=6: erros.append(f"{os.path.basename(f)}:{n} tem {len(p)} campos"); continue
        i=int(p[0]); k=ordem[i]
        if k.endswith(SUF): k=k[:-len(SUF)]
        vistos.add(i)
        for l,t in zip(LANGS,p[1:]): tab[l][k]=t.strip()
for l in LANGS:
    with open(os.path.join(I,l+'.js'),'w',encoding='utf-8') as o:
        o.write('// Tabela de tradução (português -> %s) do site público. Gerada por tools/montar_traducoes.py; revisar com a Comissão do Site.\n(window.PR_I18N_DATA=window.PR_I18N_DATA||{}).%s=%s;\n'%(l,l,json.dumps(tab[l],ensure_ascii=False,indent=0)))
print(len(vistos),'textos traduzidos de',len(ordem)); print('\n'.join(erros) or 'sem erros de formato')
