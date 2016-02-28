set PATH=c:\cygwin64\bin;%PATH%
bash -c ' rm -r `find src \( -name "obj" -o -name "bin" \) -type d  ` '
bash -c ' rm -r `find src/Orchard.Web/App_Data \( -name "*.dat" -o -name "*.bin" \) ` '
bash -c ' rm -r `find .  -wholename "*Dependencies/*.dll" ` '
rmdir "C:\Users\baruch\AppData\Local\Temp\Temporary ASP.NET Files\*" /s /q
pause
