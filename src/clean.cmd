FOR %%b in ( 
       "C:\Cygwin64"
       "D:\Cygwin64"
       "C:\Cygwin"
       "C:\Cygwin"
    ) do (
    if exist %%b ( 
       set cygwindir=%%b
       goto exec
    )
)
  
echo "Unable to find cygwin"

:exec

%CygwinDir%\bin\bash --login -c "cd `cygpath '%CD%'` && bash clean.sh "

pause

