<?php
/*
  PRESSENZA AUTOMÁTICO - "Últimas da Pressenza" na página Blogger
  ----------------------------------------------------------------
  Este arquivo só funciona quando o site estiver num servidor com PHP
  (o cPanel normalmente já tem). Sem PHP, a página Blogger continua
  funcionando normalmente, só sem o bloco automático.

  Ele busca a lista de matérias da Pressenza, guarda uma cópia por
  algumas horas (assim o site não fica lento) e entrega só: título,
  data, um resumo curto e o link da matéria original.
  O texto completo e as fotos NÃO são copiados.

  Para ajustar, mexa só nas linhas da CONFIGURAÇÃO abaixo.
*/

// ===== CONFIGURAÇÃO =====
$FEED_URL    = 'https://www.pressenza.com/pt-pt/feed/'; // endereço do feed (RSS) da Pressenza
$MAX_ITENS   = 6;                                        // quantas matérias mostrar
$HORAS_CACHE = 6;                                        // de quantas em quantas horas atualizar
$PALAVRAS    = array();                                  // vazio = todas. Exemplo: array('Brasil','humanismo','não-violência')
// =========================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=600');

$cache = __DIR__ . '/pressenza-cache.json';

function responde($itens) {
    echo json_encode(array('itens' => $itens), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function le_cache($arquivo) {
    if (!is_file($arquivo)) return null;
    $j = json_decode(@file_get_contents($arquivo), true);
    return (is_array($j) && isset($j['itens']) && is_array($j['itens'])) ? $j : null;
}

// 1) Cópia guardada ainda é recente? Usa direto.
$guardado = le_cache($cache);
if ($guardado && isset($guardado['quando']) && (time() - (int)$guardado['quando']) < $HORAS_CACHE * 3600) {
    responde($guardado['itens']);
}

// 2) Busca o feed na Pressenza
function baixa($url) {
    if (function_exists('curl_init')) {
        $c = curl_init($url);
        curl_setopt_array($c, array(
            CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_USERAGENT => 'ParqueRetiro-Blogger/1.0 (+leitura do feed publico)',
        ));
        $r = curl_exec($c); $ok = curl_getinfo($c, CURLINFO_HTTP_CODE) === 200; curl_close($c);
        return $ok ? $r : false;
    }
    $ctx = stream_context_create(array('http' => array('timeout' => 8, 'header' => "User-Agent: ParqueRetiro-Blogger/1.0\r\n")));
    return @file_get_contents($url, false, $ctx);
}

$xml_txt = baixa($FEED_URL);
$itens = array();

if ($xml_txt) {
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xml_txt, 'SimpleXMLElement', LIBXML_NONET);
    if ($xml && isset($xml->channel->item)) {
        foreach ($xml->channel->item as $it) {
            $titulo = trim(html_entity_decode(strip_tags((string)$it->title), ENT_QUOTES, 'UTF-8'));
            $link   = trim((string)$it->link);
            if ($titulo === '' || strpos($link, 'https://www.pressenza.com/') !== 0) continue; // só links da Pressenza

            $resumo = html_entity_decode(strip_tags((string)$it->description), ENT_QUOTES, 'UTF-8');
            $resumo = trim(preg_replace('/\s+/u', ' ', $resumo));
            $resumo = preg_replace('/\s*(O post|The post)\b.*$/us', '', $resumo); // tira o rodapé automático "O post ... apareceu primeiro em ..."
            if (mb_strlen($resumo) > 260) $resumo = rtrim(mb_substr($resumo, 0, 260), " ,.;:-") . '…';

            $cats = array();
            foreach ($it->category as $c) $cats[] = trim((string)$c);

            if ($PALAVRAS) {
                $texto = mb_strtolower($titulo . ' ' . $resumo . ' ' . implode(' ', $cats));
                $achou = false;
                foreach ($PALAVRAS as $p) { if ($p !== '' && mb_strpos($texto, mb_strtolower($p)) !== false) { $achou = true; break; } }
                if (!$achou) continue;
            }

            $ts = strtotime((string)$it->pubDate);
            $itens[] = array(
                'titulo' => $titulo,
                'link'   => $link,
                'data'   => $ts ? date('Y-m-d', $ts) : '',
                'tema'   => $cats ? $cats[0] : '',
                'resumo' => $resumo,
            );
            if (count($itens) >= $MAX_ITENS) break;
        }
    }
}

// 3) Guarda a cópia (se a pasta permitir) e responde
if ($itens) {
    @file_put_contents($cache, json_encode(array('quando' => time(), 'itens' => $itens), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    responde($itens);
}

// 4) Pressenza fora do ar? Usa a última cópia guardada, mesmo antiga.
if ($guardado) responde($guardado['itens']);

http_response_code(503);
responde(array());
