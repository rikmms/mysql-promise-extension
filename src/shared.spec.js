exports.dropTablesStatement = 'DROP TABLE USER_HOBBY; DROP TABLE USER; DROP TABLE HOBBY;'

exports.createTablesStatement = 
'create table if not exists USER ( ' +
'	id int auto_increment primary key, ' +
'	name varchar(128) not null ' +
'); ' +
'create table if not exists HOBBY ( ' +
'	name varchar(128) primary key ' +
'); ' +
'create table if not exists USER_HOBBY ( ' +
'	user_id int not null, ' +
'	hobby_name varchar(128) not null,	' +
'	foreign key(user_id) references USER(id), ' +
'	foreign key(hobby_name) references HOBBY(name),	' +
'	primary key(user_id, hobby_name) ' +
');'

exports.insertStatements = 
'set @@auto_increment_increment = 1; ' +
'insert into USER(name) values (\'rikmms\'); ' +
'insert into HOBBY(name) values(\'soccer\'); ' +
'insert into USER_HOBBY(user_id, hobby_name) values (1, \'soccer\');'