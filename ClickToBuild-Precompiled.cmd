SET solution=src\Orchard_ibn.sln
CALL ClickToBuild Precompiled
rem c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net stop w3svc'"
rem prcomplied_`date +%F`.`git rev-parse --abbrev-ref HEAD`.`git rev-parse HEAD`

"C:\Program Files\Git\mingw64\bin\git.exe" rev-parse HEAD > build\Precompiled\revision.txt
