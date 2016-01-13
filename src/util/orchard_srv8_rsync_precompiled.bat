@echo on

call orchard_srv8_rsync_parameters.bat

c:\cygwin64\bin\bash --login -i -c "rsync -rtv --exclude=obj/ %precompiled%/ %dest%/" 

orchard_srv8_set_permissions.bat


c:\cygwin64\bin\bash --login -i -c "ssh srv8 'cd %dest_dir%/App_Data; rm *.Cache; rm Sites/*/*.bin  ' "


pause
