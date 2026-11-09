\set ON_ERROR_STOP off
set role authenticated;
-- A=primeiro cadastro (vira admin); B=segundo (leitor/pendente); C=será Responsável pelo Inventário
select set_config('request.uid','aaaaaaaa-0000-0000-0000-000000000001',false);
insert into perfis(id,nome,email,nivel,status) values ('aaaaaaaa-0000-0000-0000-000000000001','Ana','a@x.com','administrador','aprovado');
select set_config('request.uid','bbbbbbbb-0000-0000-0000-000000000002',false);
insert into perfis(id,nome,email,nivel,status,funcoes) values ('bbbbbbbb-0000-0000-0000-000000000002','Beto','b@x.com','administrador','aprovado','{inventario}');
select set_config('request.uid','cccccccc-0000-0000-0000-000000000003',false);
insert into perfis(id,nome,email) values ('cccccccc-0000-0000-0000-000000000003','Cida','c@x.com');
reset role;
select '1 perfis:' t, email, nivel, status, funcoes from perfis order by criado_em;
set role authenticated;
\echo '--- B tenta se promover (deve falhar)'
select set_config('request.uid','bbbbbbbb-0000-0000-0000-000000000002',false);
update perfis set nivel='administrador' where id='bbbbbbbb-0000-0000-0000-000000000002';
\echo '--- Admin A aprova B e dá função inventario; aprova C como leitor'
select set_config('request.uid','aaaaaaaa-0000-0000-0000-000000000001',false);
update perfis set status='aprovado', funcoes='{inventario}' where id='bbbbbbbb-0000-0000-0000-000000000002';
update perfis set status='aprovado' where id='cccccccc-0000-0000-0000-000000000003';
\echo '--- B (resp. inventário) grava item de inventário: deve OK; grava em pedidos: deve falhar'
select set_config('request.uid','bbbbbbbb-0000-0000-0000-000000000002',false);
insert into registros(colecao,id,dados) values ('inv_itens','i1','{"codigo":"INV-0001","nome":"Mesa"}');
insert into registros(colecao,id,dados) values ('pedidos','p1','{"nome":"x"}');
\echo '--- C (leitor) lê inv_itens (deve ver 1), tenta gravar (deve falhar), lê contas (0)'
select set_config('request.uid','cccccccc-0000-0000-0000-000000000003',false);
select count(*) as c_ve_inv from registros where colecao='inv_itens';
insert into registros(colecao,id,dados) values ('inv_itens','i2','{"nome":"hack"}');
select count(*) as c_ve_contas from registros where colecao='contas';
\echo '--- B edita com versão correta, depois com versão velha (conflito)'
select set_config('request.uid','bbbbbbbb-0000-0000-0000-000000000002',false);
update registros set dados='{"codigo":"INV-0001","nome":"Mesa 2"}' where colecao='inv_itens' and id='i1' and versao=1;
update registros set dados='{"nome":"velho"}', versao=1 where colecao='inv_itens' and id='i1';
\echo '--- B tenta DELETE físico (deve falhar) e exclusão lógica (OK)'
delete from registros where colecao='inv_itens' and id='i1';
update registros set excluido_em=now() where colecao='inv_itens' and id='i1';
select count(*) as b_ve_ativos from registros where colecao='inv_itens' and excluido_em is null;
\echo '--- código permanente: duplicado deve falhar; formato inválido deve falhar'
insert into inv_codigos(codigo,item_id) values ('INV-0001','i1');
insert into inv_codigos(codigo,item_id) values ('INV-0001','i9');
insert into inv_codigos(codigo,item_id) values ('xx','i9');
\echo '--- auditoria: B não lê; admin lê; ninguém altera'
select count(*) as b_ve_aud from auditoria;
select set_config('request.uid','aaaaaaaa-0000-0000-0000-000000000001',false);
select operacao, colecao, registro_id from auditoria where tabela='registros' order by id;
delete from auditoria;
update auditoria set operacao='x';
\echo '--- admin enxerga registro excluido logicamente'
select count(*) as admin_ve_excluidos from registros where excluido_em is not null;
