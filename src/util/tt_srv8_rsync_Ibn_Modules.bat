@echo on

rem c:\cygwin64\bin\bash --login -i -c "pwd"

set src=/cygdrive/f/svn_managed/ibn/Rnd/light_org/Orchard_current/src/Orchard.Web
set dest=srv8:/cygdrive/c/export/inetpub/tt_orchard

c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net stop w3svc'"
c:\cygwin64\bin\bash --login -i -c "rsync -rtv %src%/Modules/Ibn.Contacts/ %dest%/Modules/Ibn.Contacts/" 
c:\cygwin64\bin\bash --login -i -c "rsync -rtv %src%/Modules/Ibn.Events/   %dest%/Modules/Ibn.Events/" 
c:\cygwin64\bin\bash --login -i -c "rsync -rtv %src%/Modules/Ibn.Base/     %dest%/Modules/Ibn.Base/" 
c:\cygwin64\bin\bash --login -i -c "rsync -rtv %src%/Modules/Ibn.Tt/       %dest%/Modules/Ibn.Tt/" 

c:\cygwin64\bin\bash --login -i -c "rsync -rtv %src%/Themes/ %dest%/Themes/" 

c:\cygwin64\bin\bash --login -i -c "ssh srv8 'cd %dest%; icacls . /T /grant:r BUILTIN\\IIS_IUSRS:F  /inheritance:e' "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 'cd %dest%/App_Data; rm *.Cache; rm Sites/*/*.bin  "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net start w3svc'"


pause
