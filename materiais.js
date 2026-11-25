// Agenda de endereços dos materiais do Parque (livros, áudios, vídeos e estudos).
// Os arquivos ficam no Google Drive da conta do Parque (pasta "Materiais do Parque (site antigo)"), fora do repositório.
// As páginas apontam para baixar.html?arquivo=NOME, e baixar.html consulta esta lista para abrir o arquivo certo.
// Para trocar o lugar de um arquivo (outro Drive, YouTube, outro endereço), mude só a linha dele aqui. Não é preciso mexer nas páginas.
// Cada linha: "nome do arquivo": "ID do Drive"  (ou um endereço completo começando com https://).
// Linha com "" (vazia) faz a página mostrar "em breve".
// Fonte da lista: Apps Script na conta do Parque em 24/11/2026 (95 arquivos).
(function () {
'use strict';
var DRIVE = 'https://drive.google.com/file/d/{id}/view';
var ARQUIVOS = {
  // Vídeos (.wmv)
  "Inv_de_Campo_Asia_Menor_Creta_parte_I.wmv": "1Wm7a1vSXB64qc3pIWUXtXsPNQoWs22kR",
  "Inv_de_Campo_Asia_Menor_Creta_parte_II.wmv": "1X07YlZ6FVtu3Z2UQtEGF5EO8QoJEv6Sd",
  "Inv_de_Campo_Asia_Menor_Creta_parte_III.wmv": "1eV1EUGAA_O_AXqG_NFC6wz7VLctuTrAI",
  "Inv_de_Campo_Himalaya_India_Parte_I.wmv": "1rSz4-Tozo4TLAFCbDGAj_3MZwmr_HCrb",
  "Inv_de_Campo_Himalaya_India_Parte_II.wmv": "1_cBx6P6PUBlDiWdgFluHzJl8KbORgnd3",
  "Inv_de_Campo_Himalaya_India_Parte_III.wmv": "1cbUgWYDHr_78Bc363GYbrvU9doYbmGUb",
  // Áudios (.mp3)
  "01-Preparacao-relax.mp3": "1wQ5CIwPP-THv0mWnRK765lvOMWUz3tmV",
  "01_a_crianca.mp3": "1IELxkeVVYQLCF-V6Jube18ldizMP9JQm",
  "01_a_protetora_da_vida.mp3": "19VqVgSJDV8vwH7bAesQ_yhwYdaAary_0",
  "01_a_repeticao.mp3": "1Dg0Z6hK-z5SpPf0lCm1icCaunLoJqAtb",
  "01_o_treno.mp3": "1dWEzjI6mpAkq2_aQWo2rvztMuZJHTuSb",
  "02-Relax-fisico-externo.mp3": "17Aa7Wogd1mI5sE0LMf4Bn_FHHvtDj6pe",
  "02_a_descida.mp3": "1WK6hzvuf1kuAkod-2ckgXW_uGXYmxiaf",
  "02_a_viagem.mp3": "1BxRPbSF6SG5r-osBvjpme1wqjAV2Zaiq",
  "02_o_animal.mp3": "1F2h5xLyRD6eHTF-F39FXukJPJRYqOPSR",
  "02_o_mineiro.mp3": "1Rqf0_pwbwoiouyBC9heZJVG_1x2cazOs",
  "03-Relax-fisico-interno.mp3": "1yGufSM2YlM3dFGR97cgKVvkya9uL8KD9",
  "03_o_festival.mp3": "1w0B5WCk0lmEbHf9PpLflz-DUoxY_6hj_",
  "03_o_guia_interno.mp3": "1YSNQ5jgY3cT3vOEF3geuNnS76dE27RrZ",
  "03_o_inimigo.mp3": "1Wfm40wJNXkA95bbydnmBSfNKMONR1r1B",
  "03_os_disfarces.mp3": "1RdhGrUX91HgkZRbZ1bOWbZPNHyG_kFgo",
  "04-Relax-mental.mp3": "1qs8b01hvwSrjAe2RA4MnOdXjunBK2c7s",
  "04_a_agonia.mp3": "1-lVws0CcX6NE-w99DXWrwo4zS-52l6A-",
  "04_a_desorientacao_e_o_guia_interno.mp3": "1A7OjitB-Y3rbfC9Nrt84X1j9jZBbfYMC",
  "04_a_subida.mp3": "1E6qDbalnaBVJFYX-rTfL20lFWUFPCAv9",
  "04_o_grande_erro.mp3": "1VtDXOiGN1Q6sgH2VUC-HcQqHyv8BOB6W",
  "05-Relax-completo.mp3": "1r8WmST33HOdIKimuRzJ1gTnf37iLyeBz",
  "05_a_perturbacao_e_o_guia_interno.mp3": "16kguntA0ezymL3EF0ttBPqYNOhjHFhRq",
  "05_as_nuvens.mp3": "1wW6q9MJoqDYPuEACoPO86FJiU4aQ9V07",
  "05_o_ressentimento.mp3": "1eaMZ2dQiPmCEkYGxWHQZVgNxRJqKK1HA",
  "06-Exp-paz.mp3": "1t5QW4pdZhTZdNS7OuRsqPXdICU01jUK_",
  "06_a_indecisao_e_o_guia_interno.mp3": "1pJUyQHgAnJX0IyYjph0Bv8vXBXgiI7jr",
  "06_avancos_e_retrocessos.mp3": "1qsoWOiKb6vPaxREenPW3XaeZ5SBozKwc",
  "06_o_limpador_de_chamines.mp3": "1u9tEy0BArw6fipTZShGTMNwf2Pftd70x",
  "07_a_acao_salvadora.mp3": "1HXbEifIUR7Js559DqNb6H5-gVzjrizOD",
  "07_a_saudade.mp3": "1p5Kr0sJiEZvGQybYc6z7SCMwPahi4EcS",
  "07_explicacoes_sobre_experiencias_guiadas.mp3": "1K4AGY2r9iyb63agURgBnYkPkN1srP3vO",
  "08_as_falsas_esperanças.mp3": "1OfdJUbA8Clfo45Dq7-IA_-JCI6_t1_74",
  "08_o_par_ideal.mp3": "1qjoG-qGoLj-oEfi_CLMYtRo9cO9iCERi",
  // PDFs
  "200202-KarenR-Energetical_Roots_India-ENG.pdf": "1k8rX4gBj-3x5dPQq4S68jPJrEHTivG3P",
  "20020218-AliciaO-El_Budismo_en_Sri_Lanka-ESP.pdf": "1a02EGAnPn8xHlvD_g9NFrlD5UiFfBByY",
  "20020218-AliciaO-Il_Buddhismo_in_Sri_Lanka-ITA.pdf": "1VyLcqUlL1Aygrgcr69oranrdt2mJaPQi",
  "200510-FranciscoG-Raices_Asiaticas_de_la_Disciplina_Energetica-ESP.pdf": "1DrmXEeR8znFjBnrFfgQlVHYYIfVQQBUf",
  "2007-HugoN-Intencionalidad_y_Evolucion-ESP.pdf": "1S3m6rhtGvHLFxhITSb6aBJo9M5UKzBmE",
  "2007-HugoN-Intenzionalita_nell_Evoluzione-ITA.pdf": "1NaDRSlmEWT3DS_Por38NpzhlByjLbyvT",
  "200802-DannyZ-Mad_Honey-ENG.pdf": "1XAwOUkfPuEjBQJshRarUs0fogWIGYvBf",
  "200809-MarcosP-El_Budismo_en_Camboya-ESP.pdf": "1jKXHZy_ig5QcZbEWcXMtQcJVlZ9wZ3e3",
  "200810-KarenR-Energetical_Roots_Asia_Minor_Crete-ENG.pdf": "1_r3uXkYzq8I-5s6asgA7CbxV3_T0R1uY",
  "200810-PiaF-Investigacion_Suenos-ESP.pdf": "1-4F6Ff6qnD_oQfxEk57M3hl2VSpKQOe-",
  "20081121-VictorP-Il_Trascorrere-ITA.pdf": "1a2AH0I8Yq2L4lv-aYdcVZeJQ2QhPAks1",
  "20090226-EduardoG-Antecedentes_en_Mesopotamia_de_la_Disciplina_Material-ESP.pdf": "1B44VvVbpkQ6GBqDsaFEL85SPetaeSJvS",
  "200903-DannyZ-Mesopotamian_origins_of_the_material_discipline-ENG.pdf": "1sy_8hpyDQ_huesCG7xuLbnvLcJTr0Nqo",
  "20090312-VictorP-El_transcurrir-ESP.pdf": "1U6eHrrqm8GHKqwSDr934kZOH_uVIqtxl",
  "20090912-HugoN-La_Entrada_a_lo_Profundo_en_Buda-ESP.pdf": "1mLOQwnZFRO95wrtEWxmOvY4d0ugwsME3",
  "20090916-LoredanaC-La_via_mentale_in_Parmenide-ITA.pdf": "1UX4nqvI8pugLj0t0rlHv5LE1BUfnCMsR",
  "20090917-AurelioC-Disciplina_Material_en_Mesopotamia-ESP.pdf": "19bI39dGr2RtEWrYW1v_ExU0qc4l-IOl-",
  "20090917-GuillermoS-Internalizacion_de_la_moral-ESP.pdf": "1c-ngp7gQZJKCnhQsL8CgHTCg0iKgV9i9",
  "20090918-BrunoP-Intoxicaciones_con_Mercurio_en_los_Alquimistas-ESP.pdf": "1NWLKIKWvOJtfMaBcCjLnlCmqRBZG-hhW",
  "20091222-HugoN-L_entrata_nel_Profondo_in_Budda-ITA.pdf": "1BrNiRFblStK1C3ZQPj4LP_MTxhE96gUZ",
  "20100115-MarianaU-Antecedents_Morphological_Discipline-ENG.pdf": "1wNl0HYoWQ4iM2Qmv-zD1UBCSJ_prksM0",
  "201003-PiaF-Referencias_a_la_conciencia_inspirada_en_Platon-ESP.pdf": "18dJ_ueBZt3M2w00qYa-PZFFCl9wjnjrk",
  "20100430-MarianaU-Los_Presocraticos-ESP.pdf": "1y0gKcFFXpI0IzLG1kz7Hhr4q7bols8Dv",
  "201005-FedericoP-L_ispirazione_nel_Surrealismo-ITA.pdf": "1I2xrlpiW56chISoPdNyd-osWLs-NMh2j",
  "20100712-MarianaU-Antecedentes_Disciplina_Morfologica-ESP.pdf": "1vf-PICb_8Jqdz_2ka5qjQmSUDYq5o1M5",
  "20100717-JanoA-El_campo_de_copresencia_en_la_estructura_Conciencia-Mundo-ESP.pdf": "1qsk42RttAZWwq6DMiJVhrTWmvsUzTWlF",
  "201008-ClaudioM-La_Doppia_Ascia_a_Creta-ITA-v2.pdf": "17FswniV-K2bICb0Wweq-EW1zhCvWpW0c",
  "201008-JoseGF-Oracion_del_Corazon_Estudio-ESP.pdf": "1qV7jumYwIU36GKaJmD-6XVtY0cO-ivVh",
  "20100802-AliciaO-El_Oscurecimiento_del_Ser_en_Occidente-ESP.pdf": "10Kg5evOxuFAIUra4s1_TJWxdys-aQRF3",
  "20100806-PiaF-References_aux_etats_de_conscience_inspiree_chez_Platon-FRA.pdf": "1Ukk8F1x-zHN4l4ofAelLfMau6Q7zTdFM",
  "20100821-PiaF-Estudio_sobre_Fidias-ESP.pdf": "1-QAopU1k7lWh_Lt9fMmvrPqXzFpRdn34",
  "20100830-PiaF-References_to_the_states_of_inspired_consciousness_in_Plato-ENG.pdf": "1Rpx9KvMSVJVJLEUPm5VThCwO4fcJZuxP",
  "201010-LuisM-Momentos_de_convergencia-ESP.pdf": "102jM0_4VPam7TPyrXYb0-wDNgusUH0yK",
  "20101028-PiaF-Etude_sur_Phidias-FRA.pdf": "1lvBdR3WwNAqXHuHrYrifbzaWEYrq0OZ5",
  "201012-MadeleineJ-Ierogamia_Sumeri-ITA.pdf": "1RGJ34cVrKpe5-Ac2wkuB4ITupFK247O2",
  "201012-MadeleineJ-Ierogamia_en_Sumeria-ESP.pdf": "1xWP73bECnn9YD3AS15okC-ODDslf7uh4",
  "201103-JuanE-Teresa_de_Jesus-ESP.pdf": "1tLQjIRN_RSffNu2SnPZ758zdLjo-bWk8",
  "201104-AnnaP-Spirali_Templi-Neolitici-ITA.pdf": "1K_Qa8rvvSa2HcT_VCy02ww35jex9J3cI",
  "201107-JoseGG-Empedocles-ESP.pdf": "1vr603eCampqikr0vi8QXpZR-kp0H-dUv",
  "201107-VictorP-La_Experiencia_del_Tiempo-ESP.pdf": "1Z58UxQNTC6d4bwazlLDmQdvxfzlopCmg",
  "Antecedentes-da-Displina-Material-no-antigo-Egito-.pdf": "1pQvW7tA41FGzeoy2Tpqy1DU1Y8Oorwpi",
  "Investigacao_Sonhos-1.pdf": "1ooaXCC2rrCB3jiKzdUdWj91I7BDrirru",
  "O-MASTRO-DE-ULISSES.pdf": "1KgAV-2R3eIYDZ57pN4022nE1v4p12pYA",
  "PT_O_Estilo_de_Vida_Maxi_Elegido.pdf": "1QPzVpKgF0FxWkpULo2Hk2pnD8jBNCE6H",
  "Projeto_Iconografico.pdf": "1cM_YkNAiTA909OF2Z884SFjO9EtH-ee_",
  "Silo-a-ceu-aberto-BR.pdf": "1Uuq_PKUiJ1c10u7rJXqGymWSeihd5w27",
  "investigacao_de_campo_raizesenergeticos_sul_da_india_port.pdf": "1HT-iLIavL2VYl-bgni_VhZrApV-GsXsb",
  "o-deleite-do-silencio-doc.original.pdf": "1FgeyUFJFIO3K9kKtf2i8rweqyAPjt529",
  // Word (.doc)
  "02_livro_autoliberacao.doc": "1Xc7ELaBSIsrrI77MT9OVsMYW0DHxlYVU",
  "03_Livro_Experiencias_Guiadas.doc": "1y23ztPruFV0EyS5XwRvidSi_2jU-Xht3",
  "05_Conferencia_Silo_Experiencias_Guiadas.doc": "1uARjRxIRg5bk7CNW_2N_xon9kjAlRe9n",
  "PSICOLOGIA_III_POR.doc": "1pcK6eZV0ELPFpNEIb3xrw-E_0NuKjgB1",
  "PSICOLOGIA_II_POR.doc": "1mhyWEo6KFcYTcQb23up4i1K4wbV0TDjw",
  "PSICOLOGIA_IV_POR_Conferencia_Silo.doc": "19ZJvVWttpiqba3K9pEo7e8DaWK1clQHC",
  "PSICOLOGIA_I_POR.doc": "1601GnvHI7w82R_AN4KnNb2IWwqyDvZCw",
  // Zip
  "20101227-HugoN-Chamanismo_Budismo-ESP.zip": "1VDbOmkoDC3l8T5hwxVSzjsSPHQrfOqrA",
};
window.PR_MATERIAIS = {
  arquivos: ARQUIVOS,
  // devolve o endereço final do arquivo, ou '' se ainda não houver
  url: function (nome) {
    var v = ARQUIVOS[nome];
    if (!v) return '';
    return /^https?:\/\//.test(v) ? v : DRIVE.replace('{id}', v);
  }
};
})();
