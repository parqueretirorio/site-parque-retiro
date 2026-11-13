# Gera app/ferramenta.html a partir de area-restrita.html (rode sempre que mudar area-restrita.html):
#   python3 tools/gerar_ferramenta_app.py
# A página fica dentro da pasta do app, então o celular a abre na janela do app CONecta Retiro (sem a barra do navegador).
# <base href="../"> faz todos os arquivos e links continuarem apontando para a raiz do site.
import os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(raiz, 'area-restrita.html'), encoding='utf-8').read()
s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <base href="../">\n    <!-- GERADO por tools/gerar_ferramenta_app.py a partir de area-restrita.html: não edite à mão. Abre a área restrita DENTRO do app CONecta Retiro. -->\n    <meta name="theme-color" content="#1d4a7a">\n    <link rel="manifest" href="app/manifest.webmanifest">', 1)
s = s.replace('<title>CONecta Retiro | Parque de Estudo e Reflexão Retiro</title>', '<title>CONecta Retiro</title>', 1)
open(os.path.join(raiz, 'app', 'ferramenta.html'), 'w', encoding='utf-8').write(s)
print('app/ferramenta.html gerado')
