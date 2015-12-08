: <<TRAMPOLINE
@echo on

C:\cygwin\bin\bash -c "exit 0" || (echo.No bash found in PATH! & exit /b 1)
C:\cygwin\bin\bash --login -i -l "%~f0" "%CD%" "%*" 

pause

goto :EOF
 
TRAMPOLINE
#####################
#!/bin/bash  -- it's traditional!
(set -o igncr) 2>/dev/null && set -o igncr; # this comment is needed

#cd back to directory of batch
cd "`cygpath $1`"
shift
echo Working from $PWD

target=Orchard_181_current

ssh srv8 'net stop w3svc'

for module in $(cd src/Orchard.Web/Modules; ls -d Ibn*)  ; do
  echo $module 
  rsync -av --exclude "obj/**" --delete-excluded --delete src/Orchard.Web/Modules/$module/ srv8:/cygdrive/c/export/inetpub/$target/Modules/$module/ 
done

rsync -av --delete src/Orchard.Web/Themes/ srv8:/cygdrive/c/export/inetpub/$target/Themes/ 

#  ssh srv8 "( cd /cygdrive/c/export/inetpub/$target && pwd && icacls . /T /grant:r IUSR:(I)F  /grant:r IIS_IUSRS:(I)F )"

IFS=' '; for i in .:RX App_Data:F Media:F Modules:F Themes:F; do 
  IFS=':' ; declare -a e=($i);
  dir=${e[0]}; 
  access=${e[1]};
  echo Changing permissions on $dir to $access 
  ssh srv8 " cd /cygdrive/c/export/inetpub/$target && pwd && icacls $dir /Q /T /grant:r IUSR:\(OI\)\(CI\)$access  /grant:r IIS_IUSRS:\(OI\)\(CI\)$access "
done

echo Cache cleanup

ssh srv8 "( cd /cygdrive/c/export/inetpub/$target/App_Data && ( rm *.Cache; rm Sites/*/*.bin ) )"

ssh srv8 'net start w3svc'



