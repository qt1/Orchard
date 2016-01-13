@echo on

call orchard_srv8_rsync_parameters.bat

c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net stop w3svc'"
c:\cygwin64\bin\bash --login -i -c "rsync -rtv --exclude=obj/ %src%/Ibn_Modules/ %dest%/Ibn_Modules/" 
c:\cygwin64\bin\bash --login -i -c "rsync -rtv --exclude=obj/ %src%/Ibn_Themes/   %dest%/Ibn_Themes/" 

c:\cygwin64\bin\bash --login -i -c "rsync -rtv --exclude=obj/ %src%/Themes/ %dest%/Themes/" 

call orchard_srv8_set_permissions.bat

c:\cygwin64\bin\bash --login -i -c "ssh srv8 'cd %dest%/App_Data; rm *.Cache; rm Sites/*/*.bin  "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 'net start w3svc'"


pause
