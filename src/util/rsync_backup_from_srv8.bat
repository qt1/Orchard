@echo on


set local_base=/cygdrive/z/Backup/srv8
set local_sql_backup=%local_base%/Sql/Backup

set remote_server=srv8
set remote_sql_dir=/cygdrive/c/Data/SQL/Backup
set remote_sql=%remote_server%:%remote_sql_dir%

c:\cygwin64\bin\bash --login -i -c "rsync -rtv %remote_sql%/ %local_sql_backup%/" 


pause
