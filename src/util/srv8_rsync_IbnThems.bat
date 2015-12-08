@echo on

c:\cygwin64\bin\bash --login -i -c "rsync -rtv /cygdrive/f/svn_managed/ibn/Rnd/light_org/Orchard_current/src/Orchard.Web/Themes/ srv8:/cygdrive/c/export/inetpub/Orchard_180a/Themes/ "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 'cd /cygdrive/c/export/inetpub/Orchard_172/ icacls * /T /grant:r BUILTIN\\IIS_IUSRS:R  /inheritance:e' "

pause
