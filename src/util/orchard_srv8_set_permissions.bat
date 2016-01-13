@echo on

call orchard_srv8_rsync_parameters.bat

c:\cygwin64\bin\bash --login -i -c "ssh srv8 \"cd %dest_dir%; icacls . /T /grant 'IIS_IUSRS:(OI)(CI)(RX)' /inheritance:e \" "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 \"cd %dest_dir%/App_Data; icacls . /T /grant 'IIS_IUSRS:(OI)(CI)(F)' /inheritance:e \" "
c:\cygwin64\bin\bash --login -i -c "ssh srv8 \"cd %dest_dir%/Media; icacls . /T /grant 'IIS_IUSRS:(OI)(CI)(F)' /inheritance:e \" "


