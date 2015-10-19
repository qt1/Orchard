set cygwindir=C:\Cygwin64

%CygwinDir%\bin\bash --login -c "cd `cygpath '%CD%'` && bash clean.sh "

pause

