@echo on


set local_base=/cygdrive/e/Backup/srv8
set local_sql_backup=%local_base%/Sql/Backup

set remote_server=srv8
set remote_sql_dir=/cygdrive/c/Data/SQL/Backup
set remote_sql=%remote_server%:%remote_sql_dir%

c:\cygwin64\bin\bash --login -i -c "rsync -rtv --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r %remote_sql%/ %local_sql_backup%/ " 
c:\cygwin64\bin\bash --login -i -c "chmod a+r * " 

pause
