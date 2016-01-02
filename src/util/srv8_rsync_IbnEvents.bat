@echo on

rem c:\cygwin64\bin\bash --login -i -c "pwd"


c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net stop w3svc'"
c:\cygwin64\bin\bash --login -i -c "rsync -rtv /cygdrive/f/svn_managed/ibn/Rnd/light_org/Orchard.Source.1.7.2/src/Orchard.Web/Modules/Ibn.Events/ srv8:/cygdrive/c/export/inetpub/Orchard_172/Modules/Ibn.Events/" 
c:\cygwin64\bin\bash --login -i -c "ssh srv8 'cd /cygdrive/c/export/inetpub/Orchard_172 icacls * /T /grant:r BUILTIN\\IIS_IUSRS:F  /inheritance:e' "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net start w3svc'"


pause
